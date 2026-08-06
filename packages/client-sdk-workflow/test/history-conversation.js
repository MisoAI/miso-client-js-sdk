import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { STATUS, ROLE, REQUEST_TYPE, getThreadId, getPlaceholderId, isThreadUnread } from '../src/index.js';
import { createClient, tick, answersOf } from './dummy.js';

test('history: works standalone, with no conversation panel constructed', async () => {
  const { client } = createClient();
  const { history } = client.workflows; // client.workflows.conversation is never accessed

  history.start();
  await tick();
  history.select('t2');
  history.delete('t1');
  await tick();

  assert.is(history.selectedId, 't2');
  assert.equal(history.threads.map(t => t.thread_id), ['t2']);
  assert.is(history._conversation, undefined); // the subworkflow stays unconstructed
});

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

  assert.is(history.selectedId, 't2');
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
  assert.is(history.get('t2').has_new, true);

  history.select('t2');
  await tick();
  assert.is(history.get('t2').has_new, false);
  assert.is(conversation.thread.has_new, false); // patched by the history workflow
  assert.ok(calls.includes('POST threads/t2/read'));

  // an already-read thread is left alone
  history.select('t1');
  await tick();
  assert.not.ok(calls.includes('POST threads/t1/read'));
});

test('rename: patches both panels, keeping merged messages', async () => {
  const { client, calls } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  history.select('t2');
  await tick();
  history.rename('t2', 'Renamed');

  assert.ok(calls.includes('PUT threads/t2 {"title":"Renamed"}'));
  assert.is(history.get('t2').title, 'Renamed');
  assert.is(conversation.thread.title, 'Renamed');
  assert.equal(conversation.messages, answersOf(['q1', 'q2'])); // not reset by the patch
});

test('rename view event: renames the thread', async () => {
  const { client, calls } = createClient();
  const { history } = client.workflows;

  history.start();
  await tick();
  history._onViewThreadsRename({ value: history.get('t1'), title: 'Renamed' });
  await tick();

  assert.ok(calls.includes('PUT threads/t1 {"title":"Renamed"}'));
  assert.is(history.get('t1').title, 'Renamed');
});

test('subscribe/unsubscribe: patches the record and calls the api', async () => {
  const { client, calls } = createClient();
  const { history } = client.workflows;

  history.start();
  await tick();
  assert.is(history.get('t2').has_new, true);

  history.unsubscribe('t2');
  assert.ok(calls.includes('POST threads/t2/unsubscribe'));
  assert.is(history.get('t2').subscribed, false);
  // the unread fact is independent; the unread presentation derives from both
  assert.is(history.get('t2').has_new, true);
  assert.is(isThreadUnread(history.get('t2')), false);

  history.subscribe('t2');
  assert.ok(calls.includes('POST threads/t2/subscribe'));
  assert.is(history.get('t2').subscribed, true);
  assert.is(isThreadUnread(history.get('t2')), true);
});

test('conversation thread operations delegate to the history workflow', async () => {
  const { client, calls } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  history.select('t2');
  await tick();

  conversation.rename('Renamed');
  assert.ok(calls.includes('PUT threads/t2 {"title":"Renamed"}'));
  assert.is(history.get('t2').title, 'Renamed');
  assert.is(conversation.thread.title, 'Renamed');

  conversation.unsubscribe();
  assert.is(history.get('t2').subscribed, false);
  conversation.subscribe();
  assert.is(history.get('t2').subscribed, true);

  conversation.delete();
  assert.ok(calls.includes('POST threads/_delete {"thread_ids":["t2"]}'));
  assert.not.ok(history.get('t2'));
  assert.is(conversation.threadId, undefined); // the panel resets
  assert.is(conversation.thread.placeholder, true);
});

test('conversation: the subscription role maps the state and toggles it', async () => {
  const { client, calls } = createClient();
  const { history, conversation } = client.workflows;
  const roles = conversation._roles.mappings;
  const subscribed = () => roles[ROLE.SUBSCRIPTION](conversation.states.data);
  const title = () => roles[ROLE.TITLE](conversation.states.data);

  history.start();
  await tick();
  history.select('t2');
  await tick();

  // the header roles render right off the data
  assert.is(title(), 'Second thread');
  assert.is(subscribed(), true);

  // the checkbox reports the state it requests; the workflow acts on it
  conversation._onViewSubscriptionChange({ checked: false });
  await tick();
  assert.ok(calls.includes('POST threads/t2/unsubscribe'));
  assert.is(subscribed(), false);

  conversation._onViewSubscriptionChange({ checked: true });
  await tick();
  assert.ok(calls.includes('POST threads/t2/subscribe'));
  assert.is(subscribed(), true);
});

test('conversation: the subscription toggle is a no-op with no thread loaded', async () => {
  const { client, calls } = createClient();
  const { conversation } = client.workflows;
  const before = calls.length;

  // new-thread mode: nothing to subscribe to
  conversation._onViewSubscriptionChange({ checked: true });
  await tick();
  assert.equal(calls.slice(before), []);
});

test('conversation thread operations require a loaded thread', async () => {
  const { client } = createClient();
  const { conversation } = client.workflows;

  // new-thread mode: no server identity to operate on
  assert.throws(() => conversation.rename('Renamed'), /No thread is on display/);
  assert.throws(() => conversation.delete(), /No thread is on display/);
});

test('delete: removes from the list and resets the open panel', async () => {
  const { client, calls } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  history.select('t1');
  await tick();
  history.delete('t1'); // a single id works without an array
  await tick();

  assert.ok(calls.includes('POST threads/_delete {"thread_ids":["t1"]}'));
  assert.equal(history.threads.map(t => t.thread_id), ['t2']);
  assert.is(history.selectedId, undefined);
  assert.is(conversation.threadId, undefined);
  // back to a fresh new-thread state, not an empty panel
  assert.is(conversation.status, STATUS.READY);
  assert.is(conversation.thread.placeholder, true);
  assert.equal(conversation.messages, []);
});

test('delete: an unrelated thread leaves the open panel alone', async () => {
  const { client } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  history.select('t2');
  await tick();
  history.delete(['t1']);
  await tick();

  assert.is(conversation.threadId, 't2');
  assert.is(conversation.status, STATUS.READY);
});

test('deleteAll: clears the list and resets the panel', async () => {
  const { client, calls } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  history.select('t2');
  await tick();
  history.deleteAll();
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
  assert.is(history.selectedId, getPlaceholderId(listed()));
  assert.is(conversation.threadId, undefined);
  assert.is(conversation.messages.length, 1);

  await tick(30); // response arrives; the placeholder settles

  // both workflows now carry the settled thread, keyed by the first question
  assert.is(conversation.thread.placeholder, undefined);
  assert.is(conversation.thread.placeholder_id, undefined);
  assert.is(conversation.thread.title, 'A brand new question');
  assert.is(conversation.threadId, 'q-new-1');
  assert.is(getThreadId(history.threads[0]), conversation.threadId);
  assert.is(history.selectedId, conversation.threadId);
  assert.not.ok(history.threads.some(t => t.placeholder));

  // the root question was posted without a parent
  const rootCall = calls.find(c => c.startsWith('POST questions'));
  assert.not.ok(rootCall.includes('parent_question_id'));

  // the thread id comes from the question response, so the resolution needs
  // no server round trip at all: no lookup of the created thread, no reload,
  // no read call — the posting is the only api call, its answer streaming
  // into the panel
  assert.equal(calls.slice(apiCallsBefore), [rootCall]);

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
  // none reaches the API
  history._onViewThreadsDelete({ value: placeholder });
  history._onViewThreadsRename({ value: placeholder, title: 'Renamed' });
  history._onViewThreadsSelect({ value: placeholder });
  assert.equal(calls.slice(apiCallsBefore), []);

  // and selecting it explicitly does not load it as a thread either: the
  // placeholder id never addresses the API
  const placeholderId = getPlaceholderId(placeholder);
  history.select(placeholderId);
  await tick(30); // the pending question settles in the meantime
  assert.not.ok(calls.some(c => c.includes(placeholderId)));
  assert.is(conversation.threadId, 'q-new-1');
});

test('switching away mid-creation: the thread is scavenged from the expired response', async () => {
  const { client, calls } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  conversation.send('A brand new question');
  // switch away before the question response arrives; the response of the
  // expired session still resolves the placeholder item
  history.select('t1');
  await tick(30);

  assert.not.ok(history.threads.some(t => t.placeholder));
  assert.is(calls.filter(c => c === 'GET threads').length, 1); // no list reload
  const created = history.threads.find(t => getThreadId(t) === 'q-new-1');
  assert.is(created.title, 'A brand new question');
  assert.is(history.selectedId, 't1'); // the switch is respected
  assert.is(conversation.threadId, 't1');

  // ... so the user can switch (back) to the created thread
  history.select('q-new-1');
  await tick(30);
  assert.is(conversation.threadId, 'q-new-1');
  assert.is(conversation.messages.length, 1);
});

test('switching to new chat mid-creation: the thread is scavenged all the same', async () => {
  const { client } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  conversation.send('A brand new question');
  history._onViewNewThreadSubmit();
  await tick(30);

  assert.not.ok(history.threads.some(t => t.placeholder));
  assert.ok(history.threads.some(t => getThreadId(t) === 'q-new-1'));
  assert.is(history.selectedId, undefined);
  assert.is(conversation.thread.placeholder, true); // new-thread mode
  assert.equal(conversation.messages, []);

  // the scavenged thread is selectable
  history.select('q-new-1');
  await tick(30);
  assert.is(conversation.threadId, 'q-new-1');
});

test('switching away after resolution: the settled thread is left alone', async () => {
  const { client } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  conversation.send('A brand new question');
  await tick(); // the response arrives; the placeholder settles in-session
  assert.not.ok(history.threads.some(t => t.placeholder));
  assert.is(conversation.threadId, 'q-new-1');

  history.select('t1');
  await tick(30); // the rest of the posting stream expires without effect

  const created = history.threads.find(t => getThreadId(t) === 'q-new-1');
  assert.is(created.title, 'A brand new question');
  assert.is(history.selectedId, 't1'); // the switch is respected
  assert.is(conversation.threadId, 't1');
});

test('conversation: a created thread settles without any thread detail call', async () => {
  // resolving involves no server round trip: a failing thread-detail api
  // does not matter
  const { client, calls } = createClient({ threadDetailError: new Error('thread not found') });
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  conversation.send('A brand new question');
  await tick(30);

  // the id is settled by contract — the resolution does not wait on the server
  assert.is(conversation.threadId, 'q-new-1');
  assert.is(getThreadId(history.threads[0]), 'q-new-1');
  assert.is(history.threads[0].title, 'A brand new question');
  assert.not.ok(history.threads.some(t => t.placeholder));
  assert.is(conversation.status, STATUS.READY);
  assert.not.ok(calls.some(c => c.includes('threads/q-new-1')));
});

test('history: the new chat action clears the selection and resets the conversation', async () => {
  const { client } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  history.select('t2');
  await tick();
  assert.is(conversation.threadId, 't2');

  history._onViewNewThreadSubmit();
  assert.is(history.selectedId, undefined);
  assert.is(conversation.threadId, undefined);
  assert.is(conversation.thread.placeholder, true);
  assert.equal(conversation.messages, []);
});

test('history: the new chat action with nothing selected leaves both panels alone', async () => {
  const { client } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  const { session } = conversation;
  const { thread } = conversation;
  const listData = history.states.data;

  history._onViewNewThreadSubmit(); // nothing is selected, the panel is on a new thread
  assert.is(history.states.data, listData); // no selection to clear, no re-commit
  assert.is(conversation.session, session); // no new session, no re-render
  assert.is(conversation.thread, thread);
  assert.is(conversation.threadId, undefined);
  assert.equal(conversation.messages, []);

  // but a new thread with a question asked does reset
  conversation.send('A brand new question');
  history._onViewNewThreadSubmit();
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

test('workflow coordination stays within its client', async () => {
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

test.run();
