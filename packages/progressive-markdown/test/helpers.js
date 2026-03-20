import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { removeMarkdownIncompleteTableRow } from '../src/preset/helpers.js';

// removeMarkdownIncompleteTableRow

test('removeMarkdownIncompleteTableRow: no table', () => {
  assert.equal(removeMarkdownIncompleteTableRow('Hello World'), 'Hello World');
});

test('removeMarkdownIncompleteTableRow: trailing table row', () => {
  // Any trailing line starting with | is removed (could be incomplete during streaming)
  assert.equal(removeMarkdownIncompleteTableRow('| A | B |\n| C | D |'), '| A | B |\n');
});

test('removeMarkdownIncompleteTableRow: incomplete row', () => {
  assert.equal(removeMarkdownIncompleteTableRow('| A | B |\n| C'), '| A | B |\n');
});

test('removeMarkdownIncompleteTableRow: done=true keeps trailing table row', () => {
  assert.equal(removeMarkdownIncompleteTableRow('| A | B |\n| C | D |', { done: true }), '| A | B |\n| C | D |');
});

test('removeMarkdownIncompleteTableRow: done=true keeps incomplete row', () => {
  assert.equal(removeMarkdownIncompleteTableRow('| A | B |\n| C', { done: true }), '| A | B |\n| C');
});

test.run();
