import { test } from 'uvu';
import * as assert from 'uvu/assert';

import {
  isThreadUnread,
  normalizeThreadsValue,
  normalizeThreadValue,
  getUnsettledQuestionIds,
  normalizeAnswersValue,
  mergeAnswersIntoMessages,
  mergeAnswersDataFromResponse,
} from '../src/util/threads.js';

test('isThreadUnread: derives from subscribed && has_new', () => {
  assert.is(isThreadUnread({ subscribed: true, has_new: true }), true);
  assert.is(isThreadUnread({ subscribed: true, has_new: false }), false);
  assert.is(isThreadUnread({ subscribed: false, has_new: true }), false);
  assert.is(isThreadUnread({ has_new: true }), false);
  assert.is(isThreadUnread({}), false);
  assert.is(isThreadUnread(undefined), false);
});

test('normalizeThreadsValue', () => {
  const threads = [{ thread_id: 't1' }];
  assert.equal(normalizeThreadsValue(threads), { threads });
  assert.equal(normalizeThreadsValue({ threads }), { threads });
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

test('getUnsettledQuestionIds', () => {
  const value = {
    messages: [
      { question_id: 'q1', answer: 'A' },
      { question_id: 'q2' },
      { question_id: 'q3', answer: 'A3', finished: false },
      { question_id: 'q4', live: true },
      { question_id: 'q2' }, // a duplicate is reported once
    ],
  };
  assert.equal(getUnsettledQuestionIds(value), ['q2', 'q3']);
  assert.equal(getUnsettledQuestionIds({}), []);
  assert.equal(getUnsettledQuestionIds(undefined), []);
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
  // the value arrives normalized to { messages } by the default data pass
  const newData = {
    status: 'ready',
    request: { name: 'answers', type: 'answers' },
    value: { messages: [{ question_id: 'q1', answer: 'A1' }] },
  };
  const merged = mergeAnswersDataFromResponse(oldData, newData);
  assert.is(merged.request, headRequest);
  assert.is(merged.status, 'ready');
  assert.equal(merged.value.thread, { thread_id: 't1' });
  assert.equal(merged.value.messages, [{ question_id: 'q1', answer: 'A1' }]);
});

test.run();
