/** @module core */

import { polling, signals, StallTimeoutAbortController } from '@miso.ai/commons';

/**
 * A handle on an answer that the server generates over time, returned by APIs
 * such as `client.api.ask.questions()`, `client.api.ask.search()`, and
 * `client.api.ask.answers()`.
 *
 * Iterate it with `for await` to receive the response as it progresses. The
 * stub polls the server in the background, and each iteration yields the
 * latest full response, not a delta. When the consumer is slower than the
 * polling, intermediate responses are skipped. The iteration ends once the
 * response is finished (`finished: true`).
 *
 * To read the response just once without polling, call `get()`.
 *
 * Polling can be tuned by the request options passed to the API method:
 *
 * - `pollingInterval` - Milliseconds between polls. Defaults to 1000.
 * - `stallTimeout` - Milliseconds without progress before polling gives up
 *   with an error. Defaults to 120000.
 * - `signal` - An `AbortSignal` to stop the polling.
 *
 * Polling also stops when `abort()` is called. If the abort reason is an
 * `Error` (including the default `AbortError` when no reason is given), the
 * iteration throws it; with any other reason, the iteration just ends. The
 * iteration also throws when polling fails more than 10 times in a row.
 *
 * @example
 * const answer = await client.api.ask.questions({ question: 'What is Miso?' });
 * for await (const response of answer) {
 *   render(response.answer);
 * }
 *
 * @example
 * // stop polling, e.g. when the user navigates away
 * answer.abort();
 */
export class IterableApiStub {

  constructor(options = {}) {
    this._ac = new AbortController();
    this._options = options;
  }

  /**
   * Fetch the current response once, without polling.
   *
   * @param {Object} [options] - Request options, merged over the ones given to the API method.
   * @returns {Promise<Object>}
   */
  async get(options) {
    return this._get({ ...this._options, ...options });
  }

  _get(options) {
    throw new Error('Not implemented');
  }

  /**
   * Stop polling. An ongoing iteration throws `reason` if it is an `Error`, or
   * an `AbortError` if no reason is given; otherwise the iteration just ends.
   *
   * @param {*} [reason]
   */
  abort(reason) {
    this._ac.abort(reason);
  }

  /**
   * Start polling, yielding the latest response until it is finished.
   *
   * @returns {AsyncIterator<Object>}
   */
  [Symbol.asyncIterator]() {
    const fetch = this._fetch();

    if (typeof this._options.customIterator === 'function') {
      return this._options.customIterator.call(this, fetch);
    }

    let { pollingInterval: interval, signal, stallTimeout = 120000, ...options } = this._options;
    const stac = new StallTimeoutAbortController(stallTimeout);
    signal = signals.any(this._ac.signal, stac.signal, signal);
    // the stall timer must die with the stream: a timer armed past an abort
    // would keep a Node process alive for the full stall timeout. The signal
    // may have aborted before this iterator was created (it is captured at
    // request time), so the already-aborted case has to be handled as well.
    if (signal.aborted) {
      stac.clear();
    } else {
      signal.addEventListener('abort', () => stac.clear());
    }

    let prevResponse;
    const onResponse = (response, finished) => {
      if (finished) {
        stac.clear();
      } else if (this._isUpdated(prevResponse, response)) {
        stac.touch();
      }
      prevResponse = response;
    };
    return polling(fetch, { interval, signal, onResponse, ...options })[Symbol.asyncIterator]();
  }

  /**
   * Compose the polling fetch: () => [response, finished, revision].
   * Overridable by a subclass with its own finish or revision semantics
   * (e.g. Answers, whose question ids may run dry).
   *
   * @private
   */
  _fetch() {
    return async ({ signal } = {}) => {
      // TODO: pass signal
      const response = await this.get();
      return [response, isFinished(response), revisionOf(response)];
    };
  }

  // whether the new response carries progress, keeping the stall timeout at
  // bay; overridable by a subclass with its own response shape
  _isUpdated(previousResponse, newResponse) {
    return isUpdated(previousResponse, newResponse);
  }

}

export class IdBasedIterableApiStub extends IterableApiStub {

  constructor(api, method, id, options) {
    super(options);
    this._api = api;
    this._method = method;
    this._id = id;
  }

  async _get(options) {
    return this._api[this._method](this._id, options);
  }

}

function isFinished(response) {
  return !!(response && response.finished);
}

function isUpdated(previousResponse, newResponse) {
  return !previousResponse ||
    previousResponse.answer_stage !== newResponse.answer_stage ||
    lengthOf(previousResponse.answer) !== lengthOf(newResponse.answer) ||
    lengthOf(previousResponse.reasoning) !== lengthOf(newResponse.reasoning);
}

function revisionOf(response) {
  return response && response.revision;
}

function lengthOf(value = '') {
  return value.length;
}
