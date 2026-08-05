import { EventEmitter } from '@miso.ai/commons';
import { WorkflowPlugin, Workflows } from '../src/index.js';

/**
 * Test harness for history/thread workflow tests: a dummy client with a
 * scriptable user-history + answers API, recording all API calls.
 */

export const tick = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

export const DEFAULT_THREADS = [
  { thread_id: 't1', title: 'First thread', has_new: false },
  { thread_id: 't2', title: 'Second thread', has_new: true },
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
  threadDetailError, // when set, thread detail requests fail with it
  answers = question_ids => answersOf(question_ids), // the response is a bare array
} = {}) {
  threads = threads.map(thread => ({ ...thread })); // a mutable local copy
  const createdThreads = new Map(); // thread_id -> detail, for threads created by questions
  const calls = [];

  const userHistory = {
    async getThreads() {
      calls.push('GET threads');
      return { threads: threads.map(thread => ({ ...thread })) };
    },
    async _run(name, payload, options = {}) {
      calls.push(`${options.method || 'POST'} ${name}`);
      if (name === 'threads') {
        return { threads: threads.map(thread => ({ ...thread })) };
      }
      if (name.startsWith('threads/')) {
        if (threadDetailError) {
          throw threadDetailError;
        }
        const id = name.split('/')[1];
        return createdThreads.get(id) || threadDetail(id);
      }
      throw new Error(`unexpected api call: ${name}`);
    },
    async updateThread(threadId, payload) {
      calls.push(`PUT threads/${threadId} ${JSON.stringify(payload)}`);
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

  let questionSeq = 0;
  const client = {
    meta: { parent: { _hubUpdateCallbacks: [], _hubEmitCallbacks: [] } },
    _events: new EventEmitter(),
    api: {
      ask: {
        userHistory,
        async questions(payload) {
          calls.push(`POST questions ${JSON.stringify(payload)}`);
          const question_id = `q-new-${++questionSeq}`;
          if (!payload.parent_question_id) {
            // a root question creates a new thread server-side, whose id is
            // the id of that first question
            const record = {
              thread_id: question_id,
              title: payload.question,
              time: `2026-07-28T00:00:${String(questionSeq).padStart(2, '0')}`,
              has_new: false,
            };
            threads.push(record);
            createdThreads.set(record.thread_id, { ...record, questions_ids: [question_id] });
          }
          return {
            question_id,
            question: payload.question,
            answer: `Answer of ${payload.question}`,
            finished: true,
            sources: [],
          };
        },
        // the answers endpoint (and useAnswers overrides) via the generic source path
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
