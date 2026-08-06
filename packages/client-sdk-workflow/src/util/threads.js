/**
 * Helpers to read thread records from the history API. The API is a
 * prototype, so field access is kept tolerant and centralized here: when the
 * response schema settles, this is the only place to update.
 */

export function getThreadId(thread) {
  return thread && thread.thread_id;
}

/**
 * Local id of a thread being created: a thread has no server identity until
 * its first question is posted, so its placeholder record carries a
 * `placeholder_id` in place of a thread id.
 */
export function getPlaceholderId(thread) {
  return thread && thread.placeholder_id;
}

/**
 * Settle a placeholder record into a real thread record, keyed by the thread
 * id it is known to have: the placeholder marks are stripped, the local
 * fields (title, updated_at) stand in until server data arrives.
 */
export function settlePlaceholder(placeholder, threadId) {
  const { placeholder: _placeholder, placeholder_id: _placeholderId, ...thread } = placeholder;
  return { ...thread, thread_id: threadId };
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
 * Time of the latest activity on a thread. Responses carrying the legacy
 * `time` field are adapted at the source (fallbackThreadFields).
 */
export function getThreadTime(thread) {
  return thread && thread.updated_at;
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
 * Sort threads by latest activity (updated_at, descending). The sort is
 * stable, so records without timestamps keep their relative order, after the
 * timestamped ones.
 */
export function sortThreadsByLatest(threads = []) {
  return [...threads].sort((a, b) => String(getThreadTime(b) || '').localeCompare(String(getThreadTime(a) || '')));
}

/**
 * Normalize a thread-detail (GET threads/{id}) response value to
 * `{ thread, messages }`: the entire response — the thread metadata and its
 * `questions_ids`, with no message content — becomes the thread record, and
 * the messages start as `{ question_id }` records, to be filled in by the
 * answers follow-up request.
 */
export function normalizeThreadValue(value) {
  // messages already present -> already normalized (and possibly merged with
  // answers); leave them alone so re-processing (e.g. a local patch) is safe
  if (!value || value.messages) {
    return value;
  }
  const messages = (value.questions_ids || []).map(question_id => ({ question_id }));
  return { thread: value, messages };
}

export function getQuestionId(message) {
  return message && message.question_id;
}

export function hasAnswer(message) {
  return !!message && message.answer !== undefined;
}

/**
 * Question ids of messages whose answers are not present yet.
 */
export function getPendingQuestionIds(value) {
  if (!value || !value.messages) {
    return [];
  }
  return value.messages.filter(message => !hasAnswer(message)).map(getQuestionId).filter(Boolean);
}

/**
 * Question ids of messages whose answers are not settled: absent or still
 * being generated (finished: false) — driving the answers polling. Live
 * messages are excluded: their content streams in from the posting request.
 */
export function getUnsettledQuestionIds(value) {
  if (!value || !value.messages) {
    return [];
  }
  return value.messages
    .filter(message => !message.live && (!hasAnswer(message) || message.finished === false))
    .map(getQuestionId)
    .filter(Boolean);
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
 * stays on display; a response merges into the head data's messages. The
 * head request is restored on the merged data, so the answers request stays
 * an internal detail of the data flow.
 */
export function mergeAnswersDataFromResponse(oldData, newData) {
  if (!newData.value) {
    return oldData;
  }
  const oldValue = (oldData && oldData.value) || {};
  const messages = mergeAnswersIntoMessages(oldValue.messages || [], newData.value.messages || []);
  return {
    ...newData,
    request: (oldData && oldData.request) || newData.request,
    value: { ...oldValue, messages },
  };
}

/**
 * Merge a posted question (ask questions API) response data — its value
 * normalized to `{ messages }` by the workflow's default data pass, carrying
 * the last message of the conversation — into the current data. A valueless
 * update (the loading update of the posting request) keeps the current data;
 * the head request is restored on the merged data.
 */
export function mergeFollowUpDataFromResponse(oldData, newData) {
  if (!newData.value) {
    return oldData;
  }
  const newMessages = newData.value.messages || [];
  const patch = newMessages[newMessages.length - 1] || {};
  const oldValue = (oldData && oldData.value) || {};
  const messages = [...(oldValue.messages || [])];
  const last = messages.length ? messages[messages.length - 1] : {};
  messages[Math.max(messages.length - 1, 0)] = { ...last, ...patch };
  // restore the head request; in new-thread mode there is none, so strip the
  // request type marker (and the carried placeholder record), lest local
  // patches re-enter this merge
  const { type: _type, placeholder: _placeholder, ...typelessRequest } = newData.request || {};
  return {
    ...newData,
    request: (oldData && oldData.request) || typelessRequest,
    value: { ...oldValue, messages },
  };
}

/**
 * Merge question-answer records into messages by question id.
 */
export function mergeAnswersIntoMessages(messages, answers) {
  const byId = new Map();
  for (const answer of answers) {
    const id = getQuestionId(answer);
    id && byId.set(id, answer);
  }
  return messages.map(message => {
    const answer = byId.get(getQuestionId(message));
    return answer ? { ...message, ...answer } : message;
  });
}
