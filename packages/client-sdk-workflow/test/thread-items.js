import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { STATUS, ROLE } from '../src/index.js';
import { createClient, tick } from './dummy.js';

/**
 * The thread item subworkflows behind <miso-thread> elements: created via
 * the history workflow (getThreadWorkflow), fed by it through updateData()
 * — they make no requests of their own.
 */

test('thread workflows receive records pushed from the history workflow', async () => {
  const { client, calls } = createClient();
  const { history } = client.workflows;

  // created before any data: seeded once the list loads
  const early = history.getThreadWorkflow('t1');
  assert.is(early.states.data.value, undefined);

  history.start();
  await tick();

  assert.is(early.status, STATUS.READY);
  assert.is(early.threadId, 't1');
  assert.is(early.thread.title, 'First thread');

  // created after the data landed: seeded with the record right away
  const apiCallsBefore = calls.length;
  const late = history.getThreadWorkflow('t2');
  assert.is(late.status, STATUS.READY);
  assert.is(late.thread.title, 'Second thread');

  // the context keeps one instance per thread id, and the thread workflows
  // make no api calls of their own (data actor off)
  assert.is(client.workflows.threads.getByThreadId('t1'), early);
  assert.is(calls.length, apiCallsBefore);
});

test('thread roles map into the record; view events mutate through the model', async () => {
  const { client, calls } = createClient();
  const { history } = client.workflows;
  const workflow = history.getThreadWorkflow('t2');
  const roles = workflow._roles.mappings;

  // the roles map into the thread record: the title text and the checkbox
  // state as dot-paths; rename and delete take the whole record, so their
  // button layouts can derive the dialog text and the disabled state
  assert.is(roles[ROLE.TITLE], 'title');
  const record = { thread_id: 't9', title: 'T' };
  assert.is(roles[ROLE.RENAME]({ value: record }), record);
  assert.is(roles[ROLE.DELETE]({ value: record }), record);
  assert.is(roles[ROLE.SUBSCRIPTION], 'subscribed');

  history.start();
  await tick();

  workflow._onViewRenameSubmit({ value: 'Renamed' });
  await tick();
  assert.ok(calls.includes('PUT threads/t2 {"title":"Renamed"}'));
  // the fact came back through the history feed
  assert.is(history.get('t2').title, 'Renamed');
  assert.is(workflow.thread.title, 'Renamed');

  workflow._onViewSubscriptionChange({ checked: false });
  await tick();
  assert.ok(calls.includes('POST threads/t2/unsubscribe'));
  assert.is(workflow.thread.subscribed, false);

  workflow._onViewSubscriptionChange({ checked: true });
  await tick();
  assert.ok(calls.includes('POST threads/t2/subscribe'));
  assert.is(workflow.thread.subscribed, true);

  workflow._onViewDeleteSubmit();
  await tick();
  assert.ok(calls.some(call => call.startsWith('POST threads/_delete')));
  assert.equal(history.threads.map(t => t.thread_id), ['t1']);
});

test('only the changed record propagates: unaffected items see no commit', async () => {
  const { client } = createClient();
  const { history } = client.workflows;
  const t1 = history.getThreadWorkflow('t1');
  const t2 = history.getThreadWorkflow('t2');

  history.start();
  await tick();

  const commits = { t1: 0, t2: 0 };
  t1._hub.on('data', () => commits.t1++);
  t2._hub.on('data', () => commits.t2++);

  // a rename touches the renamed record alone
  history.rename('t2', 'Renamed');
  await tick();
  assert.is(commits.t1, 0);
  assert.is(commits.t2, 1);

  // a selection change touches the records whose flag flips alone
  history.select('t1');
  assert.is(commits.t1, 1);
  assert.is(commits.t2, 1);
  history.select('t2');
  assert.is(commits.t1, 2);
  assert.is(commits.t2, 2);
});

test('a thread being created gets a workflow before its thread id, and adopts it', async () => {
  const { client, calls } = createClient();
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  conversation.new();
  conversation.send('A brand new question'); // no tick: the response is pending

  // the placeholder item is listed and selected, keyed by its placeholder id
  const placeholder = history.threads.find(thread => thread.placeholder_id);
  assert.ok(placeholder);

  // the workflow binds by the record — no thread id needed
  const workflow = history.getThreadWorkflow(placeholder);
  assert.is(workflow.threadId, undefined);
  assert.is(workflow.thread.placeholder_id, placeholder.placeholder_id);

  // a thread being created has no server identity to operate on
  const before = calls.length;
  workflow._onViewRenameSubmit({ value: 'Nope' });
  workflow._onViewDeleteSubmit();
  workflow._onViewSubscriptionChange({ checked: true });
  assert.is(calls.length, before);

  await tick(30); // the response arrives and the placeholder settles

  // the same workflow adopted the thread id and received the settled record
  const settled = history.get('q-new-1');
  assert.ok(settled);
  assert.is(settled.placeholder_id, undefined);
  assert.is(history.getThreadWorkflow(settled), workflow);
  assert.is(client.workflows.threads.getByThreadId('q-new-1'), workflow);
  assert.is(workflow.threadId, 'q-new-1');
  assert.is(workflow.thread.thread_id, 'q-new-1');
});

test('thread workflows work standalone, with no conversation panel constructed', async () => {
  const { client } = createClient();
  const { history } = client.workflows;

  history.start();
  await tick();
  const workflow = history.getThreadWorkflow('t1');
  assert.is(workflow.thread.title, 'First thread');
  assert.is(client.workflows._conversation, undefined); // the peer stays unconstructed
});

test.run();
