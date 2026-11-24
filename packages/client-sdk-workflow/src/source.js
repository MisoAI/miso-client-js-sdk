import { API } from '@miso.ai/commons';
import { THREADS_API_NAME } from './constants.js';
import { normalizeThreadValue, normalizeThreadGroupsValue, normalizeAnswersValue, getThreadGroupOfFilter } from './util/threads.js';

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
    case THREADS_API_NAME.LIST:
      return payload.groups ? getThreadGroups(api, payload, options) : api.getThreads(payload, options);
    case THREADS_API_NAME.GET: {
      const { thread_id, ...rest } = payload;
      return api.getThread(thread_id, rest, options);
    }
    case THREADS_API_NAME.RENAME: {
      const { thread_id, ...changes } = payload;
      return api.updateThread(thread_id, changes, options);
    }
    case THREADS_API_NAME.FAVORITE: {
      const { thread_id, ...rest } = payload;
      return api.favoriteThread(thread_id, rest, options);
    }
    case THREADS_API_NAME.MARK_AS_READ:
      return api.markThreadAsRead(payload.thread_id, options);
    case THREADS_API_NAME.SUBSCRIBE:
      return api.subscribeThread(payload.thread_id, options);
    case THREADS_API_NAME.UNSUBSCRIBE:
      return api.unsubscribeThread(payload.thread_id, options);
    case THREADS_API_NAME.DELETE:
      return api.deleteThreads(payload, options);
    case THREADS_API_NAME.DELETE_ALL:
      return api.deleteAllThreads(options);
  }
  throw new Error(`Unknown threads API: ${name}`);
}

// a grouped list read: `groups` maps each group name to its list filter
// (e.g. `{ all: {}, favorite: { favorite: true } }`), the rest of the payload
// (the paging window) applying to every group — one list call per group, in
// parallel, the responses keyed by group name
async function getThreadGroups(api, { groups, ...payload }, options) {
  const entries = await Promise.all(Object.entries(groups).map(async ([group, filter]) =>
    [group, await api.getThreads({ ...payload, ...filter }, options)]));
  return Object.fromEntries(entries);
}

// Align a response to the value shape its workflow takes in updateData(), so
// every input of a workflow's data pipeline — responses and local patches
// alike — comes in the one shape:
// - the chat-history thread list (History): `{ threads, favorite,
//   unfavorite, paging }`, the groups listed (a more page lists its own
//   group only, told by its list filter), each group's paging word under
//   `paging[group]`
// - a thread detail page (Conversation): `{ thread, messages, has_more }`
// - an answers batch (Conversation): `{ messages }` — each value of the
//   polling stream
function processResponse({ group, name, payload }, response) {
  switch (group) {
    case API.GROUP.ASK:
      switch (name) {
        case API.NAME.ANSWERS:
          return mapResponse(response, value => ({ messages: normalizeAnswersValue(value) }));
      }
      break;
    case API.GROUP.THREADS:
      // thread records may identify themselves by root question id only
      switch (name) {
        case THREADS_API_NAME.LIST:
          if (payload && payload.groups && response) {
            return normalizeThreadGroupsValue(
              Object.fromEntries(Object.entries(response).map(([key, value]) => [key, fallbackThreadsFields(value)])));
          }
          return normalizeThreadGroupsValue(fallbackThreadsFields(response), { group: getThreadGroupOfFilter(payload) });
        case THREADS_API_NAME.GET:
          return normalizeThreadValue(fallbackThreadFields(response), { descending: !!(payload && payload.order === 'desc') });
      }
      break;
  }
  return response;
}

// map a response — a value, or a stream of them (an async iterable, its head
// response, if any, riding along as `_response`, as the data actor reads it)
function mapResponse(response, fn) {
  if (!response || !response[Symbol.asyncIterator]) {
    return response === undefined ? response : fn(response);
  }
  return {
    _response: response._response === undefined ? undefined : fn(response._response),
    async *[Symbol.asyncIterator]() {
      for await (const value of response) {
        yield value === undefined ? value : fn(value);
      }
    },
  };
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
