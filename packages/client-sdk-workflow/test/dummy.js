import { EventEmitter } from '@miso.ai/commons';
import { WorkflowPlugin, Workflows } from '../src/index.js';

/**
 * Test harness for history/thread workflow tests: a dummy client with a
 * scriptable user-history + answers API, recording all API calls.
 */

export const tick = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

export const DEFAULT_THREADS = [
  { thread_id: 't1', title: 'First thread', unread: false },
  { thread_id: 't2', title: 'Second thread', unread: true },
];

export const defaultThreadDetail = id => ({
  ...DEFAULT_THREADS.find(thread => thread.thread_id === id),
  questions_ids: ['q1', 'q2'],
});

export const answersOf = question_ids => question_ids.map(question_id => ({
  question_id,
  question: `Question of ${question_id}`,
  answer: `Answer of ${question_id}`,
}));

export function createClient({
  threads = DEFAULT_THREADS,
  threadDetail = defaultThreadDetail,
  answers = question_ids => answersOf(question_ids), // the response is a bare array
} = {}) {
  const calls = [];

  const userHistory = {
    async _run(name, payload, options = {}) {
      calls.push(`${options.method || 'POST'} ${name}`);
      if (name === 'threads') {
        return { threads: threads.map(thread => ({ ...thread })) };
      }
      if (name.startsWith('threads/')) {
        return threadDetail(name.split('/')[1]);
      }
      throw new Error(`unexpected api call: ${name}`);
    },
    async updateThread(threadId, payload) {
      calls.push(`PUT threads/${threadId} ${JSON.stringify(payload)}`);
    },
    async deleteThread(threadId) {
      calls.push(`DELETE threads/${threadId}`);
    },
    async deleteThreads(payload) {
      calls.push(`POST threads/_delete ${JSON.stringify(payload)}`);
    },
    async deleteAllThreads() {
      calls.push(`POST threads/_delete_all`);
    },
    async markThreadAsRead(threadId) {
      calls.push(`POST threads/${threadId}/read`);
    },
  };

  const client = {
    meta: { parent: { _hubUpdateCallbacks: [], _hubEmitCallbacks: [] } },
    _events: new EventEmitter(),
    api: {
      ask: {
        userHistory,
        async answers(payload) {
          calls.push(`POST answers ${JSON.stringify(payload.question_ids)}`);
          return answers(payload.question_ids);
        },
        // for custom api names (useAnswers overrides), via the generic source path
        async _run(name, payload) {
          calls.push(`POST ask/${name} ${JSON.stringify(payload)}`);
          return answers(payload.question_ids);
        },
      },
    },
  };
  client.workflows = new Workflows(new WorkflowPlugin(), client);

  return { client, calls };
}
