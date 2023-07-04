import { polling } from '@miso.ai/commons';
import ApiBase from './base';

export default class Ask extends ApiBase {

  constructor(api) {
    super(api, 'ask');
  }

  async questions(payload, options = {}) {
    if (typeof payload === 'string' && payload.charAt(0) !== '{') {
      return new Answer(this, { question_id: payload }, options);
    }
    const response = await this._run('questions', payload, options);
    return new Answer(this, response, options);
  }

  async _questions(payload, options) {
    return this._run('questions', payload, options);
  }

  async _get(questionId, options) {
    return this._run(`questions/${questionId}/answer`, undefined, { ...options, method: 'GET' });
  }

}

class Answer {

  constructor(api, { question_id }, { signal: _, ...options } = {}) {
    // TODO: take external singal as well?
    this._api = api;
    this._questionId = question_id;
    this._ac = new AbortController();
    this._options = { ...options, signal: this._ac.signal };
  }

  get questionId() {
    return this._questionId;
  }

  async get(options) {
    options = { ...this._options, ...options };
    return this._api._get(this._questionId, options);
  }

  abort() {
    this._ac.abort();
  }

  [Symbol.asyncIterator]() {
    const fetch = async ({ signal } = {}) => {
      // TODO: pass signal
      const response = await this.get();
      return [response, response.finished];
    };
    const { pollingInterval: interval, ...options } = this._options;
    return polling(fetch, { interval, ...options })[Symbol.asyncIterator]();
  }

}
