/** @module workflow */

import { asArray } from '@miso.ai/commons';
import Workflow from './base.js';
import { fields } from '../actor/index.js';
import { ROLE, STATUS, REQUEST_TYPE, THREAD_GROUP, WORKFLOW_CONFIGURABLE } from '../constants.js';
import { mergeRolesOptions, makeConfigurable } from './options/index.js';
import { mixinThreadOperations, ThreadOperations } from './thread-operations.js';
import {
  settlePlaceholder, normalizeThreadsValue, normalizeThreadGroupsValue, sortThreadsByLatest, compareThreadsByLatest,
  getThreadChanges, undoThreadOperation, THREAD_GROUP_NAMES, resolveThreadGroup, getThreadGroupKey,
  getThreadGroupFilter, getViewThreadGroup, isThreadInGroup,
} from '../util/threads.js';
import { mergeItems } from '../util/items.js';

// the list requests are idempotent reads, so transient failures (network,
// timeout, 5xx) are worth another try or two at the fetch layer — a failed
// more page otherwise parks the list as exhausted right away
const LIST_REQUEST_OPTIONS = Object.freeze({ retry: 2 });

// the initial load lists every group, one list call per group (the
// paging window applying to each)
const GROUPS_PAYLOAD = Object.freeze(Object.fromEntries(THREAD_GROUP_NAMES.map(group => [group, getThreadGroupFilter(group)])));

const ROLES_OPTIONS = mergeRolesOptions(Workflow.ROLES_OPTIONS, {
  main: ROLE.THREADS,
  members: [ROLE.THREADS, ROLE.NEW_THREAD],
  mappings: {
    // the records carry their selection state in the data layer already;
    // a threads element presents the group named by its `group` attribute
    // (every thread when absent)
    [ROLE.THREADS]: (data, view) => data.value && data.value[getThreadGroupKey(getViewThreadGroup(view))],
  },
});

// The thread-list panel of the chat history interface, backed by the user
// history API. Loads the list of threads and manages thread-level operations
// (select, rename, delete, mark as read).
//
// The list is the workflow's main api option: the endpoint is fixed, but
// the paging window rides the payload (useApi('threads/list', { rows: N })),
// and the list loads page by page — the more flow appends the next page
// (`start` derived from the listed records), triggered by the threads
// layout's infinite scroll, until the response says `has_more: false`
// (the exhaustion is the response's own word, not a row-count inference).
//
// The list comes in groups (THREAD_GROUP): every thread (`all`, under
// `threads`), the favorited ones (`favorite`) and the rest (`unfavorite`),
// each its own list in the value, paged on its own — the initial load
// lists all three in one request (one list call per group, the `favorite`
// filter riding each), and _more(group) appends the next page of one
// group. A record listed in more than one group is one and the same object
// across them, and a favorite operation moves its thread between the
// favorite and unfavorite groups.
//
// The workflow never restarts itself, and there is no soft reload: its
// construction-time session serves for life, the list keeps itself in
// sync through the operation events and the new-thread announcements, and
// staleness is guarded by the data (one list request at a time, and a
// more page must still line up with the listed records' offset), not by
// session bumps. The hard reset is the generic workflow idiom: restart()
// — a new session, in-flight requests discarded — then start().
//
// A peer of the Conversation workflow: the two are created independently,
// and every call to the peer is guarded by its presence, so the thread list
// works standalone. Thread operations are fire-and-forget requests carrying
// their events, triggered off the request event as `thread` hub events — on
// both peers' hubs — which each panel handles off its own hub
// (_onThreadUpdated, ...). An operation that fails is rolled back the same
// way: an `error` event names the operation, and each panel takes it back
// on its own data.

/**
 * The thread list of the chat history interface, available as
 * `client.workflows.history`. Lists the user's past conversation threads,
 * page by page as the list scrolls, and works with the conversation
 * workflow (`client.workflows.conversation`) to show the selected thread.
 *
 * Threads are listed in groups: all threads (`'all'`), favorited ones
 * (`'favorite'`), and the rest (`'unfavorite'`).
 *
 * @extends module:workflow~Workflow
 * @mixes module:workflow~PaginationConfigurable
 * @mixes module:workflow~ThreadOperations
 */
class History extends Workflow {

  constructor(plugin, client, events) {
    super({
      name: 'history',
      plugin,
      client,
      roles: ROLES_OPTIONS,
      // the thread events channel shared with the conversation panel's data
      // actor, carrying the thread operation events across the two hubs
      extraOptions: { api: { threadEvents: events } },
    });
  }

  // the conversation panel workflow, if constructed
  get _peer() {
    return this._client.workflows._conversation;
  }

  _initSubscriptions(args) {
    super._initSubscriptions(args);
    this._unsubscribes = [
      ...this._unsubscribes,
      this._views.on(ROLE.THREADS, 'select', event => this._onViewThreadsSelect(event)),
      this._views.on(ROLE.THREADS, 'rename', event => this._onViewThreadsRename(event)),
      this._views.on(ROLE.THREADS, 'delete', event => this._onViewThreadsDelete(event)),
      this._views.on(ROLE.NEW_THREAD, 'submit', () => this._onViewNewThreadSubmit()),
      // the threads layout's infinite scroll trigger, as in the
      // search-based workflows' more flow — carrying the thread group the
      // triggering list presents
      this._hub.on(fields.more(), state => this._more(state && state.group)),
      // an operation's event rides its request: the
      // data actor publishes it on the shared channel and every subscribed
      // actor — this panel's and its peer's — triggers it on its own hub
      this._hub.on(fields.thread(), event => this._onThreadEvent(event)),
    ];
  }

  // properties //
  /**
   * The listed threads, of all groups. Same as `getThreads('all')`.
   *
   * @type {Object[]}
   */
  get threads() {
    return this.getThreads(THREAD_GROUP.ALL);
  }

  /**
   * Get the listed threads of a group.
   *
   * @param {string} [group='all'] - `'all'`, `'favorite'`, or `'unfavorite'`.
   * @returns {Object[]}
   * @since 1.14.2
   */
  getThreads(group = THREAD_GROUP.ALL) {
    const data = this._hub.states[fields.data()];
    return (data && data.value && data.value[getThreadGroupKey(group)]) || [];
  }

  // every listed record, once each, across the groups
  get _allListedThreads() {
    const data = this._hub.states[fields.data()];
    return listedThreadsOf(data && data.value);
  }

  /**
   * Whether no more threads will be loaded into the list, as the list is
   * complete, or a page failed to load.
   *
   * @type {boolean}
   */
  get exhausted() {
    // the latest page's response said `has_more: false` — or a page failed
    // with its retries spent, parking the list (see
    // _appendThreadsFromMoreResponse). A restart() wipes it with the data
    return this.isExhausted(THREAD_GROUP.ALL);
  }

  /**
   * Whether no more threads will be loaded into a group, like `exhausted`.
   *
   * @param {string} [group='all'] - `'all'`, `'favorite'`, or `'unfavorite'`.
   * @returns {boolean}
   * @since 1.14.2
   */
  isExhausted(group = THREAD_GROUP.ALL) {
    const data = this._hub.states[fields.data()];
    const groups = data && data.meta && data.meta.groups;
    const state = groups && groups[resolveThreadGroup(group)];
    return !!(state && state.exhausted);
  }

  /**
   * The ID of the selected thread.
   *
   * @type {string|undefined}
   */
  get selectedId() {
    // the selection lives in the data layer, as part of the committed value
    const data = this._hub.states[fields.data()];
    return (data && data.value && data.value.selectedThreadId) || undefined;
  }

  /**
   * Get a listed thread by its thread ID.
   *
   * @param {string} threadId - The thread ID.
   * @returns {Object|undefined}
   */
  get(threadId) {
    // for a thread being created, by the placeholder id standing in for one
    return this._allListedThreads.find(thread => (thread.thread_id || thread.placeholder_id) === threadId);
  }

  // lifecycle //
  // The workflow never restarts itself: the one session — created with the
  // workflow, like every workflow's — serves for its whole life. The
  // list requests stale-guard on data instead of session bumps, and being
  // started is a matter of the data status, not a flag. There is no soft
  // reload either: the list keeps itself in sync through the operation
  // events and the new-thread announcements, and the hard reset is the
  // generic workflow idiom — restart() (a new session, in-flight requests
  // discarded) then start()

  /**
   * Load the thread list. Does nothing if the list is already loaded or
   * loading. To reload from scratch, call `restart()` then `start()`.
   *
   * @returns {this}
   */
  start() {
    if (this.status === STATUS.INITIAL) {
      this._request({ payload: { groups: GROUPS_PAYLOAD }, options: LIST_REQUEST_OPTIONS });
    }
    return this;
  }

  // load the next page of a thread group (THREAD_GROUP, every thread by
  // default), appended below its listed threads — down the standard data
  // path. Triggered by the threads layout as its infinite scroll trigger
  // comes into view (the `more` hub field, carrying the layout's group),
  // like the search-based workflows' more flow
  _more(group = THREAD_GROUP.ALL) {
    group = resolveThreadGroup(group);
    if (this.status !== STATUS.READY) {
      throw new Error(`Can not call more() while loading.`);
    }
    // no more pages, ignore
    if (this.isExhausted(group)) {
      return;
    }
    // the list requests keep the current data — and status — on display
    // while being served, so the trigger can re-arm mid-flight: one list
    // request per group at a time — the groups page independently, while
    // the initial load holds them all (the thread operations are exempt —
    // independent, fire-and-forget)
    if (this._data.isServing(request => request.type !== REQUEST_TYPE.THREADS &&
        (request.type !== REQUEST_TYPE.MORE || request.threadGroup === group))) {
      return;
    }
    // the next offset: the group's listed records with a server identity —
    // a thread still being created is local, its placeholder record never
    // counts toward the server's offsets
    const start = countServerThreads(this.getThreads(group));
    this._request({
      payload: { start, ...getThreadGroupFilter(group) },
      type: REQUEST_TYPE.MORE,
      threadGroup: group,
      options: LIST_REQUEST_OPTIONS,
    });
  }

  // a more request must not disturb the session's request time, as in the
  // search-based workflows
  _writeRequestTimeToSession(timestamp, options = {}) {
    if (options.type === REQUEST_TYPE.MORE) {
      return;
    }
    super._writeRequestTimeToSession(timestamp, options);
  }

  /**
   * Select a thread, and show it in the conversation panel.
   *
   * @param {string} threadId - The thread ID.
   * @returns {this}
   */
  select(threadId) {
    if (!threadId) {
      throw new Error(`threadId is required in select() call`);
    }
    const thread = this.get(threadId);
    this._patchList({ name: 'select', threadId }, { selectedThreadId: threadId });
    this._emit('select', Object.freeze({ threadId, thread }));
    // a thread being created has no server identity to load: the placeholder
    // id never addresses the API, and the panel either already displays the
    // thread or has nothing to fetch
    if (!(thread && thread.placeholder_id)) {
      const peer = this._peer;
      peer && peer._onThreadSelect(threadId);
    }
    return this;
  }

  // thread operations: the id-based methods mixed in from ThreadOperations
  // (markAsRead, favorite, subscribe, unsubscribe, deleteAll), except rename and
  // delete, specialized here with a guard — a thread still being created
  // has no server identity to operate on, so its placeholder id is ignored
  // until the resolution brings the thread id

  /**
   * Rename a thread.
   *
   * @param {string} threadId - The thread ID.
   * @param {string} title - The new title.
   */
  rename(threadId, title) {
    const thread = this.get(threadId);
    if (thread && thread.placeholder_id) {
      return;
    }
    ThreadOperations.prototype.rename.call(this, threadId, title, thread && thread.title);
  }

  /**
   * Delete one or more threads.
   *
   * @param {string|string[]} threadIds - A thread ID, or an array of them.
   */
  delete(threadIds) {
    threadIds = asArray(threadIds).filter(threadId => {
      const thread = this.get(threadId);
      return !(thread && thread.placeholder_id);
    });
    if (threadIds.length === 0) {
      return;
    }
    ThreadOperations.prototype.delete.call(this, threadIds);
  }

  // view actions //
  _onViewNewThreadSubmit() {
    if (!this.selectedId) {
      return;
    }
    this._patchList({ name: 'deselect' }, { selectedThreadId: undefined });
    this._emit('new', {});
    const peer = this._peer;
    peer && peer.new();
  }

  _onViewThreadsSelect({ value: thread }) {
    const threadId = thread && thread.thread_id;
    threadId && this.select(threadId);
  }

  _onViewThreadsRename({ value: thread, title }) {
    const threadId = thread && thread.thread_id;
    threadId && title && this.rename(threadId, title);
  }

  _onViewThreadsDelete({ value: thread }) {
    // a placeholder item has no thread id, so a thread being created never
    // reaches the API from here
    const threadId = thread && thread.thread_id;
    threadId && this.delete(threadId);
  }

  // data //
  // a `threads`-typed (operation) response carries no data: the operation
  // is optimistic, its event having ridden the request already
  _onResponse(response) {
    const { request } = response;
    if (request && request.type === REQUEST_TYPE.THREADS) {
      return;
    }
    super._onResponse(response);
  }

  // thread events //
  // an operation, applied optimistically by its type — or the error taking
  // a failed one back
  _onThreadEvent(event) {
    switch (event.type) {
      case 'rename':
      case 'mark-as-read':
      case 'favorite':
      case 'subscribe':
      case 'unsubscribe':
        this._onThreadUpdated(event);
        break;
      case 'delete':
        this._onThreadDeleted(event);
        break;
      case 'delete-all':
        this._onAllThreadsDeleted();
        break;
      case 'error':
        this._onThreadOperationError(event);
        break;
    }
  }

  _onThreadUpdated(operation) {
    const changes = getThreadChanges(operation);
    this._patchThread(operation.threadId, thread => ({ ...thread, ...changes }));
  }

  _onThreadOperationError({ operation }) {
    this._patchThread(operation.threadId, thread => undoThreadOperation(thread, operation));
  }

  // patch a listed thread's record — in every group listing it, and, for a
  // favorite change (or its rollback), into the group its flag now says
  // (_mergePatch)
  _patchThread(threadId, fn) {
    const listed = this._allListedThreads.find(thread => thread.thread_id === threadId);
    const thread = listed && fn(listed);
    if (!thread || thread === listed) {
      return;
    }
    this._patchList({ name: 'patch-thread', threadId }, { threads: [thread] });
  }

  // a deletion is not rolled back if it fails: the records stay off the
  // list until a hard reset (restart() + start()) brings the server's word
  _onThreadDeleted({ threadIds }) {
    this._patchList({ name: 'delete-threads', remove: threadIds },
      threadIds && threadIds.includes(this.selectedId) ? { selectedThreadId: undefined } : {});
    // a deleted thread's item subworkflow has nothing left to present
    const context = this._client.workflows._threadItems;
    if (context) {
      for (const threadId of threadIds) {
        const workflow = context.get({ thread_id: threadId });
        workflow && workflow.destroy();
      }
    }
  }

  _onAllThreadsDeleted() {
    this._patchList({ name: 'delete-all-threads', remove: this._allListedThreads.map(threadKeyOf) }, { selectedThreadId: undefined });
    const context = this._client.workflows._threadItems;
    context && context.reset();
  }

  // called by the conversation workflow //
  // a new thread is started in the conversation panel: list its placeholder
  // as the selected item (its fresh timestamp sorts it to the top) — in the
  // groups it belongs to: every thread's and, not being a favorite, the
  // unfavorite one. The record has no thread id yet, so it is selected by
  // its placeholder id
  _onConversationNew(thread) {
    this._patchList({ name: 'new-thread', placeholderId: thread.placeholder_id },
      { threads: [thread], selectedThreadId: thread.placeholder_id });
  }

  // the new thread is created server-side: the thread id is the only thing
  // the resolution gains — settle the listed placeholder item around it
  _onConversationResolve(placeholderId, threadId) {
    const listed = this.get(placeholderId);
    if (!listed) {
      return; // already settled (announced from both the live and the expired path)
    }
    // the item subworkflow adopts the thread id first, so the settled record
    // propagates into the same workflow the placeholder was keyed to
    const context = this._client.workflows._threadItems;
    context && context._resolvePlaceholder(placeholderId, threadId);
    this._patchList({ name: 'resolve-thread', placeholderId, threadId, rekey: { [placeholderId]: threadId } }, {
      threads: [settlePlaceholder(listed, threadId)],
      ...(this.selectedId === placeholderId ? { selectedThreadId: threadId } : {}),
    });
  }

  // a question is posted to a thread (by thread id, or placeholder id for one
  // still being created): its latest activity is now, so the listed record
  // takes the fresh updated_at — the sort moving it to the top of every
  // group listing it. A thread not listed yet (past the loaded pages) joins
  // its groups off the panel's record: it now sorts above every loaded
  // record, as it does server-side, so the paging offsets stay in line with
  // the server's
  _onConversationActivity(threadId, record) {
    const updated_at = record && record.updated_at;
    if (!threadId || !updated_at) {
      return;
    }
    const listed = this.get(threadId);
    if (!listed && !record.thread_id) {
      return; // a placeholder not listed: nothing to place
    }
    this._patchList({ name: 'touch-thread', threadId }, { threads: [listed ? { ...listed, updated_at } : toListedThread(record)] });
  }

  // data //
  _defaultProcessData(data, oldData) {
    data = super._defaultProcessData(data, oldData);
    if (!data.value) {
      return data;
    }
    // a patch carries its change only, merged into the list past the
    // processor passes (_mergePatch)
    if (data.action) {
      return data;
    }
    // a more page runs the pipeline alone, in its own shape (one group's
    // `{ threads, has_more }`), and is merged into the current data past
    // the processor passes (_appendThreadsFromMoreResponse)
    if (isMorePage(data)) {
      return { ...data, value: normalizeThreadsValue(data.value) };
    }
    // the selection is part of the value: local patches carry their own
    // (including an explicit undefined to clear it), while a fresh server
    // response has the current selection carried over
    const selectedThreadId = oldData && oldData.value && oldData.value.selectedThreadId;
    const value = { selectedThreadId, ...normalizeThreadGroupsValue(data.value) };
    return writeThreadGroupsToData({ ...data, value });
  }

  _mergeData(data, oldData) {
    data = super._mergeData(data, oldData);
    if (data.action) {
      return this._mergePatch(data, oldData);
    }
    if (isMorePage(data)) {
      return this._appendThreadsFromMoreResponse(data, oldData);
    }
    return data;
  }

  // Merge a patch into the list on display. A patch carries its change only
  // — the thread records to put in (`threads` in its value), so each runs
  // the data processors once, and the selection, if changed — while its
  // action names the keys to take out (`remove`) or changing (`rekey`). A
  // record put in replaces its listing in every loaded group, leaves a group
  // it no longer belongs to (a favorite change), and joins one it belongs
  // to only where the server lists it within the loaded records too: the
  // group is fully loaded, or the record sorts above the last loaded one —
  // past them it arrives with a later page instead, so the paging offsets
  // stay in line with the server's
  _mergePatch(data, oldData) {
    if (!oldData || !oldData.value) {
      return data;
    }
    const { action, value = {} } = data;
    const { threads: upsert = [], ...valuePatch } = value;
    const { remove = [], rekey = {} } = action;
    const groups = mapGroupsOf(oldData.value, (threads, group) => mergeItems(threads, { upsert, remove, rekey }, {
      keyOf: threadKeyOf,
      compare: compareThreadsByLatest,
      belongs: thread => isThreadInGroup(thread, group),
      within: (thread, listed) => isGroupExhausted(oldData, group) || listed.length === 0 ||
        compareThreadsByLatest(thread, listed[listed.length - 1]) <= 0,
    }));
    return writeThreadGroupsToData({
      ...oldData,
      action,
      metadata: data.metadata,
      value: { ...oldData.value, ...valuePatch, ...groups },
    });
  }

  _postUpdateData(merged, data, oldData) {
    super._postUpdateData(merged, data, oldData);
    this._dispatchDataToThreadWorkflows(merged);
  }

  // merge a more page into its group of the current data past the data
  // processor passes, like the search-based more flow: each page runs the
  // pipeline once, alone
  _appendThreadsFromMoreResponse(data, oldData) {
    const { request, value } = data;
    const group = resolveThreadGroup(request.threadGroup);
    if (!value) {
      // the more request's loading commit: keep the current list — and its
      // ready status — on display
      if (!data.error || !oldData || !oldData.value) {
        return oldData || data;
      }
      // a failed page (retries spent — see LIST_REQUEST_OPTIONS): with the
      // ready status retained, the trigger would re-arm and refire into
      // the same failure, looping with no backoff — so the failure parks
      // the group as exhausted, breaking the loop; its paging resumes only
      // with a hard reset (restart() + start())
      return writeThreadGroupsToData({
        ...oldData,
        meta: {
          ...oldData.meta,
          groups: {
            ...(oldData.meta && oldData.meta.groups),
            [group]: { exhausted: true },
          },
        },
      });
    }
    if (!oldData || !oldData.value) {
      return data; // nothing to merge into (not expected: a more needs a ready list)
    }
    const key = getThreadGroupKey(group);
    const threads = oldData.value[key] || [];
    // the page was requested against the group on display: if it has
    // changed while the page was in flight — a deletion removed a record,
    // a created thread settled, a favorite moved one in or out — the
    // offsets no longer line up, so the stale page is dropped (the trigger
    // re-arms and refetches from the fresh offset)
    if (request.payload.start !== countServerThreads(threads)) {
      return oldData;
    }
    // a record listed already is dropped from the page: a thread created
    // server-side since the first page shifts the server's offsets, so a
    // page may overlap what is on display — the listed record (and any
    // local change on it) stays
    const listed = new Set(threads.map(threadKeyOf));
    const fresh = value.threads.filter(thread => !listed.has(threadKeyOf(thread)));
    // the merged data is the current data with the group extended: the page
    // is the next window of the group, so its records join regardless of
    // where the loaded ones end
    return writeThreadGroupsToData({
      ...oldData,
      value: {
        ...oldData.value,
        [key]: mergeItems(threads, { upsert: fresh }, { keyOf: threadKeyOf, compare: compareThreadsByLatest }),
        paging: {
          ...oldData.value.paging,
          [group]: { has_more: value.has_more },
        },
      },
    });
  }

  // threads as item subworkflows //
  // The thread workflow of the given thread: the item subworkflow behind a
  // <miso-thread-item> element. Takes the thread record — the threads layout
  // passes the item binding's value, which also covers a thread being
  // created that has no thread id yet (keyed by its local placeholder id,
  // adopting the thread id when the placeholder settles) — or a thread id,
  // for an explicitly bound element. Created on demand from the threads
  // context (client.workflows.threadItems) and seeded with the listed record,
  // if present; from then on, every data commit propagates the record in
  // through updateData().
  _getThreadWorkflow(thread) {
    const context = this._client.workflows.threadItems;
    if (typeof thread === 'string') {
      thread = this.get(thread) || { thread_id: thread };
    }
    let workflow = context.get(thread);
    if (!workflow) {
      workflow = context.get(thread, { autoCreate: true, superworkflow: this });
      workflow && this._allListedThreads.includes(thread) && this._updateThreadWorkflow(workflow, thread);
    }
    return workflow;
  }

  // propagate the committed records — only ever into existing thread
  // workflows: instances are created by elements (_getThreadWorkflow), not by
  // data, so nothing is constructed when <miso-thread-item> is not in play
  _dispatchDataToThreadWorkflows(data) {
    const context = this._client.workflows._threadItems;
    if (!context) {
      return;
    }
    for (const thread of listedThreadsOf(data && data.value)) {
      const workflow = context.get(thread);
      workflow && this._updateThreadWorkflow(workflow, thread);
    }
  }

  _updateThreadWorkflow(workflow, thread) {
    if (workflow.thread === thread) {
      return; // the very record on display already, nothing to propagate
    }
    workflow.updateData({ session: workflow.session, value: thread });
  }

  // patch the list on display: the action names the change (and the keys to
  // take out or changing), the value carries the records to put in
  // (`threads`) and the selection, if changed (_mergePatch)
  _patchList(action, value) {
    const data = this._hub.states[fields.data()];
    if (!data || !data.value) {
      return; // the list is not loaded yet, nothing to patch
    }
    this.updateData({ session: data.session, action, value });
  }


  // destroy //
  // the list's teardown takes its item subworkflows with it
  _destroy(options) {
    const context = this._client.workflows._threadItems;
    context && context.reset(options);
    super._destroy(options);
  }

}

// helpers //
function isMorePage({ action, request }) {
  return !action && !!request && request.type === REQUEST_TYPE.MORE;
}

// a value patch mapping each loaded group's list of records through fn
function mapGroupsOf(value, fn) {
  const patch = {};
  for (const group of THREAD_GROUP_NAMES) {
    const key = getThreadGroupKey(group);
    if (value[key]) {
      patch[key] = fn(value[key], group);
    }
  }
  return patch;
}

function isGroupExhausted(data, group) {
  const groups = data && data.meta && data.meta.groups;
  return !!(groups && groups[group] && groups[group].exhausted);
}

// the listed records with a server identity: a thread still being created is
// local, its placeholder record never counts toward the server's offsets
function countServerThreads(threads) {
  return threads.filter(thread => thread.thread_id).length;
}

// a thread-detail record as a list record: the detail carries the thread's
// question ids on top of the list properties, and the selection flag is
// stamped by the list itself
function toListedThread(record) {
  const { questions_ids: _questionsIds, selected: _selected, ...thread } = record;
  return thread;
}

function threadKeyOf(thread) {
  return thread.thread_id || thread.placeholder_id;
}

// every listed record of a value, once each, across the groups
function listedThreadsOf(value) {
  if (!value) {
    return [];
  }
  const seen = new Set();
  const result = [];
  for (const group of THREAD_GROUP_NAMES) {
    for (const thread of value[getThreadGroupKey(group)] || []) {
      if (!seen.has(thread)) {
        seen.add(thread);
        result.push(thread);
      }
    }
  }
  return result;
}

// Stamp the grouped value of a committed thread list: each group ordered by
// latest activity, each record carrying its selection state — one and the
// same record object for a thread listed in several groups (the first
// listing's, in group order) — and each group's paging exhaustion in the
// meta (`meta.groups[group].exhausted`, mirrored for every thread's group
// at `meta.exhausted`): the response's own `has_more: false`, or a parking
// carried in the meta (a failed page). A record whose flag already matches
// keeps its identity — record identity tells the item subworkflows (and
// their views) what actually changed, so a stamp-only pass must not touch
// the unaffected records. The paging state rides the value into every
// commit, so re-processing (a local patch) restamps consistently.
function writeThreadGroupsToData(data) {
  const { value, status } = data;
  const { selectedThreadId, paging = {} } = value;
  const canonical = new Map();
  const stamp = thread => {
    const key = threadKeyOf(thread);
    if (key && canonical.has(key)) {
      return canonical.get(key);
    }
    const selected = key === selectedThreadId;
    const stamped = !!thread.selected === selected ? thread : { ...thread, selected };
    key && canonical.set(key, stamped);
    return stamped;
  };
  const meta = { ...data.meta };
  const parked = meta.groups || {};
  const groups = {};
  const patch = {};
  for (const group of THREAD_GROUP_NAMES) {
    const key = getThreadGroupKey(group);
    if (!value[key]) {
      continue;
    }
    patch[key] = sortThreadsByLatest(value[key]).map(stamp);
    const exhausted = !!(parked[group] && parked[group].exhausted) ||
      (status === STATUS.READY && !!paging[group] && paging[group].has_more === false);
    groups[group] = { exhausted };
  }
  meta.groups = groups;
  meta.exhausted = !!(groups[THREAD_GROUP.ALL] && groups[THREAD_GROUP.ALL].exhausted);
  return { ...data, meta, value: { ...value, ...patch } };
}

mixinThreadOperations(History.prototype);

makeConfigurable(History.prototype, [WORKFLOW_CONFIGURABLE.PAGINATION]);

export default History;
