import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { splitHtmlAtNthOfType } from '../src/html.js';

// Basic cases
test('splitHtmlAtNthOfType: index <= 0 returns empty before', () => {
  const html = '<p>hello</p><p>world</p>';
  assert.equal(splitHtmlAtNthOfType(html, 'p', 0), ['', html, 0]);
  assert.equal(splitHtmlAtNthOfType(html, 'p', -1), ['', html, 0]);
});

test('splitHtmlAtNthOfType: simple split at first p', () => {
  const html = '<p>hello</p><p>world</p>';
  const [before, after, count] = splitHtmlAtNthOfType(html, 'p', 1);
  assert.equal(before, '<p>hello</p>');
  assert.equal(after, '<p>world</p>');
  assert.equal(count, 1);
});

test('splitHtmlAtNthOfType: split at second p', () => {
  const html = '<p>hello</p><p>world</p>';
  const [before, after, count] = splitHtmlAtNthOfType(html, 'p', 2);
  assert.equal(before, '<p>hello</p><p>world</p>');
  assert.equal(after, '');
  assert.equal(count, 2);
});

test('splitHtmlAtNthOfType: index exceeds available tags', () => {
  const html = '<p>hello</p>';
  const [before, after, count] = splitHtmlAtNthOfType(html, 'p', 2);
  assert.equal(before, html);
  assert.equal(after, '');
  assert.equal(count, 1);
});

// Nested tags - only top-level should count
test('splitHtmlAtNthOfType: nested tags - p inside div', () => {
  const html = '<div><p>inside</p></div><p>outside</p>';
  const [before, after, count] = splitHtmlAtNthOfType(html, 'p', 1);
  // First top-level p is the one outside div
  assert.equal(before, '<div><p>inside</p></div><p>outside</p>');
  assert.equal(after, '');
  assert.equal(count, 1);
});

test('splitHtmlAtNthOfType: split at top-level div', () => {
  const html = '<div><p>inside</p></div><div>second</div>';
  const [before, after, count] = splitHtmlAtNthOfType(html, 'div', 1);
  assert.equal(before, '<div><p>inside</p></div>');
  assert.equal(after, '<div>second</div>');
  assert.equal(count, 1);
});

// Void elements should not affect depth
test('splitHtmlAtNthOfType: void elements do not affect depth', () => {
  const html = '<p>hello<br>world</p><p>next</p>';
  const [before, after, count] = splitHtmlAtNthOfType(html, 'p', 1);
  assert.equal(before, '<p>hello<br>world</p>');
  assert.equal(after, '<p>next</p>');
  assert.equal(count, 1);
});

test('splitHtmlAtNthOfType: multiple void elements', () => {
  const html = '<p>a<br><img src="x"><hr>b</p><p>c</p>';
  const [before, after, count] = splitHtmlAtNthOfType(html, 'p', 1);
  assert.equal(before, '<p>a<br><img src="x"><hr>b</p>');
  assert.equal(after, '<p>c</p>');
  assert.equal(count, 1);
});

// Target is a void element
test('splitHtmlAtNthOfType: target is void element br', () => {
  const html = '<p>hello<br>world</p><br><p>next</p>';
  const [before, after, count] = splitHtmlAtNthOfType(html, 'br', 1);
  // First top-level br is the one outside p
  assert.equal(before, '<p>hello<br>world</p><br>');
  assert.equal(after, '<p>next</p>');
  assert.equal(count, 1);
});

test('splitHtmlAtNthOfType: target void element inside other element not counted', () => {
  const html = '<div><br></div><br>';
  const [before, after, count] = splitHtmlAtNthOfType(html, 'br', 1);
  assert.equal(before, '<div><br></div><br>');
  assert.equal(after, '');
  assert.equal(count, 1);
});

// Case insensitivity
test('splitHtmlAtNthOfType: case insensitive tag matching', () => {
  const html = '<P>hello</P><p>world</p>';
  const [before, after, count] = splitHtmlAtNthOfType(html, 'p', 1);
  assert.equal(before, '<P>hello</P>');
  assert.equal(after, '<p>world</p>');
  assert.equal(count, 1);
});

test('splitHtmlAtNthOfType: case insensitive tag argument', () => {
  const html = '<p>hello</p><p>world</p>';
  const [before, after, count] = splitHtmlAtNthOfType(html, 'P', 1);
  assert.equal(before, '<p>hello</p>');
  assert.equal(after, '<p>world</p>');
  assert.equal(count, 1);
});

// Tags with attributes
test('splitHtmlAtNthOfType: tags with attributes', () => {
  const html = '<p class="first">hello</p><p id="second" data-x="y">world</p>';
  const [before, after, count] = splitHtmlAtNthOfType(html, 'p', 1);
  assert.equal(before, '<p class="first">hello</p>');
  assert.equal(after, '<p id="second" data-x="y">world</p>');
  assert.equal(count, 1);
});

// Empty html
test('splitHtmlAtNthOfType: empty html', () => {
  const [before, after, count] = splitHtmlAtNthOfType('', 'p', 1);
  assert.equal(before, '');
  assert.equal(after, '');
  assert.equal(count, 0);
});

// No matching tags
test('splitHtmlAtNthOfType: no matching tags', () => {
  const html = '<div>hello</div>';
  const [before, after, count] = splitHtmlAtNthOfType(html, 'p', 1);
  assert.equal(before, html);
  assert.equal(after, '');
  assert.equal(count, 0);
});

test.run();
