import { test } from 'uvu';
import * as assert from 'uvu/assert';

import rehypeMinifyWhitespace from 'rehype-minify-whitespace';

import { Query, Position, trees } from '../src/index.js';

const MINIFIED_QUERY_OPTIONS = Object.freeze({
  parser: Object.freeze({ rehype: [rehypeMinifyWhitespace] }),
});

test('query: empty', () => {
  const query = new Query();

  query.update('');

  assert.equal(query.tree.bounds, { left: 0, right: 0 });
  assert.equal(query.positionOf(0), Position.empty(query.tree));
});

test('query: simple', () => {
  const query = new Query();

  const TEXT = 'Hello World';
  query.update(`# ${TEXT}`);

  assert.equal(query.tree.bounds, { left: 0, right: TEXT.length });
  assert.equal(`${query.positionOf(0)}`, 'M0:0');
  assert.equal(`${query.positionOf(1)}`, 'I1:0/0+1');
});

test('search: boundary closure around a zero-width run, regardless of layout', () => {
  const text = value => ({ type: 'text', value });
  const el = (tagName, ...children) => ({ type: 'element', tagName, properties: {}, children });
  const root = (...children) => ({ type: 'root', children });
  const emptyFence = () => el('pre', el('code', text('')));

  // same boundary (index 4) around the same zero-width fence, three layouts
  const t1 = trees.shim(root(el('p', text('abcd')), emptyFence(), el('p', text('efghi'))));
  const t2 = trees.shim(root(el('h1', text('ab')), el('p', text('cd')), emptyFence(), el('p', text('efghi'))));
  const t3 = trees.shim(root(el('p', text('abcd')), emptyFence(), emptyFence(), el('p', text('efghi'))));

  for (const tree of [t1, t2, t3]) {
    // left closure (default, streaming): the run stays ahead of the position
    const leftClosed = trees.search(tree, 4);
    assert.is(leftClosed.type, 'intermediate');
    assert.is(leftClosed.left.tagName, 'p');
    assert.is(leftClosed.right.tagName, 'pre');

    // right closure (done): the run is behind the position
    const rightClosed = trees.search(tree, 4, { closure: 'right' });
    assert.is(rightClosed.type, 'intermediate');
    assert.is(rightClosed.left.tagName, 'pre');
    assert.is(rightClosed.right.tagName, 'p');
  }

  // the whole run sits on one side: first fence ahead, last fence behind
  assert.is(trees.search(t3, 4).right, t3.children[1]);
  assert.is(trees.search(t3, 4, { closure: 'right' }).left, t3.children[2]);
});

test('query: done frame renders a trailing zero-width tail', () => {
  const query = new Query(MINIFIED_QUERY_OPTIONS);

  query.update('hi');
  query.update('hi\n\n```\n', { done: true }); // fence is zero-width; rightBound stays 2

  assert.is(query.rightBound, 2);
  const operations = query.progress(2, 2).map(String);
  assert.ok(operations.some(op => op.includes('<pre><code></code></pre>')));

  // finalized: subsequent frames are no-ops
  assert.equal(query.progress(2, 2), []);
});

test('query: whole document zero-width at done', () => {
  const query = new Query();

  query.update('```\n', { done: true });

  assert.is(query.rightBound, 0);
  const operations = query.progress(0, 0).map(String);
  assert.ok(operations.some(op => op.includes('<pre><code></code></pre>')));
});

test('search: safe right bound holds off a trailing atomic node', () => {
  const text = value => ({ type: 'text', value });
  const el = (tagName, ...children) => ({ type: 'element', tagName, properties: {}, children });
  const atomic = (tagName, ...children) => ({ type: 'element', tagName, properties: {}, children, _atomic: true });
  const root = (...children) => ({ type: 'root', children });

  // trailing atomic at top level: hold at its left bound
  const t1 = trees.shim(root(el('p', text('abcd')), atomic('svg')));
  assert.is(t1.bounds.right, 5);
  assert.is(trees.safeRightBoundOf(t1), 4);

  // trailing atomic nested on the right spine
  const t2 = trees.shim(root(el('p', text('ab'), atomic('svg'))));
  assert.is(trees.safeRightBoundOf(t2), 2);

  // content after the atomic commits it: no hold
  const t3 = trees.shim(root(el('p', text('abcd')), atomic('svg'), el('p', text('x'))));
  assert.is(trees.safeRightBoundOf(t3), t3.bounds.right);
});

test('query: safe right bound of zero-size tree', () => {
  const query = new Query();

  // a just-opened code fence parses to pre > code > text(''): children present, zero content size
  query.update('```\n');

  assert.equal(query.tree.bounds, { left: 0, right: 0 });
  assert.is(query.safeRightBound, 0);
});

test.run();
