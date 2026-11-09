import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { STATUS, THREAD_GROUP, getViewThreadGroup, getThreadGroupKey, normalizeThreadGroupsValue } from '../src/index.js';
import { createClient, tick } from './dummy.js';

const ids = threads => threads.map(t => t.thread_id || t.placeholder_id);

const GROUPED_THREADS = [
  { thread_id: 't1', title: 'T1', favorite: true, updated_at: '2026-07-30T00:00:00' },
  { thread_id: 't2', title: 'T2', favorite: false, updated_at: '2026-07-29T00:00:00' },
  { thread_id: 't3', title: 'T3', favorite: true, updated_at: '2026-07-28T00:00:00' },
  { thread_id: 't4', title: 'T4', favorite: false, updated_at: '2026-07-27T00:00:00' },
  { thread_id: 't5', title: 'T5', favorite: false, updated_at: '2026-07-26T00:00:00' },
];

test('helpers: thread groups resolve from a view element, every thread by default', () => {
  const viewOf = group => ({ element: { getAttribute: () => group } });
  assert.is(getViewThreadGroup(viewOf('favorite')), THREAD_GROUP.FAVORITE);
  assert.is(getViewThreadGroup(viewOf('unfavorite')), THREAD_GROUP.UNFAVORITE);
  assert.is(getViewThreadGroup(viewOf(null)), THREAD_GROUP.ALL);
  assert.is(getViewThreadGroup(viewOf('bogus')), THREAD_GROUP.ALL);
  assert.is(getViewThreadGroup(undefined), THREAD_GROUP.ALL);
  assert.is(getThreadGroupKey(THREAD_GROUP.ALL), 'threads');
  assert.is(getThreadGroupKey(THREAD_GROUP.FAVORITE), 'favorite');
});

test('helpers: normalizeThreadGroupsValue', () => {
  const t = { thread_id: 't1' };
  // the grouped response of the initial load
  assert.equal(normalizeThreadGroupsValue({
    all: { threads: [t], has_more: true },
    favorite: [t],
    unfavorite: { threads: [], has_more: false },
  }), {
    threads: [t], favorite: [t], unfavorite: [],
    paging: { all: { has_more: true }, favorite: { has_more: undefined }, unfavorite: { has_more: false } },
  });
  // a single list response: every thread only
  assert.equal(normalizeThreadGroupsValue({ threads: [t], has_more: false }), {
    threads: [t], paging: { all: { has_more: false } },
  });
  // already normalized: left alone
  const normalized = { threads: [t], paging: {} };
  assert.is(normalizeThreadGroupsValue(normalized), normalized);
});

test('history: the initial load lists every group in one request', async () => {
  const { client, calls } = createClient({ threads: GROUPED_THREADS });
  const { history } = client.workflows;

  history.start();
  await tick();
  assert.is(history.status, STATUS.READY);
  assert.equal(calls.filter(c => c.startsWith('GET threads')), [
    'GET threads',
    'GET threads {"favorite":true}',
    'GET threads {"favorite":false}',
  ]);
  assert.equal(ids(history.threads), ['t1', 't2', 't3', 't4', 't5']);
  assert.equal(ids(history.getThreads('favorite')), ['t1', 't3']);
  assert.equal(ids(history.getThreads('unfavorite')), ['t2', 't4', 't5']);
  // one record object per thread, across the groups
  assert.is(history.getThreads('favorite')[0], history.threads[0]);
  assert.is(history.getThreads('unfavorite')[0], history.threads[1]);
  for (const group of ['all', 'favorite', 'unfavorite']) {
    assert.is(history.isExhausted(group), true);
  }
});

test('history: each group pages on its own', async () => {
  const { client, calls } = createClient({ threads: GROUPED_THREADS });
  const { history } = client.workflows;
  history.useApi('threads/list', { rows: 1 });

  history.start();
  await tick();
  assert.equal(ids(history.threads), ['t1']);
  assert.equal(ids(history.getThreads('favorite')), ['t1']);
  assert.equal(ids(history.getThreads('unfavorite')), ['t2']);
  assert.is(history.isExhausted('favorite'), false);

  // two groups' pages in flight at once: both land
  history._more('favorite');
  history._more('unfavorite');
  history._more('favorite'); // the same group's page is in flight already: ignored
  await tick();
  assert.equal(ids(history.getThreads('favorite')), ['t1', 't3']);
  assert.equal(ids(history.getThreads('unfavorite')), ['t2', 't4']);
  assert.equal(ids(history.threads), ['t1']); // untouched
  assert.ok(calls.includes('GET threads {"rows":1,"start":1,"favorite":true}'));
  assert.ok(calls.includes('GET threads {"rows":1,"start":1,"favorite":false}'));
  assert.is(calls.filter(c => c.includes('"favorite":true')).length, 2);
  assert.is(history.isExhausted('favorite'), true);
  assert.is(history.isExhausted('unfavorite'), false);
  assert.is(history.exhausted, false);

  // an exhausted group ignores further pages
  history._more('favorite');
  await tick();
  assert.is(calls.filter(c => c.includes('"favorite":true')).length, 2);

  // the default group is every thread
  history._more();
  await tick();
  assert.equal(ids(history.threads), ['t1', 't2']);
});

test('history: the more trigger carries the group', async () => {
  const { client } = createClient({ threads: GROUPED_THREADS });
  const { history } = client.workflows;
  history.useApi('threads/list', { rows: 1 });

  history.start();
  await tick();
  history._hub.trigger('more', { group: 'unfavorite' });
  await tick();
  assert.equal(ids(history.getThreads('unfavorite')), ['t2', 't4']);
  assert.equal(ids(history.getThreads('favorite')), ['t1']);
});

test('history: a failed group page parks that group only', async () => {
  const { client } = createClient({ threads: GROUPED_THREADS });
  const { history } = client.workflows;
  history.useApi('threads/list', { rows: 1 });

  history.start();
  await tick();
  const userHistory = client.api.ask.userHistory;
  userHistory.getThreads = async () => {
    throw new Error('boom');
  };
  history._more('favorite');
  await tick();
  assert.is(history.status, STATUS.READY);
  assert.is(history.isExhausted('favorite'), true);
  assert.is(history.isExhausted('unfavorite'), false);
  assert.is(history.exhausted, false);
});

test('history: a favorite moves the thread between the groups, and back on failure', async () => {
  const { client, failures } = createClient({ threads: GROUPED_THREADS });
  const { history } = client.workflows;

  history.start();
  await tick();
  history.favorite('t2', true);
  assert.equal(ids(history.getThreads('favorite')), ['t1', 't2', 't3']);
  assert.equal(ids(history.getThreads('unfavorite')), ['t4', 't5']);
  assert.is(history.get('t2').favorite, true);

  history.favorite('t1', false);
  assert.equal(ids(history.getThreads('favorite')), ['t2', 't3']);
  assert.equal(ids(history.getThreads('unfavorite')), ['t1', 't4', 't5']);
  await tick();

  // a failed favorite is taken back, its thread moving back
  failures.favoriteThread = new Error('boom');
  history.favorite('t4', true);
  assert.equal(ids(history.getThreads('favorite')), ['t2', 't3', 't4']);
  await tick();
  assert.equal(ids(history.getThreads('favorite')), ['t2', 't3']);
  assert.equal(ids(history.getThreads('unfavorite')), ['t1', 't4', 't5']);
  assert.is(history.get('t4').favorite, false);
});

test('history: a favorite past the loaded records of a group waits for its page', async () => {
  const { client } = createClient({ threads: GROUPED_THREADS });
  const { history } = client.workflows;
  history.useApi('threads/list', { rows: 2 });

  history.start();
  await tick();
  assert.equal(ids(history.getThreads('favorite')), ['t1', 't3']);
  assert.equal(ids(history.getThreads('unfavorite')), ['t2', 't4']);
  // the favorite group is fully loaded: t4 joins it
  history.favorite('t4', true);
  assert.equal(ids(history.getThreads('favorite')), ['t1', 't3', 't4']);
  assert.equal(ids(history.getThreads('unfavorite')), ['t2']);
  // the unfavorite group is not: t1 sorts within its loaded records, and joins
  history.favorite('t1', false);
  assert.equal(ids(history.getThreads('unfavorite')), ['t1', 't2']);
});

test('history: operations apply to every group listing the thread', async () => {
  const { client } = createClient({ threads: GROUPED_THREADS });
  const { history } = client.workflows;

  history.start();
  await tick();
  history.rename('t1', 'Renamed');
  assert.is(history.getThreads('favorite')[0].title, 'Renamed');
  assert.is(history.getThreads('favorite')[0], history.threads[0]);

  history.select('t3');
  assert.ok(history.getThreads('favorite').find(t => t.thread_id === 't3').selected);

  history.delete('t1');
  await tick();
  assert.equal(ids(history.threads), ['t2', 't3', 't4', 't5']);
  assert.equal(ids(history.getThreads('favorite')), ['t3']);

  history.deleteAll();
  await tick();
  assert.equal(history.threads, []);
  assert.equal(history.getThreads('favorite'), []);
  assert.equal(history.getThreads('unfavorite'), []);
});

test('history: a new thread is listed in every thread and unfavorite groups', async () => {
  const { client } = createClient({ threads: GROUPED_THREADS });
  const { history, conversation } = client.workflows;

  history.start();
  await tick();
  conversation.send('A brand new question');
  const [placeholder] = history.threads;
  assert.ok(placeholder.placeholder_id);
  assert.is(history.getThreads('unfavorite')[0], placeholder);
  assert.ok(!history.getThreads('favorite').includes(placeholder));

  await tick(30);
  assert.is(history.threads[0].thread_id, 'q-new-1');
  assert.is(history.getThreads('unfavorite')[0], history.threads[0]);
});

test('history: a local patch after a more page is kept', async () => {
  const { client } = createClient({ threads: GROUPED_THREADS });
  const { history } = client.workflows;
  history.useApi('threads/list', { rows: 2 });

  history.start();
  await tick();
  history._more();
  await tick();
  assert.equal(ids(history.threads), ['t1', 't2', 't3', 't4']);
  history.rename('t3', 'Renamed');
  assert.is(history.get('t3').title, 'Renamed');
  history.select('t4');
  assert.is(history.selectedId, 't4');
  assert.ok(history.get('t4').selected);
});

test.run();
