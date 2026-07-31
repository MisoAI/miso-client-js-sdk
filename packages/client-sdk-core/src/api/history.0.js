import UserHistory from './history.js';

/**
 * The user history API as deployed today (version 0): a flat, POST-only
 * surface where a thread is addressed by the `question_id` of its root
 * question, with its own request/response shapes.
 * @see https://miso-docs.apidocumentation.com/api/genai/user-history
 *
 * It adapts the v0 wire format behind the interface of UserHistory in
 * history.js — the resource-style API the SDK is written against, not
 * released yet. All calls funnel through `_run`, where the resource-style
 * (name, payload, method) is translated to its v0 form and the response
 * value back to the resource-style shape, so the workflow layer stays
 * version-agnostic. When the resource-style API ships, switching the SDK
 * over means using UserHistory in ask.js again.
 */
export default class UserHistoryV0 extends UserHistory {

  async _run(apiName, payload, options = {}) {
    const { name, payload: v0Payload, adapt } = translate(apiName, payload, options);
    const value = await super._run(name, v0Payload, { ...options, method: 'POST' });
    return adapt ? adapt(value) : value;
  }

}

/**
 * Translate a resource-style (name, payload, method) call to its v0 form.
 * The v0 payload is always an object — even when the resource-style call
 * carries none (a GET) — so the context plugin's payload pass attaches the
 * user info (user_id/anonymous_id) that v0 endpoints require.
 */
function translate(apiName, payload, { method = 'POST' } = {}) {
  switch (apiName) {
    case 'threads': // GET threads -> POST <group root>
      return { name: '', payload: { ...payload }, adapt: adaptThreadEntries };
    case 'threads/_delete': {
      const { thread_ids: ids = [], ...rest } = payload || {};
      return { name: 'delete', payload: { ...rest, ids } };
    }
    case 'threads/_delete_all':
      return { name: 'delete_all', payload: { ...payload } };
    case 'notifications': // GET notifications -> POST thread/updates
      return { name: 'thread/updates', payload: { ...payload } };
    case 'notifications/dismiss':
      return { name: 'thread/updates/dismiss_overall', payload: { ...payload } };
  }
  const segments = apiName.split('/');
  if (segments[0] === 'threads' && segments.length === 2) {
    const question_id = segments[1]; // the thread id is its root question id
    switch (method) {
      case 'GET': // GET threads/{id} -> POST thread
        return { name: 'thread', payload: { ...payload, question_id }, adapt: value => adaptThreadDetail(question_id, value) };
      case 'PUT': // PUT threads/{id} { title } -> POST thread/rename
        return { name: 'thread/rename', payload: { ...payload, question_id } };
      case 'DELETE': // DELETE threads/{id} -> POST delete
        return { name: 'delete', payload: { ids: [question_id] } };
    }
  }
  if (segments[0] === 'threads' && segments.length === 3 && segments[2] === 'read') {
    return { name: 'thread/updates/dismiss_thread', payload: { ...payload, thread_id: segments[1] } };
  }
  throw new Error(`Unknown user history API: ${method} ${apiName}`);
}

function adaptThreadEntries(value) {
  return Array.isArray(value) ? value.map(adaptThreadEntry) : value;
}

/**
 * A v0 thread entry carries (id, question_id, question, time); the
 * resource-style records read (thread_id, title, updated_at). A thread is
 * keyed by its root question, so question_id serves as the thread id.
 */
function adaptThreadEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return entry;
  }
  const { id, question_id = id, question, time, ...rest } = entry;
  return {
    ...rest,
    thread_id: question_id,
    question_id,
    title: rest.title !== undefined ? rest.title : question,
    updated_at: rest.updated_at !== undefined ? rest.updated_at : time,
  };
}

/**
 * The v0 open-thread response carries the question ids only — no thread
 * metadata: synthesize the thread record around them, keyed by the requested
 * question id.
 */
function adaptThreadDetail(question_id, value) {
  if (!value || typeof value !== 'object') {
    return value;
  }
  const { question_ids = [], ...rest } = value;
  return { ...rest, thread_id: question_id, questions_ids: question_ids };
}
