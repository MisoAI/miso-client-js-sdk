/**
 * Helpers to work with thread records from the history API. The API is a
 * prototype, so the shape-dependent logic — normalization, merging, and the
 * semantic predicates — is centralized here. Simple field reads (thread_id,
 * placeholder_id, question_id, ...) are inlined at the call sites; the
 * response-shape fallbacks live at the API boundary (`processResponse()` in
 * source.js), so only canonical fields are ever read.
 */
import { THREAD_GROUP } from '../constants.js';
import { mergeItems } from './items.js';

/**
 * Settle a placeholder record into a real thread record, keyed by the thread
 * id it is known to have: the placeholder marks are stripped, the local
 * fields (title, updated_at) stand in until server data arrives. (A thread
 * has no server identity until its first question is posted, so its
 * placeholder record carries a `placeholder_id` in place of a thread id.)
 */
export function settlePlaceholder(placeholder, threadId) {
  const { placeholder: _placeholder, placeholder_id: _placeholderId, ...thread } = placeholder;
  return { ...thread, thread_id: threadId };
}

/**
 * The changes a thread operation makes to its thread's record, by its
 * type — undefined for an operation that changes no record (a deletion).
 */
export function getThreadChanges({ type, title, favorite }) {
  switch (type) {
    case 'rename':
      return { title };
    case 'favorite':
      return { favorite };
    case 'mark-as-read':
      return { has_new: false };
    case 'subscribe':
      return { subscribed: true };
    case 'unsubscribe':
      return { subscribed: false };
  }
  return undefined;
}

/**
 * The changes that take a failed thread operation back, read off the
 * operation alone — a rename carries the title it replaced (`oldTitle`), a
 * favorite or subscription toggle flips back. Undefined for an operation that is not
 * rolled back: a deletion, and mark-as-read — the operation does not know
 * whether the thread was unread to begin with.
 */
export function getThreadUndoChanges({ type, oldTitle, favorite }) {
  switch (type) {
    case 'rename':
      return { title: oldTitle };
    case 'favorite':
      return { favorite: !favorite };
    case 'subscribe':
      return { subscribed: false };
    case 'unsubscribe':
      return { subscribed: true };
  }
  return undefined;
}

/**
 * Take a failed thread operation back on a thread record: each field it
 * changed goes back (getThreadUndoChanges) — unless the field has moved on
 * since (a later change owns it now). The record keeps its identity if
 * nothing is left to revert.
 */
export function undoThreadOperation(thread, operation) {
  const changes = getThreadChanges(operation);
  const previous = getThreadUndoChanges(operation);
  if (!changes || !previous) {
    return thread;
  }
  const patch = {};
  for (const key of Object.keys(changes)) {
    if (thread[key] === changes[key] && thread[key] !== previous[key]) {
      patch[key] = previous[key];
    }
  }
  return Object.keys(patch).length > 0 ? { ...thread, ...patch } : thread;
}

/**
 * Whether the thread presents as unread — the UI red dot: it carries new
 * updates AND the user subscribes to its updates. The two fields are
 * independent facts; they combine only at presentation.
 */
export function isThreadUnread(thread) {
  return !!thread && thread.subscribed === true && thread.has_new === true;
}

/**
 * The thread list groups: the key each group's records live under in the
 * history workflow's value, and the list API filter that selects them.
 */
const THREAD_GROUPS = Object.freeze({
  [THREAD_GROUP.ALL]: Object.freeze({ key: 'threads', filter: Object.freeze({}) }),
  [THREAD_GROUP.FAVORITE]: Object.freeze({ key: 'favorite', filter: Object.freeze({ favorite: true }) }),
  [THREAD_GROUP.UNFAVORITE]: Object.freeze({ key: 'unfavorite', filter: Object.freeze({ favorite: false }) }),
});

export const THREAD_GROUP_NAMES = Object.freeze(Object.keys(THREAD_GROUPS));

/**
 * Resolve a thread group name: an unknown or absent name means every thread.
 */
export function resolveThreadGroup(group) {
  return THREAD_GROUPS[group] ? group : THREAD_GROUP.ALL;
}

/**
 * The key a thread group's records live under in the history workflow's
 * value: `threads` (all), `favorite`, `unfavorite`.
 */
export function getThreadGroupKey(group) {
  return THREAD_GROUPS[resolveThreadGroup(group)].key;
}

/**
 * The list API filter (payload fields) selecting a thread group.
 */
export function getThreadGroupFilter(group) {
  return THREAD_GROUPS[resolveThreadGroup(group)].filter;
}

/**
 * The thread group a list API filter (payload fields) selects — the inverse
 * of getThreadGroupFilter: the `favorite` filter tells the favorite and
 * unfavorite groups, its absence every thread.
 */
export function getThreadGroupOfFilter(filter) {
  const favorite = filter && filter.favorite;
  return favorite === true ? THREAD_GROUP.FAVORITE : favorite === false ? THREAD_GROUP.UNFAVORITE : THREAD_GROUP.ALL;
}

/**
 * The thread group a view presents: its element's `group` attribute
 * (`favorite`, `unfavorite`), every thread when absent.
 */
export function getViewThreadGroup(view) {
  const element = view && view.element;
  const group = element && typeof element.getAttribute === 'function' ? element.getAttribute('group') : undefined;
  return resolveThreadGroup(group);
}

/**
 * Whether a thread record belongs to the favorite group.
 */
export function isThreadFavorite(thread) {
  return !!thread && thread.favorite === true;
}

/**
 * Whether a thread record belongs to a thread group: every thread belongs to
 * `all`, and its favorite flag tells `favorite` from `unfavorite`.
 */
export function isThreadInGroup(thread, group) {
  switch (resolveThreadGroup(group)) {
    case THREAD_GROUP.FAVORITE:
      return isThreadFavorite(thread);
    case THREAD_GROUP.UNFAVORITE:
      return !isThreadFavorite(thread);
    default:
      return true;
  }
}

/**
 * Normalize a thread-list value to the grouped shape of the history
 * workflow: `{ threads, favorite, unfavorite, paging }`, each group's records
 * under its key (getThreadGroupKey) and its paging state under
 * `paging[group]` (`{ has_more }`). It takes the grouped response of the
 * initial load (`{ all, favorite, unfavorite }`, one list response per
 * group), a single list response — of the given group (every thread by
 * default), e.g. a more page — or an already normalized value (left alone,
 * so re-processing is safe).
 */
export function normalizeThreadGroupsValue(value, { group = THREAD_GROUP.ALL } = {}) {
  if (!value || value.paging) {
    return value;
  }
  if (Array.isArray(value) || value.all === undefined) {
    const { threads, has_more } = normalizeThreadsValue(value);
    group = resolveThreadGroup(group);
    return { [getThreadGroupKey(group)]: threads, paging: { [group]: { has_more } } };
  }
  const result = {};
  const paging = {};
  for (const group of THREAD_GROUP_NAMES) {
    if (value[group] === undefined) {
      continue;
    }
    const { threads, has_more } = normalizeThreadsValue(value[group]);
    result[getThreadGroupKey(group)] = threads;
    paging[group] = { has_more };
  }
  return { ...result, paging };
}

/**
 * Normalize a thread-list (GET threads) response value to `{ threads }`.
 */
export function normalizeThreadsValue(value) {
  if (!value) {
    return value;
  }
  if (Array.isArray(value)) {
    return { threads: value };
  }
  const threads = value.threads || [];
  return { ...value, threads };
}

/**
 * Sort threads by latest activity (updated_at, descending; the legacy `time`
 * field is adapted at the source). The sort is stable, so records without
 * timestamps keep their relative order, after the timestamped ones.
 */
export function sortThreadsByLatest(threads = []) {
  return [...threads].sort(compareThreadsByLatest);
}

/**
 * Compare two threads by latest activity: the more recent sorts first.
 */
export function compareThreadsByLatest(a, b) {
  return String(b.updated_at || '').localeCompare(String(a.updated_at || ''));
}

/**
 * Normalize a thread-detail (GET threads/{id}) response value to
 * `{ thread, messages }`: the entire response — the thread metadata and its
 * `questions_ids`, with no message content — becomes the thread record, and
 * the messages start as `{ question_id }` records, to be filled in by the
 * answers follow-up request. A page fetched newest-first (order: desc)
 * passes `descending`, so the messages come out in display (ascending)
 * order either way. The page's paging word (`has_more`) is the page's, not
 * the thread's: it is lifted out of the thread record onto the value.
 */
export function normalizeThreadValue(value, { descending = false } = {}) {
  // messages already present -> already normalized (and possibly merged with
  // answers); leave them alone so re-processing (e.g. a local patch) is safe
  if (!value || value.messages) {
    return value;
  }
  const ids = value.questions_ids || [];
  const messages = (descending ? [...ids].reverse() : ids).map(question_id => ({ question_id }));
  const { has_more, ...thread } = value;
  return has_more === undefined ? { thread: value, messages } : { thread, messages, has_more };
}

/**
 * Whether the message is an update message: its question was written by the
 * answer-updates monitor rather than the user, per its metadata.
 */
export function isUpdateMessage(message) {
  return !!(message && message.metadata && message.metadata.miso_generated_by === 'answer_update_monitor');
}

/**
 * Whether the message's answer content is still to be fetched: absent or
 * unfinished — excluding a live message (its content streams in from the
 * posting request) and one settled by a fetch error (the `error` mark).
 */
export function isMessageUnsettled(message) {
  return !message.live && !message.error && (message.answer === undefined || message.finished === false);
}

/**
 * Question ids of messages whose answers are not settled: absent or still
 * being generated (finished: false) — driving the answers polling. Live
 * messages are excluded: their content streams in from the posting request.
 * The ids are deduplicated.
 */
export function getUnsettledQuestionIds(value) {
  if (!value || !value.messages) {
    return [];
  }
  return [...new Set(
    value.messages
      .filter(isMessageUnsettled)
      .map(message => message.question_id)
      .filter(Boolean)
  )];
}

/**
 * Settle the messages still waiting for their contents with a fetch error:
 * the answers stream ended erroneously — its polling already tolerates
 * transient failures, so by now the pending contents are not arriving —
 * and every unsettled message takes the `error` mark — the failure itself,
 * so its presentation can tell e.g. an expired session apart: excluded from
 * further polling (so the paging unblocks too), presented as erroneous by
 * its item. A reload of the thread starts over. Settled records keep their
 * identity, so only the errored items see a change.
 */
function writeAnswersErrorToMessages(data, error = true) {
  const value = data && data.value;
  if (!value || !value.messages) {
    return data;
  }
  const marked = value.messages.filter(isMessageUnsettled).map(message => ({ ...message, error }));
  const messages = mergeMessages(value.messages, { upsert: marked }, { within: () => false });
  return { ...data, value: { ...value, messages } };
}

/**
 * Normalize an answers API (POST ask/answers) response value to an array of
 * question-answer records. The response is a bare array.
 */
export function normalizeAnswersValue(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : (value.answers || []);
}

/**
 * Merge an answers response data — its value normalized to `{ messages }` by
 * the workflow's default data pass — into the current (head) data, in the
 * manner of concatItemsFromMoreResponse: a valueless update (the loading
 * update of the answers request) keeps the current data, so the head data
 * stays on display; a response merges into the head data's messages. An
 * erroneous end of the answers stream — its polling already tolerated
 * transient failures — settles every message still waiting with the error
 * mark (writeAnswersErrorToMessages): the items present it (visible-when),
 * the paging unblocks, and the poll is not re-issued; a later page's
 * unsettled messages start a fresh stream of their own.
 */
export function mergeAnswersDataFromResponse(newData, oldData) {
  if (newData.error) {
    return writeAnswersErrorToMessages(oldData, newData.error);
  }
  if (!newData.value) {
    return oldData;
  }
  const oldValue = (oldData && oldData.value) || {};
  const messages = mergeAnswersIntoMessages(oldValue.messages || [], newData.value.messages || []);
  return {
    ...newData,
    // the current meta rides along: it carries e.g. the paging exhaustion,
    // which an answers batch knows nothing about
    meta: { ...(oldData && oldData.meta), ...newData.meta },
    value: { ...oldValue, messages },
  };
}

/**
 * Merge an older messages page (a more-typed thread detail response, its
 * value homogenized to `{ thread, messages }` in display order) into the
 * current data: the page's messages are prepended above the displayed
 * ones — the displayed thread record stays (the page's copy is redundant).
 * A valueless update (the more
 * request's loading commit) keeps the current data on display. The page
 * was requested against the messages on display (`after` = the oldest
 * displayed question id): if the display has moved on and the cursor no
 * longer lines up, the stale page is dropped.
 */
export function mergeOlderMessagesFromResponse(newData, oldData) {
  if (!newData.value) {
    // the more request's loading commit keeps the current data on display;
    // a failed page (retries spent) additionally parks the paging as
    // exhausted — with the ready status retained, the trigger would re-arm
    // and refire into the same failure — recovered by reloading the thread
    if (newData.error && oldData && oldData.value) {
      return { ...oldData, meta: { ...oldData.meta, exhausted: true } };
    }
    return oldData;
  }
  const oldValue = (oldData && oldData.value) || {};
  const oldMessages = oldValue.messages || [];
  const first = oldMessages[0];
  const { after } = (newData.request && newData.request.payload) || {};
  if (!first || first.question_id !== after) {
    return oldData;
  }
  // a record displayed already is dropped from the page, just in case — the
  // displayed record (and its answer content) stays
  const displayed = new Set(oldMessages.map(message => message.question_id));
  const fresh = (newData.value.messages || []).filter(message => !displayed.has(message.question_id));
  return {
    ...newData,
    // the page's meta may carry the exhaustion (has_more: false)
    meta: { ...(oldData && oldData.meta), ...newData.meta },
    value: {
      ...oldValue,
      has_more: newData.value.has_more,
      messages: mergeMessages(oldMessages, { upsert: fresh }, { position: 'start' }),
    },
  };
}

/**
 * Merge question-answer records into messages by question id: an answer
 * fills its message's record in, field by field; an answer of no listed
 * message is ignored.
 */
export function mergeAnswersIntoMessages(messages, answers) {
  return mergeMessages(messages, { upsert: answers.filter(answer => answer.question_id) }, {
    keyOf: message => message.question_id,
    merge: (message, answer) => ({ ...message, ...answer }),
    within: () => false,
  });
}

/**
 * A message's identity in the list: its local placeholder id, for a message
 * posted in the page — it survives the settle, as the question id arrives —
 * or its question id. The messages layout keys its items the same way.
 */
export function messageKeyOf(message) {
  return message.placeholder_id || message.question_id;
}

/**
 * Merge message changes into the messages on display (mergeItems): keyed by
 * messageKeyOf, in display order — no sort, the records joining at the end
 * by default (a posted question), or at the start (an older page).
 */
export function mergeMessages(messages, changes, options = {}) {
  return mergeItems(messages, changes, { keyOf: messageKeyOf, ...options });
}
