import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { STATUS } from '../src/index.js';
import { createClient, tick } from './dummy.js';

/**
 * The message item subworkflows behind <miso-message> elements: created via
 * the conversation workflow (getMessageWorkflow), fed by it through
 * updateData() — they make no requests of their own.
 */

const answersWithSources = question_ids => question_ids.map((question_id, i) => ({
  question_id,
  question: `Question of ${question_id}`,
  answer: `Answer of ${question_id}`,
  finished: true,
  sources: [{ product_id: `product-of-${question_id}` }],
  // the lineage lives on the record
  ...(i > 0 ? { parent_question_id: question_ids[i - 1] } : {}),
}));

test('message workflows receive records pushed from the conversation', async () => {
  const { client, calls } = createClient({ answers: answersWithSources });
  const { conversation } = client.workflows;

  // created before any data: seeded once the thread loads
  const early = conversation.getMessageWorkflow('q1');
  assert.is(early.states.data.value, undefined);

  conversation.load('t1');
  await tick();

  assert.is(early.status, STATUS.READY);
  assert.is(early.questionId, 'q1');
  assert.is(early.message.question, 'Question of q1');

  // created after the data landed: seeded with the record right away
  const apiCallsBefore = calls.length;
  const late = conversation.getMessageWorkflow('q2');
  assert.is(late.status, STATUS.READY);
  assert.is(late.message.answer, 'Answer of q2');

  // the context keeps one instance per question id, and the message
  // workflows make no api calls of their own (data actor off)
  assert.is(client.workflows.messages.getByQuestionId('q1'), early);
  assert.is(calls.length, apiCallsBefore);
});

test('message interactions carry the question lineage and dedupe per message', async () => {
  const { client, interactions } = createClient({ answers: answersWithSources });
  const { conversation } = client.workflows;

  conversation.load('t2');
  await tick();
  const message = conversation.getMessageWorkflow('q2');

  message._onCitationClick({ index: 1, event: { button: 0 } });
  assert.is(interactions.length, 1);
  const interaction = interactions[0];
  assert.is(interaction.type, 'click');
  assert.equal(interaction.product_ids, ['product-of-q2']);
  const context = interaction.context.custom_context;
  assert.is(context.property, 'sources');
  assert.is(context.event_target, 'citation-link');
  assert.is(context.question_id, 'q2');
  assert.is(context.parent_question_id, 'q1');
  assert.is(context.root_question_id, 't2');
  assert.is(context.question_source, '_organic');

  // the same citation clicked again is deduplicated at the message level...
  message._onCitationClick({ index: 1, event: { button: 0 } });
  assert.is(interactions.length, 1);

  // ...while another message keeps its own tracker states
  const sibling = conversation.getMessageWorkflow('q1');
  sibling._onCitationClick({ index: 1, event: { button: 0 } });
  assert.is(interactions.length, 2);
  assert.is(interactions[1].context.custom_context.question_id, 'q1');
  assert.is(interactions[1].context.custom_context.parent_question_id, undefined);
});

test('a just-posted message gets a workflow before its question id, and adopts it', async () => {
  const { client } = createClient();
  const { conversation } = client.workflows;

  conversation.load('t1');
  await tick();
  conversation.send('What about miso ramen?'); // no tick: the response is pending

  // the optimistic record is keyed by a local placeholder id
  const live = conversation.messages[conversation.messages.length - 1];
  assert.ok(live.placeholder_id);
  assert.is(live.question_id, undefined);

  // the workflow binds by the record — no question id needed — and is seeded
  const workflow = conversation.getMessageWorkflow(live);
  assert.is(workflow.questionId, undefined);
  assert.is(workflow.message.question, 'What about miso ramen?');

  await tick(); // the response arrives

  // the same workflow adopted the question id and received the answer
  const settled = conversation.messages[conversation.messages.length - 1];
  assert.ok(settled.question_id);
  assert.is(conversation.getMessageWorkflow(settled), workflow);
  assert.is(client.workflows.messages.getByQuestionId(settled.question_id), workflow);
  assert.is(workflow.questionId, settled.question_id);
  assert.is(workflow.message.answer, 'Answer of What about miso ramen?');
});

test('an answerless record presents as loading; an unfinished one as ongoing', async () => {
  const { client } = createClient();
  const { conversation } = client.workflows;

  const message = conversation.getMessageWorkflow('q9');

  // the answer body is still being fetched: the standard loading status,
  // which the container layout stamps on the <miso-message> element
  message.updateData({ session: message.session, value: { question_id: 'q9' } });
  assert.is(message.status, STATUS.LOADING);

  message.updateData({ session: message.session, value: { question_id: 'q9', answer: 'partial', finished: false } });
  assert.is(message.status, STATUS.READY);
  assert.is(message.states.data.ongoing, true);

  message.updateData({ session: message.session, value: { question_id: 'q9', answer: 'complete', finished: true } });
  assert.is(message.states.data.ongoing, undefined);
});

test.run();
