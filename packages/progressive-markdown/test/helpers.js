import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { removeMarkdownIncompleteTableRow, defaultProcessMarkdown } from '../src/preset/helpers.js';

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

// defaultProcessMarkdown

test('defaultProcessMarkdown: combines helpers', () => {
  const input = '| A |\n| B~C';
  const output = defaultProcessMarkdown(input);
  assert.equal(output, '| A |\n');
});

test.run();
