import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { Query, Position } from '../lib/index.js';

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

test.run();
