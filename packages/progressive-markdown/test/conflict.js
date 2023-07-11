import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { Query } from '../lib/index.js';

test('conflict: interior', () => {
  const query = new Query();

  const { conflict: c0 } = query.update('# Hello World');
  const { conflict: c1 } = query.update('# Herro');

  assert.is(c0, undefined);
  assert.ok(c1);
  assert.is(c1.type, 'interior');
  assert.is(c1.index, 2);
});

test('conflict: intermediate', () => {
  const query = new Query();

  const { conflict: c0 } = query.update('# Hello World\n\n## Subtitle');
  const { conflict: c1 } = query.update('# Hello World\n\n## Other subtitle');

  // diff happens inside the L2 heading, before the text node
  assert.is(c0, undefined);
  assert.ok(c1);
  assert.is(c1.type, 'intermediate');
  assert.is(c1.index, 11);
  assert.is(c1.left, undefined);
  assert.is(c1.right.type, 'text');
});

test('conflict: intermediate', () => {
  const query = new Query();

  const { conflict: c0 } = query.update('# Hello World\n\n## Subtitle');
  const { conflict: c1 } = query.update('# Hello World\n\n### Subtitle');

  // diff happens before the L2/L3 heading
  assert.is(c0, undefined);
  assert.ok(c1);
  assert.is(c1.type, 'intermediate');
  assert.is(c1.index, 11);
  assert.is(c1.left.tagName, 'h1');
});

test('conflict: intermediate', () => {
  const query = new Query();

  const { conflict: c0 } = query.update('# Hello World\n\n## Subtitle');
  const { conflict: c1 } = query.update('# Hello World');

  assert.is(c0, undefined);
  assert.equal(c1, query.positionOf('Hello World'.length));
});

test('conflict: empty -> empty', () => {
  const query = new Query();

  const { conflict: c0 } = query.update('');
  const { conflict: c1 } = query.update('');

  assert.is(c0, undefined);
  assert.is(c1, undefined);
});

test('conflict: empty -> some', () => {
  const query = new Query();

  const { conflict: c0 } = query.update('');
  const { conflict: c1 } = query.update('# Hello World\n\n## Subtitle');

  assert.is(c0, undefined);
  assert.is(c1, undefined);
});

test('conflict: some -> empty', () => {
  const query = new Query();

  const { conflict: c0 } = query.update('# Hello World\n\n## Subtitle');
  const { conflict: c1 } = query.update('');

  assert.is(c0, undefined);
  assert.equal(c1, query.positionOf(0));
});

test.run();
