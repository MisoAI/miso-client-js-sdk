import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { createClient, tick } from './dummy.js';

/**
 * Consecutive submits of follow-up questions (e.g. a double click on a
 * suggested question) make one API call only: a submit is held while the
 * previous question is still being answered.
 */

const answered = question_ids => question_ids.map(question_id => ({
  question_id,
  question: `Question of ${question_id}`,
  answer: `Answer of ${question_id}`,
  finished: true,
}));

const posts = calls => calls.filter(call => call.startsWith('POST questions'));

test('conversation: consecutive suggested question submits post once', async () => {
  const { client, calls } = createClient({ answers: answered });
  const { conversation } = client.workflows;

  conversation.load('t1');
  await tick();
  const message = conversation._getMessageWorkflow('q2');

  message._onFollowUpQuestionSelect({ value: 'More on q2?' });
  message._onFollowUpQuestionSelect({ value: 'More on q2?' });
  conversation._onFollowUpClick({ q: 'Another one?', event: { button: 0 } });
  await tick();

  assert.is(posts(calls).length, 1);
  assert.is(conversation.messages.length, 3);

  // once the answer has arrived, a follow-up goes through again
  message._onFollowUpQuestionSelect({ value: 'Yet more?' });
  await tick();
  assert.is(posts(calls).length, 2);
  assert.is(conversation.messages.length, 4);
});

test('ask: consecutive suggested question submits post once', async () => {
  const { client, calls } = createClient();
  // ask reads a response as its answer by the answer stage
  const { questions } = client.api.ask;
  client.api.ask.questions = async payload => ({ ...await questions(payload), answer_stage: 'finished' });
  const root = client.workflows.asks.root;

  root.query({ q: 'First?' });
  await tick();
  assert.is(posts(calls).length, 1);
  assert.ok(root.questionId);

  root._onFollowUpQuestionSelect({ value: 'Second?' });
  root._onFollowUpQuestionSelect({ value: 'Second?' });
  root._onFollowUpClick({ q: 'Third?', event: { button: 0 } });
  await tick();

  assert.is(posts(calls).length, 2);
  assert.ok(posts(calls)[1].includes('"question":"Second?"'));

  // once the answer has arrived, a follow-up goes through again
  root.next._onFollowUpQuestionSelect({ value: 'Fourth?' });
  await tick();
  assert.is(posts(calls).length, 3);
  assert.ok(posts(calls)[2].includes('"question":"Fourth?"'));
});

test.run();
