import { API, defineValues, trimObj } from '@miso.ai/commons';
import ApiBase from './base.js';
import UserHistoryV0 from './history.0.js';
import { IterableApiStub, IdBasedIterableApiStub } from './iterable.js';

const { GROUP, NAME } = API;

export default class Ask extends ApiBase {

  constructor(api) {
    super(api, GROUP.ASK);
    // the deployed (v0) user history API; switch back to UserHistory
    // (history.js) when the resource-style API ships
    this.userHistory = new UserHistoryV0(api);
  }

  async questions(payload, options = {}) {
    if (isId(payload)) {
      payload = { question_id: payload };
    }
    if (payload.question_id) {
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

  /**
   * Retrieve multiple question-answer pairs at once: an iterable that polls
   * the answers endpoint, like questions(). The id set is mutable between
   * polls: `question_ids` may be a function returning the id array, resolved
   * for every poll, and a fixed initial array settles out record by record
   * (see Answers).
   */
  async answers(payload, options = {}) {
    if (Array.isArray(payload)) {
      payload = { question_ids: payload };
    }
    return new Answers(this, payload, { immediate: true, ...options });
  }

  async relatedQuestions(payload, options = {}) {
    return this._run(NAME.RELATED_QUESTIONS, payload, options);
  }

  async trendingQuestions(payload, options = {}) {
    return this._run(NAME.TRENDING_QUESTIONS, payload, options);
  }

  async search(payload, options = {}) {
    if (isId(payload)) {
      payload = { question_id: payload };
    }
    if (payload.question_id) {
      return new SearchResult(this, payload, options);
    }
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

  async querySuggestion(payload, options) {
    return this._run(NAME.QUERY_SUGGESTION, payload, options);
  }

}

class Answer extends IdBasedIterableApiStub {

  constructor(api, response, options = {}) {
    super(api, '_questionGet', response.question_id, mergeCustomApiIterator(api, options));
    this._response = response;
  }

  get questionId() {
    return this._id;
  }

}

/**
 * The answer contents of a set of questions, polled until settled — the id
 * set is mutable between polls, and the stream ends when it runs dry. The
 * question ids may be given as a function returning the id array, resolved
 * for every poll (settled ids drop out, new ones join, at the provider's
 * discretion); a fixed initial id array is mutable all the same — its ids
 * settle out as their records come back finished (_settle). Each fetch's
 * issue order acts as the response revision, so a late, outdated response
 * is discarded by the polling.
 */
class Answers extends IterableApiStub {

  constructor(api, payload, options = {}) {
    super(mergeCustomApiIterator(api, options));
    this._api = api;
    this._payload = payload;
    const { question_ids } = payload;
    this._pending = typeof question_ids === 'function' ? undefined : new Set(question_ids || []);
  }

  async _get(options) {
    // a plain one-shot read of the current ids' answers
    return this._api._run(NAME.ANSWERS, { ...this._payload, question_ids: this._questionIds() }, options);
  }

  _questionIds() {
    return this._pending ? [...this._pending] : this._payload.question_ids();
  }

  // a fixed id set settles by the records themselves: a record that came
  // back with its finished answer needs no further polling
  _settle(response) {
    if (!this._pending || !Array.isArray(response)) {
      return;
    }
    for (const record of response) {
      if (record && record.answer !== undefined && record.finished !== false) {
        this._pending.delete(record.question_id);
      }
    }
  }

  _fetch() {
    let index = 0;
    return async ({ signal } = {}) => {
      const i = ++index; // taken at issue time: a stale response resolves with a lower revision
      const question_ids = this._questionIds();
      if (!question_ids || !question_ids.length) {
        return [undefined, true, i]; // nothing left to fetch; the stream ends
      }
      // TODO: use single answer endpoint when array length = 1
      const response = await this._api._run(NAME.ANSWERS, { ...this._payload, question_ids }, { signal });
      this._settle(response);
      return [response, false, i];
    };
  }

  // any response is progress for the stall timeout: the record-diff test of
  // the base class reads a single answer's shape, not an array of records
  _isUpdated() {
    return true;
  }

}

class SearchResult extends IdBasedIterableApiStub {

  constructor(api, response, options = {}) {
    super(api, '_searchGet', response.question_id, mergeCustomApiIterator(api, options));
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

function mergeCustomApiIterator(api, options) {
  const customIterator = api.helpers._root._customApiIterator;
  return trimObj({
    customIterator,
    ...options,
  });
}
