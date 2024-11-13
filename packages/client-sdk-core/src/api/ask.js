import { API, defineValues, isNullLike } from '@miso.ai/commons';
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
    const { question_id } = await this._run(NAME.QUESTIONS, payload, options);
    return new Answer(this, question_id, options);
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

  async search(payload, options = {}) {
    const response = await this._run(NAME.SEARCH, payload, options);
    return response.question_id ? new SearchWithAnswer(this, response, options) : new SearchWithoutAnswer(response);
  }

  async _searchGet(questionId, options) {
    return this._run(`${NAME.SEARCH}/${questionId}/answer`, undefined, { ...options, method: 'GET' });
  }

}

class Answer extends IdBasedIterableApiStub {

  constructor(api, questionId, options = {}) {
    super(api, '_questionGet', questionId, options);
  }

  get questionId() {
    return this._id;
  }

}

class SearchWithAnswer extends IdBasedIterableApiStub {

  constructor(api, response, options = {}) {
    super(api, '_searchGet', response.question_id, options);
    defineValues(this, { searchResults: getSearchResults(response) });
  }

  get questionId() {
    return this._id;
  }

}

class SearchWithoutAnswer {

  constructor(response) {
    defineValues(this, { searchResults: getSearchResults(response) });
  }

}

// helpers //
function isId(value) {
  return typeof value === 'string' && value.charAt(0) !== '{';
}

function getSearchResults(response) {
  const { products, hits, facets } = response;
  return { products, hits, facets };
}
