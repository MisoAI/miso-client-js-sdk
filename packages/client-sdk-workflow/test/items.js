import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { mergeItems } from '../src/util/items.js';

const keyOf = item => item.id;
const compare = (a, b) => b.t - a.t; // latest first

const a = { id: 'a', t: 3 };
const b = { id: 'b', t: 2 };
const c = { id: 'c', t: 1 };

test('mergeItems: no change keeps the list identity', () => {
  const items = [a, b];
  assert.is(mergeItems(items, {}, { keyOf, compare }), items);
  assert.is(mergeItems(items, { upsert: [a] }, { keyOf, compare }), items);
  assert.is(mergeItems(items, { remove: ['x'] }, { keyOf, compare }), items);
});

test('mergeItems: an upsert replaces the listed record, the others keep their identity', () => {
  const a2 = { id: 'a', t: 3, title: 'A' };
  const merged = mergeItems([a, b], { upsert: [a2] }, { keyOf, compare });
  assert.equal(merged, [a2, b]);
  assert.is(merged[1], b);
});

test('mergeItems: an upsert reorders by compare', () => {
  const c2 = { id: 'c', t: 4 };
  assert.equal(mergeItems([a, b, c], { upsert: [c2] }, { keyOf, compare }), [c2, a, b]);
});

test('mergeItems: a new record joins in order', () => {
  const d = { id: 'd', t: 2.5 };
  assert.equal(mergeItems([a, b], { upsert: [d] }, { keyOf, compare }), [a, d, b]);
  // without compare, at the end
  assert.equal(mergeItems([a, b], { upsert: [d] }, { keyOf }), [a, b, d]);
});

test('mergeItems: a new record joins only within what is loaded', () => {
  const within = (item, listed) => compare(item, listed[listed.length - 1]) <= 0;
  assert.equal(mergeItems([a, b], { upsert: [c] }, { keyOf, compare, within }), [a, b]);
  const d = { id: 'd', t: 4 };
  assert.equal(mergeItems([a, b], { upsert: [d] }, { keyOf, compare, within }), [d, a, b]);
});

test('mergeItems: a record that no longer belongs leaves; one that does not belong never joins', () => {
  const belongs = item => !item.hidden;
  const b2 = { ...b, hidden: true };
  assert.equal(mergeItems([a, b], { upsert: [b2] }, { keyOf, compare, belongs }), [a]);
  assert.equal(mergeItems([a], { upsert: [b2] }, { keyOf, compare, belongs }), [a]);
});

test('mergeItems: remove takes records out by key', () => {
  assert.equal(mergeItems([a, b, c], { remove: ['a', 'c'] }, { keyOf, compare }), [b]);
});

test('mergeItems: rekey matches a listed record under its new key', () => {
  const p = { pid: 'p', t: 5 };
  const settled = { id: 'q', t: 5 };
  const keyOfEither = item => item.id || item.pid;
  const merged = mergeItems([p, a], { upsert: [settled], rekey: { p: 'q' } }, { keyOf: keyOfEither, compare });
  assert.equal(merged, [settled, a]);
});

test('mergeItems: merge combines the listed record with the new one', () => {
  const merge = (existing, item) => ({ ...existing, ...item });
  const merged = mergeItems([{ id: 'a', t: 3, x: 1 }], { upsert: [{ id: 'a', y: 2 }] }, { keyOf, merge });
  assert.equal(merged, [{ id: 'a', t: 3, x: 1, y: 2 }]);
});

test('mergeItems: records joining go to the start, in the order given', () => {
  const d = { id: 'd' };
  const e = { id: 'e' };
  assert.equal(mergeItems([a, b], { upsert: [d, e] }, { keyOf, position: 'start' }), [d, e, a, b]);
});

test('mergeItems: an update-only merge ignores records not listed', () => {
  const items = [a];
  assert.is(mergeItems(items, { upsert: [b] }, { keyOf, within: () => false }), items);
});

test('mergeItems: every listing of a duplicated key is updated', () => {
  const merge = (existing, item) => ({ ...existing, ...item });
  const merged = mergeItems([{ id: 'a', n: 1 }, { id: 'a', n: 2 }], { upsert: [{ id: 'a', x: true }] }, { keyOf, merge });
  assert.equal(merged, [{ id: 'a', n: 1, x: true }, { id: 'a', n: 2, x: true }]);
});

test.run();
