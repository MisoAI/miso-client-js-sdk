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

test('conflict: growing autolink href', () => {
  const query = new Query(QUERY_OPTIONS);

  // the <a> href grows with the streaming URL; text-only progress would leave it stale
  const { conflict: c0 } = query.update('See https://mi');
  const { conflict: c1 } = query.update('See https://miso.ai');

  assert.is(c0, undefined);
  assert.ok(c1);
  assert.is(c1.type, 'intermediate');
  assert.is(c1.index, 4);
  assert.is(c1.right.tagName, 'a');
});

const RAW_QUERY_OPTIONS = Object.freeze({
  parser: Object.freeze({
    remark: [remarkGfm],
    rehype: [rehypeMinifyWhitespace],
    allowDangerousHtml: true,
  }),
});

function markAtomic(tagName) {
  return () => tree => {
    (function walk(node) {
      if (node.tagName === tagName) {
        node._atomic = true;
      }
      for (const child of node.children || []) {
        walk(child);
      }
    })(tree);
  };
}

test('conflict: childless element gains children', () => {
  const query = new Query(RAW_QUERY_OPTIONS);

  // a childless element's intrinsic unit aliases with its first child's unit
  const { conflict: c0 } = query.update('<svg viewBox="0 0 1 1"></svg>\n');
  const { conflict: c1 } = query.update('<svg viewBox="0 0 1 1"><path d="M0 0"/></svg>\n');

  assert.is(c0, undefined);
  assert.ok(c1);
  assert.is(c1.type, 'intermediate');
  assert.is(c1.index, 0);
  assert.is(c1.right.tagName, 'svg');
});

test('conflict: atomic node internal mutation', () => {
  const query = new Query({
    parser: {
      ...RAW_QUERY_OPTIONS.parser,
      rehype: [...RAW_QUERY_OPTIONS.parser.rehype, markAtomic('svg')],
    },
  });

  const { conflict: c0 } = query.update('<svg><path d="M0 0"/></svg>\n');
  const { conflict: c1 } = query.update('<svg><path d="M0 0 L1 1"/></svg>\n');
  const { conflict: c2 } = query.update('<svg><path d="M0 0 L1 1"/></svg>\n', { done: true });

  assert.is(c0, undefined);
  assert.ok(c1);
  assert.is(c1.type, 'intermediate');
  assert.is(c1.index, 0);
  assert.is(c2, undefined); // unchanged atomic subtree: no false positive
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
