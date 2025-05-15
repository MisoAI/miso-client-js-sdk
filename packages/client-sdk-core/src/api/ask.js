import { API, defineValues } from '@miso.ai/commons';
import ApiBase from './base.js';
import { IdBasedIterableApiStub } from './iterable.js';

const { GROUP, NAME } = API;

export default class Ask extends ApiBase {

  constructor(api) {
    super(api, GROUP.ASK);
  }

  async questions(payload, options = {}) {
    if (isId(payload)) {
      return new Answer(this, payload, options);
    }
    const response = await this._run(NAME.QUESTIONS, payload, options);
    return new Answer(this, response, options);
  }

  async _questions(payload, options) {
    return this._run(NAME.QUESTIONS, payload, options);
  }

  async _questionGet(questionId, options) {
    return this._run(`${NAME.QUESTIONS}/${questionId}/answer`, undefined, { ...options, method: 'GET' });
  }

  async relatedQuestions(payload, options = {}) {
    return this._run(NAME.RELATED_QUESTIONS, payload, options);
  }

  async trendingQuestions(payload, options = {}) {
    return this._run(NAME.TRENDING_QUESTIONS, payload, options);
  }

  async search(payload, options = {}) {
    const response = await this._run(NAME.SEARCH, payload, options);
    return response.question_id ? new SearchResult(this, response, options) : response;
  }

  async _searchGet(questionId, options) {
    return this._run(`${NAME.QUESTIONS}/${questionId}/answer`, undefined, { ...options, method: 'GET' });
  }

  async autocomplete(payload, options) {
    return this._run(NAME.AUTOCOMPLETE, payload, options);
  }

  async searchAutocomplete(payload, options) {
    return this._run(NAME.SEARCH_AUTOCOMPLETE, payload, options);
  }

}

class Answer extends IdBasedIterableApiStub {

  constructor(api, response, options = {}) {
    super(api, '_questionGet', response.question_id, options);
    this._response = response;
  }

  get questionId() {
    return this._id;
  }

}

class SearchResult extends IdBasedIterableApiStub {

  constructor(api, response, options = {}) {
    super(api, '_searchGet', response.question_id, options);
    defineValues(this, response);
    this._response = response;
  }

  get questionId() {
    return this._id;
  }

}

// helpers //
function isId(value) {
  return typeof value === 'string' && value.charAt(0) !== '{';
}
