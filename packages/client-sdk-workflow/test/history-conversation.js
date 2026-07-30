import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { STATUS, REQUEST_TYPE, getThreadId, getPlaceholderId, getThreadItemId } from '../src/index.js';
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

test('history: thread items fall back to question_id / time', async () => {
  const { client } = createClient({
    threads: [
      { question_id: 'q9', title: 'Question keyed', time: '2026-07-29T00:00:00' },
      { thread_id: 't1', question_id: 'q1', title: 'Thread keyed', time: '2026-07-30T00:00:00', updated_at: '2026-07-27T00:00:00' },
    ],
  });
  const { history } = client.workflows;

  history.start();
  await tick();
  // the canonical fields win where present, and are filled in where absent;
  // the fallback happens before the sort by latest activity
  assert.equal(history.threads.map(t => [t.thread_id, t.updated_at]), [
    ['q9', '2026-07-29T00:00:00'],
    ['t1', '2026-07-27T00:00:00'],
  ]);
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

test('select: conversation workflow loads the thread and merges answers', async () => {
  const { client, calls } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  history.select('t2');
  await tick();

  assert.is(history.selectedThreadId, 't2');
  assert.is(history.states.data.value.selectedThreadId, 't2'); // selection is stamped into data
  assert.is(conversation.threadId, 't2');
  assert.is(conversation.status, STATUS.READY);
  assert.is(conversation.thread.title, 'Second thread');
  assert.equal(conversation.messages, answersOf(['q1', 'q2']));
  assert.ok(calls.includes('GET threads/t2'));
  assert.ok(calls.some(c => c.startsWith('POST ask/answers') && c.includes('"question_ids":["q1","q2"]')));
});

test('conversation: data keeps the head request; answers request stays internal', async () => {
  const { client } = createClient();
  const { conversation } = client.workflows;

  conversation.load('t1');
  await tick();

  const { request } = conversation.states.data;
  assert.is(request.name, 'threads/t1');
  assert.is(request.type, REQUEST_TYPE.THREAD);
});

test('select: an unread thread is marked as read once loaded', async () => {
  const { client, calls } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  assert.is(history.getThread('t2').has_new, true);

  history.select('t2');
  await tick();
  assert.is(history.getThread('t2').has_new, false);
  assert.is(conversation.thread.has_new, false); // patched over the bus
  assert.ok(calls.includes('POST threads/t2/read'));

  // an already-read thread is left alone
  history.select('t1');
  await tick();
  assert.not.ok(calls.includes('POST threads/t1/read'));
});

test('renameThread: patches both panels, keeping merged messages', async () => {
  const { client, calls } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  history.select('t2');
  await tick();
  await history.renameThread('t2', 'Renamed');

  assert.ok(calls.includes('PUT threads/t2 {"title":"Renamed"}'));
  assert.is(history.getThread('t2').title, 'Renamed');
  assert.is(conversation.thread.title, 'Renamed');
  assert.equal(conversation.messages, answersOf(['q1', 'q2'])); // not reset by the patch
});

test('deleteThread: removes from the list and resets the open panel', async () => {
  const { client, calls } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  history.select('t1');
  await tick();
  await history.deleteThread('t1');
  await tick();

  assert.ok(calls.includes('DELETE threads/t1'));
  assert.equal(history.threads.map(t => t.thread_id), ['t2']);
  assert.is(history.selectedThreadId, undefined);
  assert.is(conversation.threadId, undefined);
  // back to a fresh new-thread state, not an empty panel
  assert.is(conversation.status, STATUS.READY);
  assert.is(conversation.thread.placeholder, true);
  assert.equal(conversation.messages, []);
});

test('deleteThread: an unrelated thread leaves the open panel alone', async () => {
  const { client } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  history.select('t2');
  await tick();
  await history.deleteThread('t1');
  await tick();

  assert.is(conversation.threadId, 't2');
  assert.is(conversation.status, STATUS.READY);
});

test('deleteAllThreads: clears the list and resets the panel', async () => {
  const { client, calls } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  history.select('t2');
  await tick();
  await history.deleteAllThreads();
  await tick();

  assert.ok(calls.includes('POST threads/_delete_all'));
  assert.equal(history.threads, []);
  assert.is(conversation.threadId, undefined);
});

test('conversation: loading the current thread again is a no-op unless forced', async () => {
  const { client, calls } = createClient();
  const { conversation } = client.workflows;
  const heads = () => calls.filter(c => c === 'GET threads/t1').length;

  conversation.load('t1');
  await tick();
  assert.is(heads(), 1);

  conversation.load('t1');
  await tick();
  assert.is(heads(), 1);

  conversation.load('t1', { force: true });
  await tick();
  assert.is(heads(), 2);
});

test('conversation: stale answers of an abandoned session are dropped', async () => {
  let releaseT1;
  const { client } = createClient({
    threadDetail: id => ({ thread_id: id, title: id, questions_ids: id === 't1' ? ['a1', 'a2'] : ['b1', 'b2'] }),
    answers: question_ids => question_ids[0] === 'a1'
      ? new Promise(resolve => { releaseT1 = () => resolve(answersOf(question_ids)); })
      : answersOf(question_ids),
  });
  const { conversation } = client.workflows;

  conversation.load('t1');
  await tick(); // head landed; answers request hangs
  conversation.load('t2');
  await tick(); // t2 fully loaded
  releaseT1(); // t1 answers arrive too late
  await tick();

  assert.is(conversation.threadId, 't2');
  assert.equal(conversation.messages, answersOf(['b1', 'b2']));
});

test('useAnswers: overrides the answers api through the options cascade', async () => {
  const { client, calls } = createClient();
  const { conversation } = client.workflows;

  conversation.useAnswers({ api: { name: 'custom_answers', payload: { fl: ['title'] } } });
  conversation.load('t1');
  await tick();

  const call = calls.find(c => c.startsWith('POST ask/custom_answers'));
  assert.ok(call);
  assert.ok(call.includes('"fl":["title"]'));
  assert.ok(call.includes('"question_ids":["q1","q2"]'));
  assert.equal(conversation.messages, answersOf(['q1', 'q2']));
});

test('conversation: starts in new-thread mode with a placeholder thread', async () => {
  const { client } = createClient();
  const { conversation } = client.workflows;

  assert.is(conversation.status, STATUS.READY);
  assert.is(conversation.thread.placeholder, true);
  assert.equal(conversation.messages, []);
  assert.is(conversation.threadId, undefined);
});

test('conversation: sending in new-thread mode creates and resolves the thread', async () => {
  const { client, calls } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  const before = history.threads.length;
  const apiCallsBefore = calls.length;

  conversation.send('A brand new question');
  // the placeholder thread is listed on top (newest first) and selected; it
  // has no thread id yet, so it is keyed by its placeholder id
  const listed = () => history.threads[0];
  assert.is(history.threads.length, before + 1);
  assert.is(listed().placeholder, true);
  assert.is(listed().title, 'A brand new question');
  assert.is(getThreadId(listed()), undefined);
  assert.ok(getPlaceholderId(listed()));
  assert.is(history.selectedThreadId, getThreadItemId(listed()));
  assert.is(conversation.threadId, undefined);
  assert.is(conversation.messages.length, 1);

  await tick(30); // response arrives; the placeholder settles

  // both workflows now carry the settled thread, keyed by the first question
  assert.is(conversation.thread.placeholder, undefined);
  assert.is(conversation.thread.placeholder_id, undefined);
  assert.is(conversation.thread.title, 'A brand new question');
  assert.is(conversation.threadId, 'q-new-1');
  assert.is(getThreadId(history.threads[0]), conversation.threadId);
  assert.is(history.selectedThreadId, conversation.threadId);
  assert.not.ok(history.threads.some(t => t.placeholder));

  // the root question was posted without a parent
  const rootCall = calls.find(c => c.startsWith('POST questions'));
  assert.not.ok(rootCall.includes('parent_question_id'));

  // the thread id comes from the question response, so the thread record is
  // fetched directly — no lookup of the created thread through the list
  assert.equal(calls.slice(apiCallsBefore), [rootCall, 'GET threads/q-new-1']);

  // a subsequent send is a follow-up to the same thread
  conversation.send('And a follow-up');
  await tick();
  assert.is(conversation.messages.length, 2);
  const followUpCall = calls.filter(c => c.startsWith('POST questions')).pop();
  assert.ok(followUpCall.includes('parent_question_id'));
});

test('a placeholder item is not addressed as a thread', async () => {
  const { client, calls } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  conversation.send('A brand new question'); // no tick: the thread is pending
  const placeholder = history.threads[0];
  const apiCallsBefore = calls.length;

  // the view actions read the thread id, which a placeholder has none of, so
  // neither reaches the API
  history._onViewThreadDelete({ value: placeholder });
  history._onViewThreadSelect({ value: placeholder });
  assert.equal(calls.slice(apiCallsBefore), []);

  // and selecting it explicitly does not load it as a thread either: the
  // placeholder id never addresses the API
  const placeholderId = getPlaceholderId(placeholder);
  history.select(placeholderId);
  await tick(30); // the pending question settles in the meantime
  assert.not.ok(calls.some(c => c.includes(placeholderId)));
  assert.is(conversation.threadId, 'q-new-1');
});

test('conversation: a created thread settles locally if its record cannot be fetched', async () => {
  const { client } = createClient({ threadDetailError: new Error('thread not found') });
  const { history, conversation } = client.workflows;
  const warn = console.warn;
  console.warn = () => {}; // the failed fetch warns

  try {
    history.start();
    await tick();
    conversation.send('A brand new question');
    await tick(30);

    // the id is settled by contract, so the local record stands in
    assert.is(conversation.threadId, 'q-new-1');
    assert.is(conversation.thread.placeholder, undefined);
    assert.is(conversation.thread.title, 'A brand new question');
    assert.is(getThreadId(history.threads[0]), 'q-new-1');
    assert.not.ok(history.threads.some(t => t.placeholder));
  } finally {
    console.warn = warn;
  }
});

test('history: startNew clears the selection and resets the conversation', async () => {
  const { client } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  history.select('t2');
  await tick();
  assert.is(conversation.threadId, 't2');

  history.startNew();
  assert.is(history.selectedThreadId, undefined);
  assert.is(conversation.threadId, undefined);
  assert.is(conversation.thread.placeholder, true);
  assert.equal(conversation.messages, []);
});

test('history: startNew with nothing selected leaves both panels alone', async () => {
  const { client } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  const { session } = conversation;
  const { thread } = conversation;
  const listData = history.states.data;

  history.startNew(); // nothing is selected, the panel is on a new thread
  assert.is(history.states.data, listData); // no selection to clear, no re-commit
  assert.is(conversation.session, session); // no new session, no re-render
  assert.is(conversation.thread, thread);
  assert.is(conversation.threadId, undefined);
  assert.equal(conversation.messages, []);

  // but a new thread with a question asked does reset
  conversation.send('A brand new question');
  history.startNew();
  assert.is.not(conversation.session, session);
  assert.is(conversation.thread.placeholder, true);
  assert.equal(conversation.messages, []);
});

test('conversation: unfinished answers are polled until finished', async () => {
  let answersCalls = 0;
  const { client } = createClient({
    answers: question_ids => {
      answersCalls++;
      const finished = answersCalls >= 3;
      return question_ids.map(question_id => ({
        question_id,
        question: `Question of ${question_id}`,
        answer: finished ? 'The full answer.' : 'The partial an',
        finished,
      }));
    },
  });
  const { conversation } = client.workflows;
  conversation.useAnswers({ pollingInterval: 10 });

  conversation.load('t1');
  await tick();
  // the first fetch came back unfinished
  assert.is(answersCalls, 1);
  assert.is(conversation.messages[0].finished, false);

  // polling continues by answer state, until finished
  await tick(80);
  assert.ok(answersCalls >= 3);
  assert.is(conversation.messages[0].finished, true);
  assert.is(conversation.messages[0].answer, 'The full answer.');
  const settled = answersCalls;

  // and stops once settled
  await tick(50);
  assert.is(answersCalls, settled);
});

test('conversation: send posts a follow-up and appends the message pair', async () => {
  const { client, calls } = createClient();
  const { conversation } = client.workflows;

  conversation.load('t1');
  await tick();
  assert.is(conversation.messages.length, 2);

  conversation.send('What about miso ramen?');
  await tick();

  assert.is(conversation.messages.length, 3);
  const last = conversation.messages[2];
  assert.is(last.question, 'What about miso ramen?');
  assert.is(last.answer, 'Answer of What about miso ramen?');
  assert.ok(last.question_id);

  // posted like the ask workflow, with the parent question id
  const call = calls.find(c => c.startsWith('POST questions'));
  assert.ok(call);
  assert.ok(call.includes('"parent_question_id":"q2"'));

  // the head request stays on the committed data
  assert.is(conversation.states.data.request.type, REQUEST_TYPE.THREAD);
});

test('bus: events stay within their client', async () => {
  const a = createClient();
  const b = createClient();
  const historyA = a.client.workflows.history;
  const conversationA = a.client.workflows.conversation;
  const conversationB = b.client.workflows.conversation;

  historyA.start();
  await tick();
  historyA.select('t2');
  await tick();

  assert.is(conversationA.threadId, 't2');
  assert.is(conversationB.threadId, undefined);
});

test('bus: event sequence of a select round trip', async () => {
  const { client } = createClient();
  const { history, conversation } = client.workflows; // eslint-disable-line no-unused-vars
  const { bus } = client.workflows;
  const events = [];
  for (const [workflow, event] of [['history', 'select'], ['conversation', 'load'], ['history', 'update']]) {
    bus.on(workflow, event, () => events.push(`${workflow}:${event}`));
  }

  history.start();
  await tick();
  history.select('t2');
  await tick();

  assert.equal(events, [
    'history:select',
    'conversation:load',
    // mark-as-read is triggered while handling the load event, but the
    // emitter queues nested emissions, so subscribers observe it after
    'history:update',
  ]);
});

test.run();
