import { polling, signals, StallTimeoutAbortController, API } from '@miso.ai/commons';
import ApiBase from './base.js';

const { GROUP, NAME } = API;

export default class Ask extends ApiBase {

  constructor(api) {
    super(api, GROUP.ASK);
  }

  async questions(payload, options = {}) {
    if (typeof payload === 'string' && payload.charAt(0) !== '{') {
      return new Answer(this, { question_id: payload }, options);
    }
    const response = await this._run(NAME.QUESTIONS, payload, options);
    return new Answer(this, response, options);
  }

  async _questions(payload, options) {
    return this._run(NAME.QUESTIONS, payload, options);
  }

  async _get(questionId, options) {
    return this._run(`${NAME.QUESTIONS}/${questionId}/answer`, undefined, { ...options, method: 'GET' });
  }

  async relatedQuestions(payload, options = {}) {
    return this._run(NAME.RELATED_QUESTIONS, payload, options);
  }

}

class Answer {

  constructor(api, { question_id }, options = {}) {
    this._api = api;
    this._questionId = question_id;
    this._ac = new AbortController();
    this._options = options;
  }

  get questionId() {
    return this._questionId;
  }

  async get(options) {
    return this._api._get(this._questionId, { ...this._options, ...options });
  }

  abort(reason) {
    this._ac.abort(reason);
  }

  [Symbol.asyncIterator]() {
    const fetch = async ({ signal } = {}) => {
      // TODO: pass signal
      const response = await this.get();
      return [response, response.finished, response.revision];
    };
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

function isUpdated(prev, curr) {
  return !prev || prev.answer_stage !== curr.answer_stage || prev.answer.length !== curr.answer.length;
}
