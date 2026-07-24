import { API } from '@miso.ai/commons';
import Workflow from './base.js';
import { fields } from '../actor/index.js';
import { ROLE, STATUS, BUS_EVENT, REQUEST_TYPE, WORKFLOW_CONFIGURABLE } from '../constants.js';
import { mergeRolesOptions, mergeApiOptions, makeConfigurable } from './options/index.js';
import { getThreadId, normalizeThreadValue, getPendingQuestionIds, mergeAnswersDataFromResponse } from '../util/threads.js';

const ROLES_OPTIONS = mergeRolesOptions(Workflow.ROLES_OPTIONS, {
  main: ROLE.MESSAGES,
  members: [ROLE.MESSAGES],
  mappings: {
    [ROLE.MESSAGES]: data => data.value && data.value.messages,
  },
});

/**
 * The conversation panel of the chat history interface, backed by the user
 * history API. Displays one thread at a time: load(threadId) starts a new
 * session (aborting an in-flight fetch) and fetches the thread detail.
 *
 * The data flow takes two requests per session, both going down the standard
 * data path — `_request()` → hub `request` → DataActor → source — in the
 * manner of search-based workflows' query/more requests, with the handling
 * split by `request.type` (REQUEST_TYPE) on the way in:
 *
 * 1. THREAD (head): `GET threads/{id}` retrieves the thread detail, whose
 *    turns are question ids (or records without answer bodies).
 * 2. ANSWERS (follow-up): when the head data lands, a request to the answers
 *    API is issued with the pending `question_ids`, overriding the api
 *    group/name per request (from the resolved `answers` options, a
 *    configurable feature: defaults store < context < useAnswers()) since the
 *    two requests go to different API paths — both paths are resolved by the
 *    source (source.js). Its response is merged into the head data's messages
 *    rather than replacing it, and its loading update keeps the head data on
 *    display (`mergeAnswersDataFromResponse`, in the manner of
 *    `concatItemsFromMoreResponse`).
 *
 * Communicates with the history workflow over the per-client workflow event
 * bus (see BUS_EVENT): loads threads selected in the history panel, announces
 * loaded threads (so the history panel marks them as read), and resets when
 * its current thread is deleted.
 */
export default class Conversation extends Workflow {

  constructor(plugin, client) {
    super({
      name: 'conversation',
      plugin,
      client,
      roles: ROLES_OPTIONS,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    this._threadId = undefined;
  }

  _initSubscriptions(args) {
    super._initSubscriptions(args);
    const events = this._workflowEvents;
    this._unsubscribes = [
      ...this._unsubscribes,
      events.on(BUS_EVENT.THREAD_SELECT, event => this._onThreadSelect(event)),
      events.on(BUS_EVENT.THREAD_UPDATED, event => this._onThreadUpdated(event)),
      events.on(BUS_EVENT.THREAD_DELETED, event => this._onThreadDeleted(event)),
    ];
  }

  // properties //
  get threadId() {
    return this._threadId;
  }

  get thread() {
    const data = this._hub.states[fields.data()];
    return data && data.value && data.value.thread;
  }

  get messages() {
    const data = this._hub.states[fields.data()];
    return (data && data.value && data.value.messages) || [];
  }

  // lifecycle //
  /**
   * Load a thread into the conversation panel. Loading the current thread
   * again is a no-op unless `force` is set.
   */
  load(threadId, { force = false } = {}) {
    if (!threadId) {
      throw new Error(`threadId is required in load() call`);
    }
    if (threadId === this._threadId && !force) {
      return this;
    }
    this._threadId = threadId;
    this.restart();
    this._request({
      name: `${API.NAME.THREADS}/${threadId}`,
      type: REQUEST_TYPE.THREAD,
    });
    return this;
  }

  /**
   * Clear the conversation panel, back to the initial state.
   */
  reset() {
    this._threadId = undefined;
    this.restart();
    return this;
  }

  // bus event handlers //
  _onThreadSelect({ threadId }) {
    this.load(threadId);
  }

  _onThreadUpdated({ threadId, changes }) {
    if (threadId !== this._threadId) {
      return;
    }
    const data = this._hub.states[fields.data()];
    if (!data || !data.value || !data.value.thread) {
      return;
    }
    const thread = { ...data.value.thread, ...changes };
    this.updateData({ ...data, value: { ...data.value, thread } });
  }

  _onThreadDeleted({ threadIds, all }) {
    if (this._threadId && (all || (threadIds && threadIds.includes(this._threadId)))) {
      this.reset();
    }
  }

  // request //
  _writeRequestTimeToSession(timestamp, options = {}) {
    // only the head request marks the session request time
    if (options.type !== REQUEST_TYPE.THREAD) {
      return;
    }
    super._writeRequestTimeToSession(timestamp, options);
  }

  // data //
  _defaultProcessData(data, oldData) {
    data = super._defaultProcessData(data, oldData);
    if (!data.value || isAnswersRequestData(data)) {
      return data; // answers responses are merged later, in _updateDataInHub
    }
    return { ...data, value: normalizeThreadValue(data.value) };
  }

  _updateDataInHub(data, oldData) {
    data = this._mergeDataFromAnswersRequest(data);
    super._updateDataInHub(data, oldData);
    this._dispatchFollowUps(data);
  }

  _mergeDataFromAnswersRequest(data) {
    if (!isAnswersRequestData(data)) {
      return data; // the initial state or from the head request
    }
    const currentData = this._hub.states[fields.data()];
    return mergeAnswersDataFromResponse(currentData, data);
  }

  // when the head data lands ready: announce it and issue the follow-up request
  _dispatchFollowUps(data) {
    if (!data.session || data.status !== STATUS.READY || !this._threadId) {
      return;
    }
    this._emitThreadLoaded(data);
    this._requestAnswersIfNecessary(data);
  }

  // announce a freshly loaded thread on the bus, once per session
  _emitThreadLoaded(data) {
    const context = this._getSessionContext(data.session);
    if (context.threadLoadedEmitted) {
      return;
    }
    context.threadLoadedEmitted = true;
    const { thread } = data.value;
    this._workflowEvents.emit(BUS_EVENT.THREAD_LOADED, Object.freeze({
      threadId: getThreadId(thread) || this._threadId,
      thread,
    }));
  }

  _requestAnswersIfNecessary(data) {
    const questionIds = getPendingQuestionIds(data.value);
    if (!questionIds.length) {
      return;
    }
    const context = this._getSessionContext(data.session);
    if (context.answersRequested) {
      return;
    }
    context.answersRequested = true;
    this._requestAnswers(questionIds);
  }

  _requestAnswers(question_ids) {
    const { api } = this._options.resolved.answers;
    this._request(mergeApiOptions(api, {
      payload: { question_ids },
      type: REQUEST_TYPE.ANSWERS,
    }));
  }

}

makeConfigurable(Conversation.prototype, [WORKFLOW_CONFIGURABLE.ANSWERS]);

// helpers //
function isAnswersRequestData(data) {
  const { request } = data;
  return !!request && request.type === REQUEST_TYPE.ANSWERS;
}
