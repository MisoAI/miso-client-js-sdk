import { API } from '@miso.ai/commons';

// `threads/${id}`, excluding the action paths (threads/_delete, .../read)
const THREAD_DETAIL_NAME_PATTERN = /^threads\/(?!_)[^/]+$/;

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
      case API.NAME.SEARCH:
        return client.api.ask.search(payload, options);
    }
  }
  if (group === API.GROUP.ASK_USER_HISTORY) {
    // the group is not a direct property of client.api, and name may carry a path (e.g. `threads/${id}`)
    return client.api.ask.userHistory._run(name, payload, options);
  }
  // because name is in snake case
  return client.api[group]._run(name, payload, options);
}

function processResponse({ group, name, payload, options }, response) {
  if (group === API.GROUP.ASK_USER_HISTORY) {
    // thread records may identify themselves by root question id only
    if (name === API.NAME.THREADS) {
      return fallbackThreadsFields(response);
    }
    if (THREAD_DETAIL_NAME_PATTERN.test(name)) {
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
