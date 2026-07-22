import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { STATUS, BUS_EVENT, REQUEST_TYPE } from '../src/index.js';
import { createClient, tick, answersOf } from './dummy.js';

test('history: start() loads the thread list, idempotently', async () => {
  const { client, calls } = createClient();
  const { history } = client.workflows;

  history.start();
  await tick();
  assert.is(history.status, STATUS.READY);
  assert.equal(history.threads.map(t => t.thread_id), ['t1', 't2']);

  history.start(); // no second fetch
  await tick();
  assert.is(calls.filter(c => c === 'GET threads').length, 1);
});

test('history: refresh() reloads', async () => {
  const { client, calls } = createClient();
  const { history } = client.workflows;

  history.start();
  await tick();
  history.refresh();
  await tick();
  assert.is(calls.filter(c => c === 'GET threads').length, 2);
  assert.is(history.status, STATUS.READY);
});

test('select: thread workflow loads the thread and merges answers', async () => {
  const { client, calls } = createClient();
  const { history, thread } = client.workflows;

  history.start();
  await tick();
  history.select('t2');
  await tick();

  assert.is(history.selectedThreadId, 't2');
  assert.is(history.states.data.value.selectedThreadId, 't2'); // selection is stamped into data
  assert.is(thread.threadId, 't2');
  assert.is(thread.status, STATUS.READY);
  assert.is(thread.thread.title, 'Second thread');
  assert.equal(thread.messages, answersOf(['q1', 'q2']));
  assert.ok(calls.includes('GET threads/t2'));
  assert.ok(calls.includes('POST answers ["q1","q2"]'));
});

test('thread: data keeps the head request; answers request stays internal', async () => {
  const { client } = createClient();
  const { thread } = client.workflows;

  thread.load('t1');
  await tick();

  const { request } = thread.states.data;
  assert.is(request.name, 'threads/t1');
  assert.is(request.type, REQUEST_TYPE.THREAD);
});

test('select: an unread thread is marked as read once loaded', async () => {
  const { client, calls } = createClient();
  const { history, thread } = client.workflows;

  history.start();
  await tick();
  assert.is(history.getThread('t2').unread, true);

  history.select('t2');
  await tick();
  assert.is(history.getThread('t2').unread, false);
  assert.is(thread.thread.read, true); // patched over the bus
  assert.ok(calls.includes('POST threads/t2/read'));

  // an already-read thread is left alone
  history.select('t1');
  await tick();
  assert.not.ok(calls.includes('POST threads/t1/read'));
});

test('renameThread: patches both panels, keeping merged messages', async () => {
  const { client, calls } = createClient();
  const { history, thread } = client.workflows;

  history.start();
  await tick();
  history.select('t2');
  await tick();
  await history.renameThread('t2', 'Renamed');

  assert.ok(calls.includes('PUT threads/t2 {"title":"Renamed"}'));
  assert.is(history.getThread('t2').title, 'Renamed');
  assert.is(thread.thread.title, 'Renamed');
  assert.equal(thread.messages, answersOf(['q1', 'q2'])); // not reset by the patch
});

test('deleteThread: removes from the list and resets the open panel', async () => {
  const { client, calls } = createClient();
  const { history, thread } = client.workflows;

  history.start();
  await tick();
  history.select('t1');
  await tick();
  await history.deleteThread('t1');
  await tick();

  assert.ok(calls.includes('DELETE threads/t1'));
  assert.equal(history.threads.map(t => t.thread_id), ['t2']);
  assert.is(history.selectedThreadId, undefined);
  assert.is(thread.threadId, undefined);
  assert.is(thread.status, STATUS.INITIAL);
  assert.equal(thread.messages, []);
});

test('deleteThread: an unrelated thread leaves the open panel alone', async () => {
  const { client } = createClient();
  const { history, thread } = client.workflows;

  history.start();
  await tick();
  history.select('t2');
  await tick();
  await history.deleteThread('t1');
  await tick();

  assert.is(thread.threadId, 't2');
  assert.is(thread.status, STATUS.READY);
});

test('deleteAllThreads: clears the list and resets the panel', async () => {
  const { client, calls } = createClient();
  const { history, thread } = client.workflows;

  history.start();
  await tick();
  history.select('t2');
  await tick();
  await history.deleteAllThreads();
  await tick();

  assert.ok(calls.includes('POST threads/_delete_all'));
  assert.equal(history.threads, []);
  assert.is(thread.threadId, undefined);
});

test('thread: loading the current thread again is a no-op unless forced', async () => {
  const { client, calls } = createClient();
  const { thread } = client.workflows;
  const heads = () => calls.filter(c => c === 'GET threads/t1').length;

  thread.load('t1');
  await tick();
  assert.is(heads(), 1);

  thread.load('t1');
  await tick();
  assert.is(heads(), 1);

  thread.load('t1', { force: true });
  await tick();
  assert.is(heads(), 2);
});

test('thread: stale answers of an abandoned session are dropped', async () => {
  let releaseT1;
  const { client } = createClient({
    threadDetail: id => ({ thread_id: id, title: id, questions_ids: id === 't1' ? ['a1', 'a2'] : ['b1', 'b2'] }),
    answers: question_ids => question_ids[0] === 'a1'
      ? new Promise(resolve => { releaseT1 = () => resolve(answersOf(question_ids)); })
      : answersOf(question_ids),
  });
  const { thread } = client.workflows;

  thread.load('t1');
  await tick(); // head landed; answers request hangs
  thread.load('t2');
  await tick(); // t2 fully loaded
  releaseT1(); // t1 answers arrive too late
  await tick();

  assert.is(thread.threadId, 't2');
  assert.equal(thread.messages, answersOf(['b1', 'b2']));
});

test('useAnswers: overrides the answers api through the options cascade', async () => {
  const { client, calls } = createClient();
  const { thread } = client.workflows;

  thread.useAnswers({ api: { name: 'custom_answers', payload: { fl: ['title'] } } });
  thread.load('t1');
  await tick();

  const call = calls.find(c => c.startsWith('POST ask/custom_answers'));
  assert.ok(call);
  assert.ok(call.includes('"fl":["title"]'));
  assert.ok(call.includes('"question_ids":["q1","q2"]'));
  assert.equal(thread.messages, answersOf(['q1', 'q2']));
});

test('bus: events stay within their client', async () => {
  const a = createClient();
  const b = createClient();
  const historyA = a.client.workflows.history;
  const threadA = a.client.workflows.thread;
  const threadB = b.client.workflows.thread;

  historyA.start();
  await tick();
  historyA.select('t2');
  await tick();

  assert.is(threadA.threadId, 't2');
  assert.is(threadB.threadId, undefined);
});

test('bus: event sequence of a select round trip', async () => {
  const { client } = createClient();
  const { history, thread } = client.workflows; // eslint-disable-line no-unused-vars
  const events = [];
  client.workflows.events.on('*', (data, meta) => events.push(meta.name));

  history.start();
  await tick();
  history.select('t2');
  await tick();

  assert.equal(events, [
    BUS_EVENT.THREAD_SELECT,
    // mark-as-read is emitted synchronously inside the loaded emission (named
    // subscribers run before '*'), so the '*' observer sees it first
    BUS_EVENT.THREAD_UPDATED,
    BUS_EVENT.THREAD_LOADED,
  ]);
});

test.run();
