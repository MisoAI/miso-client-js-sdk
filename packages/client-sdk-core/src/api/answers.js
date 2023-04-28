import { ValueBuffer } from '@miso.ai/commons';
import ApiBase from './base';

export default class Answers extends ApiBase {

  constructor(api) {
    super(api, 'answers');
  }

  async answer(payload, { iterable = false, ...options } = {}) {
    return typeof payload === 'string' ? this._get(payload, options) : iterable ? this._iterable(payload, options) : this._answer(payload, options);
  }

  async _answer(payload, options) {
    return this._run('questions', payload, options);
  }

  async _get(answerId, options) {
    return this._run(`questions/${answerId}/answer`, undefined, { ...options, method: 'GET' });
  }

  async * _iterable(payload, { pollingInternal = 500, ...options } = {}) {
    const response = await this._answer(payload, options);
    yield response;
    const { question_id, finished } = response;
    if (finished) {
      return;
    }
    const buffer = new ValueBuffer();
    const intervalId = setInterval(async () => {
      const response = await this._get(question_id, options);
      const { finished } = response;
      buffer.update(response, finished);
      if (response.finished) {
        clearInterval(intervalId);
      }
    }, pollingInternal);

    yield* buffer;
  }

}
