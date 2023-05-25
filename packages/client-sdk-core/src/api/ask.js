import { ValueBuffer } from '@miso.ai/commons';
import ApiBase from './base';

export default class Ask extends ApiBase {

  constructor(api) {
    super(api, 'ask');
  }

  async questions(payload, options = {}) {
    const response = await this._run('questions', payload, options);
    return new Answer(this, response, options);
  }

  async _questions(payload, options) {
    return this._run('questions', payload, options);
  }

  async _get(questionId, options) {
    return this._run(`questions/${questionId}/answer`, undefined, { ...options, method: 'GET' });
  }

  // TODO: move impl away
  _iterable(questionId, { pollingInterval = 1000, signal, ...options } = {}) {
    if (signal && signal.aborted) {
      return [];
    }
    let apiErrorCount = 0;
    const buffer = new ValueBuffer();
    const intervalId = setInterval(async () => {
      let response;
      try {
        response = await this._get(questionId, options);
      } catch(error) {
        console.error(error); // TODO
        apiErrorCount++;
        if (apiErrorCount > 10) {
          clearInterval(intervalId);
          buffer.error(error);
        }
        return;
      }
      const { finished } = response;
      buffer.update(response, finished);
      if (response.finished) {
        clearInterval(intervalId);
      }
    }, pollingInterval);

    if (signal && signal.addEventListener) {
      signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        // TODO: optimize: abort current request as well
        buffer.abort();
      });
    }

    return buffer;
  }

}

class Answer {

  constructor(api, { question_id }, { signal, ...options } = {}) {
    this._api = api;
    this._id = question_id;
    this._ac = new AbortController();
    this._options = { ...options, signal: this._ac.signal };
  }

  get id() {
    return this._id;
  }

  async get(options) {
    options = { ...this._options, ...options };
    return this._api._get(this._id, options);
  }

  abort() {
    this._ac.abort();
  }

  [Symbol.asyncIterator]() {
    return this._api._iterable(this._id, this._options)[Symbol.asyncIterator]();
  }

}
