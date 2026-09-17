import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { STATUS } from '../src/index.js';
import { createClient, tick } from './dummy.js';

/**
 * The conversation panel's message paging, chat-style from the bottom: the
 * head request fetches the newest page of question ids (order: desc), older
 * pages prepend through the more flow, and the answer contents arrive in
 * capped batches, newest unsettled first.
 */

const QUESTIONS = Array.from({ length: 7 }, (_, i) => `q${i + 1}`); // q1 oldest ... q7 newest

function setup(options = {}) {
  const { client, calls } = createClient({
    threads: [{ thread_id: 't1', title: 'Long thread' }],
    threadDetail: id => ({ thread_id: id, title: 'Long thread', questions_ids: [...QUESTIONS] }),
    pollingInterval: 5,
    ...options,
  });
  const { conversation } = client.workflows;
  conversation.usePagination({ rows: 3, answersRows: 2 });
  return { client, calls, conversation };
}

const questionIds = conversation => conversation.messages.map(m => m.question_id);
const answersBatches = calls => calls
  .filter(c => c.startsWith('POST ask/answers '))
  .map(c => JSON.parse(c.slice('POST ask/answers '.length)).question_ids);

test('conversation: loads the newest page, the contents arriving in capped batches', async () => {
  const { calls, conversation } = setup();

  conversation.load('t1');
  await tick(50);
  assert.is(conversation.status, STATUS.READY);
  assert.equal(questionIds(conversation), ['q5', 'q6', 'q7']);
  assert.ok(conversation.messages.every(m => m.answer));
  assert.is(conversation.exhausted, false);
  // the head fetched the newest page of question ids...
  assert.ok(calls.includes('GET threads/t1 {"order":"desc","rows":3}'));
  // ...and the answer contents arrived in capped batches, newest first
  assert.equal(answersBatches(calls), [['q6', 'q7'], ['q5']]);
});

test('conversation: older pages prepend, until the thread start is reached', async () => {
  const { calls, conversation } = setup();

  conversation.load('t1');
  await tick(50);

  conversation._more();
  await tick(50);
  assert.equal(questionIds(conversation), ['q2', 'q3', 'q4', 'q5', 'q6', 'q7']);
  assert.ok(calls.includes('GET threads/t1 {"order":"desc","rows":3,"after":"q5"}'));
  assert.is(conversation.exhausted, false);
  // the prepended page's contents got polled too, capped batches walking up
  assert.ok(conversation.messages.every(m => m.answer));
  assert.equal(answersBatches(calls).slice(2), [['q3', 'q4'], ['q2']]);

  conversation._more();
  await tick(50);
  assert.equal(questionIds(conversation), ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7']);
  assert.is(conversation.exhausted, true);
  assert.ok(conversation.messages.every(m => m.answer));

  // exhausted: a further more is ignored
  conversation._more();
  await tick();
  assert.is(calls.filter(c => c.startsWith('GET threads/t1')).length, 3);
});

test('conversation: paging holds while the displayed contents still load', async () => {
  const { calls, conversation } = setup();

  conversation.load('t1');
  await tick(); // the head landed, but the answer batches are still walking up
  assert.is(conversation.status, STATUS.READY);
  assert.ok(conversation.messages.some(m => m.answer === undefined));

  // held: the unsettled shells understate the list's eventual height, so a
  // visible trigger means nothing yet
  conversation._more();
  await tick(50);
  assert.equal(questionIds(conversation), ['q5', 'q6', 'q7']); // no page fetched
  assert.is(calls.filter(c => c.startsWith('GET threads/t1')).length, 1);

  // settled: the next more pages as usual
  conversation._more();
  await tick(50);
  assert.equal(questionIds(conversation), ['q2', 'q3', 'q4', 'q5', 'q6', 'q7']);
});

test('conversation: a failed older page parks the paging, keeping the messages on display', async () => {
  const { client, calls, conversation } = setup();

  conversation.load('t1');
  await tick(50);

  // the next page fails for good (past the fetch-layer retries)
  const userHistory = client.api.ask.userHistory;
  const getThread = userHistory.getThread;
  userHistory.getThread = async (threadId, payload) => {
    calls.push(`GET threads/${threadId} ${JSON.stringify(payload)} -> error`);
    throw new Error('boom');
  };
  conversation._more();
  await tick(50);
  assert.equal(questionIds(conversation), ['q5', 'q6', 'q7']);
  assert.is(conversation.status, STATUS.READY);
  assert.is(conversation.exhausted, true); // parked: the trigger refiring is a no-op
  conversation._more();
  await tick();
  assert.is(calls.filter(c => c.endsWith('-> error')).length, 1);

  // reloading the thread starts over
  userHistory.getThread = getThread;
  conversation.load('t1', { force: true });
  await tick(50);
  assert.is(conversation.exhausted, false);
  assert.equal(questionIds(conversation), ['q5', 'q6', 'q7']);
});

test('conversation: failed answer contents settle as errors, unblocking the paging', async () => {
  const { calls, conversation } = setup({
    answers: () => { throw new Error('boom'); },
  });

  conversation.load('t1');
  await tick(150); // the polling tolerates failures until its error limit
  assert.is(conversation.status, STATUS.READY); // the panel itself stays ready
  assert.equal(questionIds(conversation), ['q5', 'q6', 'q7']);
  assert.ok(conversation.messages.every(m => m.error === true && m.answer === undefined));

  // the errored messages count as settled: paging is not held back, and the
  // prepended page starts an answers stream of its own (failing over too)
  conversation._more();
  await tick(150);
  assert.equal(questionIds(conversation), ['q2', 'q3', 'q4', 'q5', 'q6', 'q7']);
  assert.ok(conversation.messages.every(m => m.error === true));
});

test('conversation: a follow-up posts and appends while older pages are on display', async () => {
  const { conversation } = setup();

  conversation.load('t1');
  await tick(50);
  conversation._more();
  await tick(50);

  conversation.send('One more question');
  await tick(50);
  const ids = questionIds(conversation);
  assert.is(ids.length, 7);
  assert.is(ids[ids.length - 1], 'q-new-1'); // appended at the bottom
  assert.equal(ids.slice(0, 6), ['q2', 'q3', 'q4', 'q5', 'q6', 'q7']);
});

test.run();
