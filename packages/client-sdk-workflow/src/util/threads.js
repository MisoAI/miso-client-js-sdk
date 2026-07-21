/**
 * Helpers to read thread records from the history API. The API is a
 * prototype, so field access is kept tolerant and centralized here: when the
 * response schema settles, this is the only place to update.
 */

export function getThreadId(thread) {
  return thread && thread.thread_id;
}

export function isThreadUnread(thread) {
  return !!thread && (thread.unread === true || thread.read === false);
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
  const threads = value.threads || value.rows || [];
  return { ...value, threads };
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
 * Merge an answers response data into the current (head) data, in the manner
 * of concatItemsFromMoreResponse: a valueless update (the loading update of
 * the answers request) keeps the current data, so the head data stays on
 * display; a response merges into the head data's messages. The head request
 * is restored on the merged data, so the answers request stays an internal
 * detail of the data flow.
 */
export function mergeAnswersDataFromResponse(oldData, newData) {
  if (!newData.value) {
    return oldData;
  }
  const oldValue = (oldData && oldData.value) || {};
  const messages = mergeAnswersIntoMessages(oldValue.messages || [], normalizeAnswersValue(newData.value));
  return {
    ...newData,
    request: (oldData && oldData.request) || newData.request,
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
