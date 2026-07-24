import { test } from 'uvu';
import * as assert from 'uvu/assert';

import MisoClient from '../src/detached/node.js';
import { LoremPlugin } from '@miso.ai/client-sdk-dev-tool';
import { STATUS } from '@miso.ai/client-sdk-workflow';

/**
 * History/thread workflows against the real MisoClient, with the std:lorem
 * plugin (doggoganger) as the API backend: questions asked through
 * `client.api.ask` populate the user history threads.
 */

const tick = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

let seed = 100;

function setup() {
  // a fresh lorem api per test; huge speed rate -> answers finish instantly
  MisoClient.plugins.use(LoremPlugin, { seed: seed++, speedRate: 1e9 });
  return new MisoClient();
}

async function ask(client, question, parent_question_id = undefined) {
  const answer = await client.api.ask.questions({ question, ...(parent_question_id ? { parent_question_id } : {}) });
  return answer.questionId;
}

test('lorem: asked questions form history threads', async () => {
  const client = setup();
  await ask(client, 'What is miso soup?');
  await ask(client, 'How to cook ramen?');

  const { history } = client.workflows;
  history.start();
  await tick();

  assert.is(history.status, STATUS.READY);
  assert.is(history.threads.length, 2);
  assert.equal(
    history.threads.map(t => t.title).sort(),
    ['How to cook ramen?', 'What is miso soup?'],
  );
});

test('lorem: a follow-up question joins its parent thread', async () => {
  const client = setup();
  const rootId = await ask(client, 'What is miso soup?');
  const followUpId = await ask(client, 'Tell me more.', rootId);

  const { history } = client.workflows;
  history.start();
  await tick();

  assert.is(history.threads.length, 1);
  const threadId = history.threads[0].thread_id;
  assert.type(threadId, 'string');
  assert.ok(rootId !== followUpId);
});

test('lorem: select loads the conversation with answer contents', async () => {
  const client = setup();
  const rootId = await ask(client, 'What is miso soup?');
  const followUpId = await ask(client, 'Tell me more.', rootId);

  const { history, conversation } = client.workflows;
  history.start();
  await tick();
  history.select(history.threads[0].thread_id);
  await tick();

  assert.is(conversation.status, STATUS.READY);
  assert.is(conversation.thread.title, 'What is miso soup?');
  assert.equal(conversation.messages.map(m => m.question_id), [rootId, followUpId]);
  for (const message of conversation.messages) {
    assert.type(message.answer, 'string');
    assert.ok(message.answer.length > 0);
    assert.ok(message.finished);
  }
});

test('lorem: renameThread syncs the list and the open panel', async () => {
  const client = setup();
  await ask(client, 'What is miso soup?');

  const { history, conversation } = client.workflows;
  history.start();
  await tick();
  const threadId = history.threads[0].thread_id;
  history.select(threadId);
  await tick();
  await history.renameThread(threadId, 'Soup talk');
  await tick();

  assert.is(history.getThread(threadId).title, 'Soup talk');
  assert.is(conversation.thread.title, 'Soup talk');
  // the rename is persisted on the (lorem) server
  history.refresh();
  await tick();
  assert.is(history.threads[0].title, 'Soup talk');
});

test('lorem: deleting the open thread resets the panel', async () => {
  const client = setup();
  await ask(client, 'What is miso soup?');
  await ask(client, 'How to cook ramen?');

  const { history, conversation } = client.workflows;
  history.start();
  await tick();
  const threadId = history.threads[0].thread_id;
  history.select(threadId);
  await tick();
  await history.deleteThread(threadId);
  await tick();

  assert.is(history.threads.length, 1);
  assert.is(conversation.threadId, undefined);
  assert.is(conversation.status, STATUS.INITIAL);
  // the deletion is persisted on the (lorem) server
  history.refresh();
  await tick();
  assert.is(history.threads.length, 1);
});

test('lorem: opening an unread thread marks it as read', async () => {
  const client = setup();
  // server-side threads with activity the user has not seen yet
  MisoClient.lorem.api.ask.userHistory.generateThreads({ rows: 8 }, { seed: 11 });

  const { history, conversation } = client.workflows;
  history.start();
  await tick();

  const unread = history.threads.filter(t => t.unread);
  assert.ok(unread.length > 0, 'expect some generated threads to be unread');
  const threadId = unread[0].thread_id;

  history.select(threadId);
  await tick();
  assert.is(conversation.threadId, threadId);
  assert.ok(conversation.messages.length > 0);
  assert.is(history.getThread(threadId).unread, false);
  // persisted on the (lorem) server
  history.refresh();
  await tick();
  assert.is(history.getThread(threadId).unread, false);
});

test('lorem: deleteAllThreads clears the history', async () => {
  const client = setup();
  await ask(client, 'What is miso soup?');
  await ask(client, 'How to cook ramen?');

  const { history } = client.workflows;
  history.start();
  await tick();
  await history.deleteAllThreads();
  await tick();

  assert.equal(history.threads, []);
  history.refresh();
  await tick();
  assert.equal(history.threads, []);
});

test.run();
