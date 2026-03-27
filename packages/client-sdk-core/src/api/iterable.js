import { polling, signals, StallTimeoutAbortController } from '@miso.ai/commons';

export class IterableApiStub {

  constructor(options = {}) {
    this._ac = new AbortController();
    this._options = options;
  }

  async get(options) {
    return this._get({ ...this._options, ...options });
  }

  _get(options) {
    throw new Error('Not implemented');
  }

  abort(reason) {
    this._ac.abort(reason);
  }

  [Symbol.asyncIterator]() {
    const fetch = async ({ signal } = {}) => {
      // TODO: pass signal
      const response = await this.get();
      return [response, isFinished(response), revisionOf(response)];
    };

    if (typeof this._options.customIterator === 'function') {
      return this._options.customIterator.call(this, fetch);
    }

    let { pollingInterval: interval, signal, stallTimeout = 120000, ...options } = this._options;
    const stac = new StallTimeoutAbortController(stallTimeout);
    signal = signals.any(this._ac.signal, stac.signal, signal);

    let prevResponse;
    const onResponse = (response, finished) => {
      if (finished) {
        stac.clear();
      } else if (isUpdated(prevResponse, response)) {
        stac.touch();
      }
      prevResponse = response;
    };
    return polling(fetch, { interval, signal, onResponse, ...options })[Symbol.asyncIterator]();
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
