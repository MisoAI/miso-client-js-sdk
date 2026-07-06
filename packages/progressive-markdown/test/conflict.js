import { test } from 'uvu';
import * as assert from 'uvu/assert';
import remarkGfm from 'remark-gfm';
import rehypeMinifyWhitespace from 'rehype-minify-whitespace';

import { Query } from '../src/index.js';

const QUERY_OPTIONS = Object.freeze({
  parser: Object.freeze({
    remark: [remarkGfm],
    rehype: [rehypeMinifyWhitespace],
  }),
});

test('conflict: interior', () => {
  const query = new Query(QUERY_OPTIONS);

  const { conflict: c0 } = query.update('# Hello World');
  const { conflict: c1 } = query.update('# Herro');

  assert.is(c0, undefined);
  assert.ok(c1);
  assert.is(c1.type, 'interior');
  assert.is(c1.index, 2);
});

test('conflict: intermediate', () => {
  const query = new Query(QUERY_OPTIONS);

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
  const query = new Query(QUERY_OPTIONS);

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
  const query = new Query(QUERY_OPTIONS);

  const { conflict: c0 } = query.update('# Hello World\n\n## Subtitle');
  const { conflict: c1 } = query.update('# Hello World');

  assert.is(c0, undefined);
  assert.equal(c1, query.positionOf('Hello World'.length));
});

test('conflict: text extension at tail', () => {
  const query = new Query(QUERY_OPTIONS);

  const { conflict: c0 } = query.update('# Hello');
  const { conflict: c1 } = query.update('# Hello World');

  // divergence is after "Hello"; a cursor held at safeRightBound (4) stays below it
  assert.is(c0, undefined);
  assert.ok(c1);
  assert.is(c1.type, 'interior');
  assert.is(c1.index, 5);
});

test('conflict: single-character text extension', () => {
  const query = new Query(QUERY_OPTIONS);

  const { conflict: c0 } = query.update('# A');
  const { conflict: c1 } = query.update('# AB');

  assert.is(c0, undefined);
  assert.ok(c1);
  assert.is(c1.type, 'interior');
  assert.is(c1.index, 1);
});

test('conflict: text extension before other content', () => {
  const query = new Query(QUERY_OPTIONS);

  const { conflict: c0 } = query.update('# Hello\n\n## Sub');
  const { conflict: c1 } = query.update('# Hello World\n\n## Sub');

  assert.is(c0, undefined);
  assert.ok(c1);
  assert.is(c1.type, 'interior');
  assert.is(c1.index, 5);
});

test('conflict: text shrink on re-tokenization', () => {
  const query = new Query(QUERY_OPTIONS);

  // "abc*de" is a single literal text; the closing "*" re-tokenizes it into text + <em>
  const { conflict: c0 } = query.update('abc*de');
  const { conflict: c1 } = query.update('abc*de*');

  assert.is(c0, undefined);
  assert.ok(c1);
  assert.is(c1.type, 'intermediate');
  assert.is(c1.index, 3);
  assert.is(c1.left.type, 'text');
  assert.is(c1.right.tagName, 'em');
});

test('conflict: empty -> empty', () => {
  const query = new Query(QUERY_OPTIONS);

  const { conflict: c0 } = query.update('');
  const { conflict: c1 } = query.update('');

  assert.is(c0, undefined);
  assert.is(c1, undefined);
});

test('conflict: empty -> some', () => {
  const query = new Query(QUERY_OPTIONS);

  const { conflict: c0 } = query.update('');
  const { conflict: c1 } = query.update('# Hello World\n\n## Subtitle');

  assert.is(c0, undefined);
  assert.is(c1, undefined);
});

test('conflict: some -> empty', () => {
  const query = new Query(QUERY_OPTIONS);

  const { conflict: c0 } = query.update('# Hello World\n\n## Subtitle');
  const { conflict: c1 } = query.update('');

  assert.is(c0, undefined);
  assert.equal(c1, query.positionOf(0));
});

test.run();
