import { ValueBuffer } from '@miso.ai/commons';
import ApiBase from './base';

export default class Ask extends ApiBase {

  constructor(api) {
    super(api, 'ask');
  }

  async questions(payload, options = {}) {
    const response = await this._run('questions', payload, options);
    return new Answer(this, response);
  }

  async _questions(payload, options) {
    return this._run('questions', payload, options);
  }

  async _get(questionId, options) {
    return this._run(`questions/${questionId}/answer`, undefined, { ...options, method: 'GET' });
  }

  _iterable(questionId, { pollingInternal = 1000, ...options } = {}) {
    // TODO: abort signal
    let apiErrorCount = 0;
    const buffer = new ValueBuffer();
    const intervalId = setInterval(async () => {
      let response;
      try {
        response = await this._get(questionId, options);
      } catch(error) {
        apiErrorCount++;
        if (apiErrorCount > 10) {
          clearInterval(intervalId);
          // TODO: cascade to buffer and user
        }
        console.error(error); // TODO
        return;
      }
      const { finished } = response;
      buffer.update(response, finished);
      if (response.finished) {
        clearInterval(intervalId);
      }
    }, pollingInternal);

    return buffer;
  }

}

class Answer {

  constructor(api, { question_id }, options = {}) {
    this._api = api;
    this._id = question_id;
    this._options = options;
  }

  get id() {
    return this._id;
  }

  async get(options) {
    options = { ...this._options, ...options };
    return this._api._get(this._id, options);
  }

  [Symbol.asyncIterator]() {
    return this._api._iterable(this._id, this._options)[Symbol.asyncIterator]();
  }

}
