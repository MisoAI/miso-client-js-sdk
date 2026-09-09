import { API } from '@miso.ai/commons';

export function api(client) {
  return async (request) => {
    const response = await sendApi(client, request);
    return processResponse(request, response);
  };
}

function sendApi(client, { group, name, payload, options }) {
  if (group === API.GROUP.ASK) {
    switch (name) {
      case API.NAME.QUESTIONS:
        return client.api.ask.questions(payload, options);
      case API.NAME.ANSWERS:
        return client.api.ask.answers(payload, options);
      case API.NAME.SEARCH:
        return client.api.ask.search(payload, options);
    }
  }
  if (group === API.GROUP.THREADS) {
    return sendThreadsApi(client.api.ask.userHistory, name, payload, options);
  }
  // because name is in snake case
  return client.api[group]._run(name, payload, options);
}

// the thread requests of the chat-history workflows: simple names, the
// thread id in the payload, interpreted onto the user history API
function sendThreadsApi(api, name, payload = {}, options) {
  switch (name) {
    case 'list':
      return api.getThreads(options);
    case 'get':
      return api.getThread(payload.thread_id, options);
    case 'update': {
      const { thread_id, ...changes } = payload;
      return api.updateThread(thread_id, changes, options);
    }
    case 'mark_as_read':
      return api.markThreadAsRead(payload.thread_id, options);
    case 'subscribe':
      return api.subscribeThread(payload.thread_id, options);
    case 'unsubscribe':
      return api.unsubscribeThread(payload.thread_id, options);
    case 'delete':
      return api.deleteThreads(payload, options);
    case 'delete_all':
      return api.deleteAllThreads(options);
  }
  throw new Error(`Unknown threads API: ${name}`);
}

function processResponse({ group, name }, response) {
  if (group === API.GROUP.THREADS) {
    // thread records may identify themselves by root question id only
    if (name === 'list') {
      return fallbackThreadsFields(response);
    }
    if (name === 'get') {
      return fallbackThreadFields(response);
    }
  }
  return response;
}

/**
 * Fill in the canonical fields of a thread record from their alternatives:
 * `question_id` -> `thread_id` (some responses identify a thread by its root
 * question id only) and `time` -> `updated_at`. Downstream code reads the
 * canonical names only.
 */
export function fallbackThreadFields(thread) {
  if (!thread || typeof thread !== 'object') {
    return thread;
  }
  const patch = {};
  if (thread.thread_id === undefined && thread.question_id !== undefined) {
    patch.thread_id = thread.question_id;
  }
  if (thread.updated_at === undefined && thread.time !== undefined) {
    patch.updated_at = thread.time;
  }
  return Object.keys(patch).length > 0 ? { ...thread, ...patch } : thread;
}

/**
 * Apply the thread field fallbacks to a thread-list (GET threads) response
 * value, in either shape it comes (bare array or `threads`), leaving the shape
 * itself to normalizeThreadsValue.
 */
function fallbackThreadsFields(value) {
  if (Array.isArray(value)) {
    return value.map(fallbackThreadFields);
  }
  if (value && Array.isArray(value.threads)) {
    return { ...value, threads: value.threads.map(fallbackThreadFields) };
  }
  return value;
}
