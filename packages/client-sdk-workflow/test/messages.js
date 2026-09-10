import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { STATUS } from '../src/index.js';
import { createClient, tick } from './dummy.js';

/**
 * The message item subworkflows behind <miso-message> elements: created via
 * the conversation workflow (_getMessageWorkflow), fed by it through
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
  const early = conversation._getMessageWorkflow('q1');
  assert.is(early.states.data.value, undefined);

  conversation.load('t1');
  await tick();

  assert.is(early.status, STATUS.READY);
  assert.is(early.questionId, 'q1');
  assert.is(early.message.question, 'Question of q1');

  // created after the data landed: seeded with the record right away
  const apiCallsBefore = calls.length;
  const late = conversation._getMessageWorkflow('q2');
  assert.is(late.status, STATUS.READY);
  assert.is(late.message.answer, 'Answer of q2');

  // the context keeps one instance per question id, and the message
  // workflows make no api calls of their own (data actor off)
  assert.is(client.workflows.messageItems.getByQuestionId('q1'), early);
  assert.is(calls.length, apiCallsBefore);
});

test('message interactions carry the question lineage and dedupe per message', async () => {
  const { client, interactions } = createClient({ answers: answersWithSources });
  const { conversation } = client.workflows;

  conversation.load('t2');
  await tick();
  const message = conversation._getMessageWorkflow('q2');

  message._onAnswerCitationClick({ index: 1, event: { button: 0 } });
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
  message._onAnswerCitationClick({ index: 1, event: { button: 0 } });
  assert.is(interactions.length, 1);

  // ...while another message keeps its own tracker states
  const sibling = conversation._getMessageWorkflow('q1');
  sibling._onAnswerCitationClick({ index: 1, event: { button: 0 } });
  assert.is(interactions.length, 2);
  assert.is(interactions[1].context.custom_context.question_id, 'q1');
  assert.is(interactions[1].context.custom_context.parent_question_id, undefined);
});

test('message feedback goes out with the question lineage', async () => {
  const { client, interactions } = createClient({ answers: answersWithSources });
  const { conversation } = client.workflows;

  conversation.load('t1');
  await tick();
  const message = conversation._getMessageWorkflow('q2');

  // the feedback layout submits into the workflow's feedback hub field
  message._hub.update('feedback', { value: 'helpful' });

  assert.is(interactions.length, 1);
  const interaction = interactions[0];
  assert.is(interaction.type, 'feedback');
  assert.is(interaction.value, 'helpful');
  assert.is(interaction.result_type, 'answer');
  const context = interaction.context.custom_context;
  assert.is(context.question_id, 'q2');
  assert.is(context.parent_question_id, 'q1');
  assert.is(context.root_question_id, 't1');
  assert.is(context.question_source, '_organic');
});

test('message workflows are destroyed when the panel leaves the thread', async () => {
  const { client } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  history.select('t1');
  await tick();
  const q1 = conversation._getMessageWorkflow('q1');
  const q2 = conversation._getMessageWorkflow('q2');

  history.select('t2'); // depart: the displayed thread's items are torn down
  assert.ok(q1.destroyed);
  assert.ok(q2.destroyed);
  assert.is(client.workflows.messageItems.getByQuestionId('q1'), undefined); // deregistered

  // a return recreates them afresh
  history.select('t1');
  await tick();
  const fresh = conversation._getMessageWorkflow('q1');
  assert.is.not(fresh, q1);
  assert.is(fresh.destroyed, false);
  assert.is(fresh.message.answer, 'Answer of q1');
});

test('destroying the conversation destroys its message workflows', async () => {
  const { client } = createClient();
  const { conversation } = client.workflows;

  conversation.load('t1');
  await tick();
  const q1 = conversation._getMessageWorkflow('q1');

  conversation.destroy();
  assert.ok(q1.destroyed);
  assert.is(client.workflows.messageItems.getByQuestionId('q1'), undefined);
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
  const workflow = conversation._getMessageWorkflow(live);
  assert.is(workflow.questionId, undefined);
  assert.is(workflow.message.question, 'What about miso ramen?');

  await tick(); // the response arrives

  // the same workflow adopted the question id and received the answer
  const settled = conversation.messages[conversation.messages.length - 1];
  assert.ok(settled.question_id);
  assert.is(conversation._getMessageWorkflow(settled), workflow);
  assert.is(client.workflows.messageItems.getByQuestionId(settled.question_id), workflow);
  assert.is(workflow.questionId, settled.question_id);
  assert.is(workflow.message.answer, 'Answer of What about miso ramen?');
});

test('a live message keeps its question through a stream of answer-only values', async () => {
  const { client } = createClient();
  // like the real api: the answer poll responses carry the answer content
  // only — the posted record has to supply the question and identity fields
  client.api.ask.questions = async () => ({
    _response: { question_id: 'q-live', answer: '', answer_stage: 'answer', finished: false, revision: 1 },
    async *[Symbol.asyncIterator]() {
      yield { question_id: 'q-live', answer: 'A bowl of', answer_stage: 'answer', finished: false, revision: 2 };
      yield { question_id: 'q-live', answer: 'A bowl of ramen.', answer_stage: 'answer', finished: true, revision: 3 };
    },
  });
  const { conversation } = client.workflows;

  conversation.load('t1');
  await tick();
  conversation.send('What about miso ramen?');

  const workflow = conversation._getMessageWorkflow(conversation.messages[conversation.messages.length - 1]);
  const commits = [];
  workflow._hub.on('data', data => commits.push(data));

  await tick();

  // every commit carries the record fields, streamed values included
  assert.ok(commits.length > 0);
  for (const { value } of commits) {
    assert.is(value.question, 'What about miso ramen?');
    assert.ok(value.placeholder_id);
    assert.is(value.live, true);
  }
  assert.is(workflow.message.answer, 'A bowl of ramen.');
  assert.is(workflow.message.finished, true);

  // and the fold back into the panel record kept them too
  const record = conversation.messages[conversation.messages.length - 1];
  assert.is(record.question, 'What about miso ramen?');
  assert.is(record.question_id, 'q-live');
  assert.is(record.answer, 'A bowl of ramen.');
});

// an endless answer stream: yields a chunk every few ms until aborted
const endlessQuestions = (counter) => async (payload, { signal } = {}) => ({
  _response: { question_id: 'q-live', question: payload.question, answer: '', finished: false, revision: 1 },
  async *[Symbol.asyncIterator]() {
    for (let revision = 2; ; revision++) {
      await tick(5);
      if (signal && signal.aborted) {
        return;
      }
      counter.polls++;
      yield { question_id: 'q-live', question: payload.question, answer: `chunk ${revision}`, finished: false, revision };
    }
  },
});

test('a live stream stops when the panel departs', async () => {
  const { client } = createClient();
  const counter = { polls: 0 };
  client.api.ask.questions = endlessQuestions(counter);
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  history.select('t1');
  await tick();
  conversation.send('What about miso ramen?');
  await tick(20);
  assert.ok(counter.polls > 0); // streaming

  const live = conversation.messages[conversation.messages.length - 1];
  const workflow = conversation._getMessageWorkflow(live);

  history.select('t2'); // depart: the follow-up's workflow is destroyed right away
  assert.ok(workflow.destroyed);
  assert.is(client.workflows.messageItems.get(live), undefined); // deregistered
  await tick(15); // an in-flight chunk may still land
  const at = counter.polls;
  await tick(40);
  assert.is(counter.polls, at);
});

test('a creating thread departs: the pending post settles as an expired response and resolves', async () => {
  const { client } = createClient();
  const counter = { polls: 0 };
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  client.api.ask.questions = async (payload, options) => {
    await gate; // the response holds until released: nothing resolved yet
    return endlessQuestions(counter)(payload, options);
  };
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  conversation.new();
  conversation.send('A brand new question');
  const placeholderId = history.threads.find(thread => thread.placeholder_id).placeholder_id;

  history.select('t1'); // depart before the thread id is known: destroyed like any item
  await tick();
  assert.ok(history.get(placeholderId)); // still a placeholder: the post is pending

  release();
  await tick(20);
  // the resolution landed on the listed side, and the workflow is destroyed
  const settled = history.get('q-live');
  assert.ok(settled);
  assert.is(settled.placeholder_id, undefined);
  assert.is(client.workflows.messageItems.getByQuestionId('q-live'), undefined); // deregistered
  const at = counter.polls;
  await tick(40);
  assert.is(counter.polls, at);
});

test('an answerless record presents as loading; an unfinished one as ongoing', async () => {
  const { client } = createClient();
  const { conversation } = client.workflows;

  const message = conversation._getMessageWorkflow('q9');

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
