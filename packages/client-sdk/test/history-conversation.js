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

test('lorem: rename syncs the list and the open panel', async () => {
  const client = setup();
  await ask(client, 'What is miso soup?');

  const { history, conversation } = client.workflows;
  history.start();
  await tick();
  const threadId = history.threads[0].thread_id;
  history.select(threadId);
  await tick();
  history.rename(threadId, 'Soup talk');
  await tick();

  assert.is(history.get(threadId).title, 'Soup talk');
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
  history.delete(threadId);
  await tick();

  assert.is(history.threads.length, 1);
  assert.is(conversation.threadId, undefined);
  // back to a fresh new-thread state, not an empty panel
  assert.is(conversation.status, STATUS.READY);
  assert.is(conversation.thread.placeholder, true);
  assert.equal(conversation.messages, []);
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

  const unread = history.threads.filter(t => t.has_new);
  assert.ok(unread.length > 0, 'expect some generated threads to be unread');
  const threadId = unread[0].thread_id;

  history.select(threadId);
  await tick();
  assert.is(conversation.threadId, threadId);
  assert.ok(conversation.messages.length > 0);
  assert.is(history.get(threadId).has_new, false);
  // persisted on the (lorem) server
  history.refresh();
  await tick();
  assert.is(history.get(threadId).has_new, false);
});

test('lorem: a follow-up question posts and lands in the conversation', async () => {
  const client = setup();
  await ask(client, 'What is miso soup?');

  const { history, conversation } = client.workflows;
  history.start();
  await tick();
  history.select(history.threads[0].thread_id);
  await tick();
  const before = conversation.messages.length;

  conversation.send('Tell me more about dashi.');
  // the answer streams via polling (~1s interval); wait for it to finish
  const deadline = Date.now() + 10000;
  while (true) {
    const last = conversation.messages[conversation.messages.length - 1];
    if (conversation.messages.length === before + 1 && last.finished && last.answer) {
      break;
    }
    if (Date.now() > deadline) {
      throw new Error('timed out waiting for the follow-up answer');
    }
    await tick(100);
  }

  const last = conversation.messages[conversation.messages.length - 1];
  assert.ok(last.question.startsWith('Tell me more about dashi.'));
  assert.ok(last.question_id);
  assert.ok(last.live);
  assert.type(last.answer, 'string');
  assert.ok(last.answer.length > 0);
});

test('lorem: switching away mid-creation still resolves the new thread, without errors', async () => {
  const client = setup();
  await ask(client, 'What is miso soup?');

  const { history, conversation } = client.workflows;
  history.start();
  await tick();
  const existingId = history.threads[0].thread_id;

  // capture console errors: the aborted posting stream must fail silently
  const errors = [];
  const consoleError = console.error;
  console.error = (...args) => errors.push(args);
  try {
    // post the first question of a new thread, and switch away immediately
    conversation.send('A brand new question');
    history.select(existingId);

    // the created thread is scavenged from the expired response
    const deadline = Date.now() + 10000;
    const created = () => history.threads.find(t => t.thread_id && t.title === 'A brand new question');
    while (!created() || history.threads.some(t => t.placeholder)) {
      if (Date.now() > deadline) {
        throw new Error('timed out waiting for the created thread to resolve');
      }
      await tick(50);
    }
    assert.is(history.selectedId, existingId); // the switch is respected
    assert.is(conversation.threadId, existingId);
    assert.equal(errors, []);

    // ... and can be switched to
    history.select(created().thread_id);
    await tick();
    assert.is(conversation.threadId, created().thread_id);
    assert.ok(conversation.messages[0].question.startsWith('A brand new question'));
  } finally {
    console.error = consoleError;
  }
});

test('lorem: deleteAll clears the history', async () => {
  const client = setup();
  await ask(client, 'What is miso soup?');
  await ask(client, 'How to cook ramen?');

  const { history } = client.workflows;
  history.start();
  await tick();
  history.deleteAll();
  await tick();

  assert.equal(history.threads, []);
  history.refresh();
  await tick();
  assert.equal(history.threads, []);
});

test('lorem: update indicators and subscriptions over the v0 wire', async () => {
  const client = setup();
  const rootId = await ask(client, 'What is miso soup?');

  const { userHistory } = client.api.ask;
  assert.equal(await userHistory.getNotifications(), { has_new: false });

  // a fresh thread is not subscribed: server-side activity passes it by
  MisoClient.lorem.api.ask.userHistory.touchThread(rootId);
  assert.equal(await userHistory.getNotifications(), { has_new: false });

  // a subscribed thread receives updates, raising the account-level indicator
  await userHistory.subscribeThread(rootId);
  MisoClient.lorem.api.ask.userHistory.touchThread(rootId);
  assert.equal(await userHistory.getNotifications(), { has_new: true });

  await userHistory.dismissNotifications();
  assert.equal(await userHistory.getNotifications(), { has_new: false });

  // unsubscribing stops future updates, but an already raised indicator
  // stays until dismissed — subscribed and has_new are independent facts
  MisoClient.lorem.api.ask.userHistory.touchThread(rootId);
  assert.equal(await userHistory.getNotifications(), { has_new: true });
  await userHistory.unsubscribeThread(rootId);
  assert.equal(await userHistory.getNotifications(), { has_new: true });
  await userHistory.dismissNotifications();
  assert.equal(await userHistory.getNotifications(), { has_new: false });
});

test.run();
