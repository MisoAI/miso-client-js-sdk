import { test } from 'uvu';
import * as assert from 'uvu/assert';

import {
  getThreadId,
  isThreadUnread,
  normalizeThreadsValue,
  normalizeThreadValue,
  getQuestionId,
  hasAnswer,
  getPendingQuestionIds,
  normalizeAnswersValue,
  mergeAnswersIntoMessages,
  mergeAnswersDataFromResponse,
} from '../src/util/threads.js';

test('getThreadId', () => {
  assert.is(getThreadId({ thread_id: 't1' }), 't1');
  assert.is(getThreadId(undefined), undefined);
});

test('isThreadUnread', () => {
  assert.is(isThreadUnread({ unread: true }), true);
  assert.is(isThreadUnread({ read: false }), true);
  assert.is(isThreadUnread({ unread: false }), false);
  assert.is(isThreadUnread({}), false);
  assert.is(isThreadUnread(undefined), false);
});

test('normalizeThreadsValue', () => {
  const threads = [{ thread_id: 't1' }];
  assert.equal(normalizeThreadsValue(threads), { threads });
  assert.equal(normalizeThreadsValue({ threads }), { threads });
  assert.equal(normalizeThreadsValue({ rows: threads }), { rows: threads, threads });
  assert.equal(normalizeThreadsValue({}), { threads: [] });
  assert.is(normalizeThreadsValue(undefined), undefined);
});

test('normalizeThreadValue', () => {
  const value = { thread_id: 't1', title: 'First', questions_ids: ['q1', 'q2'] };
  const normalized = normalizeThreadValue(value);
  assert.equal(normalized, {
    thread: value,
    messages: [{ question_id: 'q1' }, { question_id: 'q2' }],
  });
});

test('normalizeThreadValue: idempotent', () => {
  // re-processing (e.g. a local patch) must not reset merged messages
  const normalized = normalizeThreadValue({ thread_id: 't1', questions_ids: ['q1'] });
  const merged = {
    ...normalized,
    messages: mergeAnswersIntoMessages(normalized.messages, [{ question_id: 'q1', answer: 'A' }]),
  };
  assert.is(normalizeThreadValue(merged), merged);
});

test('getQuestionId / hasAnswer', () => {
  assert.is(getQuestionId({ question_id: 'q1' }), 'q1');
  assert.is(getQuestionId(undefined), undefined);
  assert.is(hasAnswer({ question_id: 'q1', answer: 'A' }), true);
  assert.is(hasAnswer({ question_id: 'q1' }), false);
  assert.is(hasAnswer(undefined), false);
});

test('getPendingQuestionIds', () => {
  const value = {
    messages: [
      { question_id: 'q1', answer: 'A' },
      { question_id: 'q2' },
      { question_id: 'q3' },
    ],
  };
  assert.equal(getPendingQuestionIds(value), ['q2', 'q3']);
  assert.equal(getPendingQuestionIds({}), []);
  assert.equal(getPendingQuestionIds(undefined), []);
});

test('normalizeAnswersValue', () => {
  const answers = [{ question_id: 'q1' }];
  assert.equal(normalizeAnswersValue({ answers }), answers);
  assert.equal(normalizeAnswersValue(answers), answers);
  assert.equal(normalizeAnswersValue(undefined), []);
});

test('mergeAnswersIntoMessages', () => {
  const messages = [{ question_id: 'q1' }, { question_id: 'q2' }];
  const merged = mergeAnswersIntoMessages(messages, [{ question_id: 'q2', answer: 'A2' }]);
  assert.equal(merged, [
    { question_id: 'q1' },
    { question_id: 'q2', answer: 'A2' },
  ]);
});

test('mergeAnswersDataFromResponse: valueless update keeps current data', () => {
  const oldData = { request: { name: 'threads/t1' }, value: { messages: [] } };
  assert.is(mergeAnswersDataFromResponse(oldData, { request: { type: 'answers' } }), oldData);
});

test('mergeAnswersDataFromResponse: merges and restores the head request', () => {
  const headRequest = { name: 'threads/t1', type: 'thread' };
  const oldData = {
    request: headRequest,
    value: { thread: { thread_id: 't1' }, messages: [{ question_id: 'q1' }] },
  };
  const newData = {
    status: 'ready',
    request: { name: 'answers', type: 'answers' },
    value: { answers: [{ question_id: 'q1', answer: 'A1' }] },
  };
  const merged = mergeAnswersDataFromResponse(oldData, newData);
  assert.is(merged.request, headRequest);
  assert.is(merged.status, 'ready');
  assert.equal(merged.value.thread, { thread_id: 't1' });
  assert.equal(merged.value.messages, [{ question_id: 'q1', answer: 'A1' }]);
});

test.run();
