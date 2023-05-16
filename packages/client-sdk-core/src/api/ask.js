import { ValueBuffer } from '@miso.ai/commons';
import ApiBase from './base';

export default class Ask extends ApiBase {

  constructor(api) {
    super(api, 'ask');
  }

  questions(payload, { iterable = false, ...options } = {}) {
    // TODO: it's possible to merge _iterator and _answer
    return typeof payload === 'string' ? this._get(payload, options) : iterable ? this._iterator(payload, options) : this._questions(payload, options);
  }

  async _questions(payload, options) {
    return this._run('questions', payload, options);
  }

  async _get(answerId, options) {
    return this._run(`questions/${answerId}/answer`, undefined, { ...options, method: 'GET' });
  }

  async * _iterator(payload, { pollingInternal = 500, ...options } = {}) {
    const response = await this._questions(payload, options);
    yield response;
    const { question_id, finished } = response;
    if (finished) {
      return;
    }
    let apiErrorCount = 0;
    const buffer = new ValueBuffer();
    const intervalId = setInterval(async () => {
      let response;
      try {
        response = await this._get(question_id, options);
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

    yield* buffer;
  }

}
