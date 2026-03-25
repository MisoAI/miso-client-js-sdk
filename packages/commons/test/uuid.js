import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { uuidv4 } from '../src/uuid.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

test('uuidv4: returns a string', () => {
  assert.type(uuidv4(), 'string');
});

test('uuidv4: matches UUID v4 format', () => {
  assert.match(uuidv4(), UUID_PATTERN);
});

test('uuidv4: returns unique values', () => {
  const a = uuidv4();
  const b = uuidv4();
  assert.not.equal(a, b);
});

test.run();
