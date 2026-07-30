import { API, uuidv4 } from '@miso.ai/commons';
import Workflow from './base.js';
import { fields } from '../actor/index.js';
import { ROLE, STATUS, REQUEST_TYPE, WORKFLOW_CONFIGURABLE } from '../constants.js';
import { mergeRolesOptions, mergeApiOptions, makeConfigurable } from './options/index.js';
import { getThreadId, getPlaceholderId, getQuestionId, normalizeThreadValue, getUnsettledQuestionIds, mergeAnswersDataFromResponse, mergeFollowUpDataFromResponse } from '../util/threads.js';
import { fallbackThreadFields } from '../source.js';

const ROLES_OPTIONS = mergeRolesOptions(Workflow.ROLES_OPTIONS, {
  main: ROLE.MESSAGES,
  members: [ROLE.MESSAGES, ROLE.QUERY],
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
 * bus (client.workflows.bus): loads threads selected in the history panel,
 * announces loaded threads with `conversation:load` (so the history panel
 * marks them as read), and resets when its current thread is deleted.
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
    this._placeholderId = undefined;
  }

  _initSession(args) {
    super._initSession(args);
    this._loadPlaceholder(); // start in new-thread mode, not an empty panel
  }

  _initSubscriptions(args) {
    super._initSubscriptions(args);
    this._unsubscribes = [
      ...this._unsubscribes,
      this._bus.handle('history', 'new', () => this.new()),
      this._bus.handle('history', 'select', event => this._onThreadSelect(event)),
      this._bus.handle('history', 'update', event => this._onThreadUpdated(event)),
      this._bus.handle('history', 'delete', event => this._onThreadDeleted(event)),
      this._bus.handle('history', 'delete-all', () => this._onAllThreadsDeleted()),
      this._hub.on(fields.query(), args => this._onQuery(args)),
    ];
  }

  // properties //
  get threadId() {
    return this._threadId;
  }

  /**
   * The thread on display, as selection sees it: its thread id, or, while it
   * is being created, the placeholder id standing in for one.
   */
  get threadItemId() {
    return this._threadId || this._placeholderId;
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
    this._placeholderId = undefined;
    this.restart();
    this._request({
      name: `${API.NAME.THREADS}/${threadId}`,
      type: REQUEST_TYPE.THREAD,
    });
    return this;
  }

  /**
   * Send a question: a follow-up to the current thread, or, in new-thread
   * mode (no thread loaded), the first question of a new thread.
   */
  send(question) {
    return this.threadItemId ? this._followUp(question) : this._startThread(question);
  }

  // why duplicated method with reset()?
  /**
   * Enter new-thread mode: a fresh session presenting a placeholder thread
   * with no messages, ready to take the first question. A no-op when the
   * panel is already sitting on an untouched new thread — nothing has been
   * asked, so there is nothing to reset — unless `force` is set.
   */
  new({ force = false } = {}) {
    if (!this.threadItemId && !force) {
      return this;
    }
    this._threadId = undefined;
    this._placeholderId = undefined;
    this.restart();
    this._loadPlaceholder();
    return this;
  }

  _loadPlaceholder() {
    const { session } = this;
    this.updateData({ session, value: { thread: { placeholder: true }, messages: [] } });
  }

  // should refactor _startThread & _followUp
  /**
   * The first question of a new thread: announce a placeholder thread on the
   * bus (the history workflow lists and selects it), post the question as a
   * root question, and settle the placeholder once the response arrives (see
   * _resolveIfNecessary). The thread has no identity yet — the placeholder
   * record is keyed by a local `placeholder_id` instead of a thread id, so
   * nothing addresses it as a thread server-side.
   */
  _startThread(question) {
    if (!question) {
      throw new Error(`question is required`);
    }
    const data = this._hub.states[fields.data()];
    if (!data || !data.value) {
      return this;
    }
    // TODO: client side time is not reliable, don't use it for comparison with server time
    const thread = Object.freeze({ placeholder_id: uuidv4(), title: question, placeholder: true, updated_at: new Date().toISOString() });
    this._placeholderId = getPlaceholderId(thread);
    this._bus.emit('new', Object.freeze({ placeholderId: this._placeholderId, thread }));
    // optimistic: the placeholder thread record and the first question bubble
    this.updateData({ ...data, value: { ...data.value, thread, messages: [{ question, live: true }] } });
    // post as a root question (no parent)
    const { api } = this._options.resolved.followUp;
    this._request(mergeApiOptions(api, {
      payload: { question },
      type: REQUEST_TYPE.FOLLOW_UP,
    }));
    return this;
  }

  /**
   * Post a follow-up question to the current thread, like the ask workflow:
   * the question is appended to the messages optimistically, and the answer
   * streams into the last message pair as it is generated.
   */
  _followUp(question) {
    if (!question) {
      throw new Error(`question is required in followUp() call`);
    }
    // a thread being created takes follow-ups too, before it has an identity
    if (!this.threadItemId) {
      throw new Error(`No thread is loaded; call load() first.`);
    }
    const data = this._hub.states[fields.data()];
    if (!data || !data.value) {
      return this;
    }
    const messages = data.value.messages || [];
    const last = messages[messages.length - 1];
    const parent_question_id = last && getQuestionId(last);
    // optimistically append the question bubble; `live` marks the pair as
    // being generated in this session (the UI typewrites live answers)
    this.updateData({ ...data, value: { ...data.value, messages: [...messages, { question, live: true }] } });
    // post the question; the streamed responses merge into the last message
    const { api } = this._options.resolved.followUp;
    this._request(mergeApiOptions(api, {
      payload: { question, ...(parent_question_id ? { parent_question_id } : {}) },
      type: REQUEST_TYPE.FOLLOW_UP,
    }));
    return this;
  }

  // bus event handlers //
  _onThreadSelect({ threadId, thread }) {
    if (getPlaceholderId(thread) || threadId === this._placeholderId) {
      return; // a thread being created has nothing to load; it is on display
    }
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

  _onThreadDeleted({ threadIds }) {
    if (this._threadId && threadIds && threadIds.includes(this._threadId)) {
      this.new();
    }
  }

  _onAllThreadsDeleted() {
    if (this._threadId) {
      this.new();
    }
  }

  // view actions //
  _onQuery({ q }) {
    q && this.send(q);
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
    if (!data.value || isAnswersRequestData(data) || isFollowUpRequestData(data)) {
      return data; // answers/follow-up responses are merged later, in _updateDataInHub
    }
    return { ...data, value: normalizeThreadValue(data.value) };
  }

  _updateDataInHub(data, oldData) {
    data = this._mergeDataFromAnswersRequest(data);
    data = this._mergeDataFromFollowUpRequest(data);
    super._updateDataInHub(data, oldData);
    this._dispatchFollowUps(data);
  }

  _mergeDataFromFollowUpRequest(data) {
    if (!isFollowUpRequestData(data)) {
      return data;
    }
    const currentData = this._hub.states[fields.data()];
    return mergeFollowUpDataFromResponse(currentData, data);
  }

  _mergeDataFromAnswersRequest(data) {
    if (!isAnswersRequestData(data)) {
      return data; // the initial state or from the head request
    }
    if ((data.value || data.error) && data.session) {
      // the answers request settled; polling may reschedule if needed
      this._getSessionContext(data.session).answersPending = false;
    }
    const currentData = this._hub.states[fields.data()];
    return mergeAnswersDataFromResponse(currentData, data);
  }

  // when the head data lands ready: announce it and issue the follow-up request
  _dispatchFollowUps(data) {
    if (!data.session || data.status !== STATUS.READY || !this.threadItemId) {
      return;
    }
    this._emitThreadLoaded(data);
    this._requestAnswersIfNecessary(data);
    this._resolveIfNecessary(data);
  }

  /**
   * Settle a started new thread when the first question response arrives: by
   * contract the thread id *is* the id of the thread's first question, so the
   * id needs no lookup — only the thread record itself is fetched.
   */
  _resolveIfNecessary(data) {
    const { thread, messages } = data.value || {};
    const placeholderId = getPlaceholderId(thread);
    if (!placeholderId) {
      return; // not a started new thread
    }
    const questionId = getQuestionId(messages && messages[0]);
    if (!questionId) {
      return; // the response has not arrived yet
    }
    const context = this._getSessionContext(data.session);
    if (context.threadResolveRequested) {
      return;
    }
    context.threadResolveRequested = true;
    this._threadId = questionId; // the thread is addressable right away
    this._resolveNewThread(data.session, placeholderId, thread, questionId).catch(error => this._error(error));
  }

  async _resolveNewThread(session, placeholderId, placeholder, threadId) {
    const thread = await this._fetchThread(threadId) || settlePlaceholder(placeholder, threadId);
    const data = this._hub.states[fields.data()];
    if (!data || data.session !== session) {
      return; // the session has moved on
    }
    this._placeholderId = undefined; // the thread stands on its own id now
    this.updateData({ ...data, value: { ...data.value, thread } });
    this._bus.emit('resolve', Object.freeze({ placeholderId, thread }));
  }

  // the record of the just-created thread. The call bypasses the source, so
  // the response is adapted here. A failure is not fatal: the local record
  // stands in, and the next thread list load brings the server one.
  async _fetchThread(threadId) {
    try {
      return fallbackThreadFields(await this._client.api.ask.userHistory.getThread(threadId));
    } catch (error) {
      this._warn(`Failed to fetch the created thread ${threadId}`, error);
      return undefined;
    }
  }

  // announce a freshly loaded thread on the bus, once per session
  _emitThreadLoaded(data) {
    const context = this._getSessionContext(data.session);
    if (context.threadLoadedEmitted) {
      return;
    }
    context.threadLoadedEmitted = true;
    const { thread } = data.value;
    this._bus.emit('load', Object.freeze({
      threadId: getThreadId(thread) || this._threadId,
      thread,
    }));
  }

  /**
   * Fetch or poll answer contents, driven by the answer state: any (non-live)
   * message whose answer is absent or unfinished keeps the answers request
   * going — an unfinished answer is re-polled regardless of how the panel got
   * here (posted in this session, or reloaded mid-generation).
   */
  _requestAnswersIfNecessary(data) {
    const questionIds = getUnsettledQuestionIds(data.value);
    if (!questionIds.length) {
      return;
    }
    const { session } = data;
    const context = this._getSessionContext(session);
    if (context.answersPending) {
      return; // a request is in flight, or a poll is scheduled
    }
    context.answersPending = true;
    if (!context.answersRequested) {
      context.answersRequested = true;
      this._requestAnswers(questionIds);
      return;
    }
    // the answers came back unfinished; poll again after an interval
    const { pollingInterval = 1000 } = this._options.resolved.answers;
    setTimeout(() => {
      if (this.session === session) {
        this._requestAnswers(questionIds);
      }
    }, pollingInterval);
  }

  _requestAnswers(question_ids) {
    const { api } = this._options.resolved.answers;
    this._request(mergeApiOptions(api, {
      payload: { question_ids },
      type: REQUEST_TYPE.ANSWERS,
    }));
  }

}

makeConfigurable(Conversation.prototype, [WORKFLOW_CONFIGURABLE.ANSWERS, WORKFLOW_CONFIGURABLE.FOLLOW_UP]);

// helpers //
// the local stand-in for a created thread whose record could not be fetched:
// the placeholder, keyed by the thread id it is known to have
function settlePlaceholder(placeholder, threadId) {
  const { placeholder: _placeholder, placeholder_id: _placeholderId, ...thread } = placeholder;
  return Object.freeze({ ...thread, thread_id: threadId });
}

function isAnswersRequestData(data) {
  const { request } = data;
  return !!request && request.type === REQUEST_TYPE.ANSWERS;
}

function isFollowUpRequestData(data) {
  const { request } = data;
  return !!request && request.type === REQUEST_TYPE.FOLLOW_UP;
}
