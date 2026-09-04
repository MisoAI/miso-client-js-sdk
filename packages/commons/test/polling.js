import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { polling } from '../src/polling.js';

test('polling: an already-aborted signal yields an empty async iterable', async () => {
  const ac = new AbortController();
  ac.abort({ type: 'new-session' });

  const result = polling(() => { throw new Error('should not fetch'); }, { signal: ac.signal });
  // async-iterable (the data actor iterates it with for-await), and empty
  assert.type(result[Symbol.asyncIterator], 'function');
  const values = [];
  for await (const value of result) {
    values.push(value);
  }
  assert.equal(values, []);
});

test('polling: yields fetched values until finished', async () => {
  let count = 0;
  const result = polling(() => {
    count++;
    return [`value-${count}`, count >= 2];
  }, { interval: 5 });

  const values = [];
  for await (const value of result) {
    values.push(value);
  }
  assert.equal(values, ['value-1', 'value-2']);
});

test('polling: immediate fires the first fetch right away', async () => {
  let fetchedAt;
  const start = Date.now();
  const result = polling(() => {
    fetchedAt = fetchedAt === undefined ? Date.now() : fetchedAt;
    return ['value', true];
  }, { interval: 1000, immediate: true });

  const values = [];
  for await (const value of result) {
    values.push(value);
  }
  assert.equal(values, ['value']);
  assert.ok(fetchedAt - start < 1000); // not one interval in
});

test.run();
