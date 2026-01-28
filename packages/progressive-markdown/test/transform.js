import { test } from 'uvu';
import * as assert from 'uvu/assert';
import remarkGfm from 'remark-gfm';
import { Parser, Compiler, trees } from '../src/index.js';
import { defaultProcessMarkdown } from '../src/preset/helpers.js';

function transform(markdown, { processMarkdown, allowDangerousHtml = false } = {}) {
  const parser = new Parser({ remark: [remarkGfm], allowDangerousHtml });
  const compiler = new Compiler();
  if (processMarkdown) {
    markdown = processMarkdown(markdown);
  }
  const tree = trees.clean(trees.shim(parser.parseSync(markdown)));
  return compiler.stringify(tree);
}

// Without processMarkdown, tildes become strikethrough
test('transform: tildes become strikethrough without escaping', () => {
  const html = transform('Hello ~~world~~');
  assert.ok(html.includes('<del>'), 'expected <del> tag for strikethrough');
});

// With processMarkdown, tildes are escaped and won't become strikethrough
test('transform: tildes are escaped with processMarkdown', () => {
  const html = transform('Hello ~~world~~', { processMarkdown: defaultProcessMarkdown });
  assert.not.ok(html.includes('<del>'), 'expected no <del> tag when tildes are escaped');
  assert.ok(html.includes('~'), 'expected literal tilde in output');
});

// HTML <del> tags still work for strikethrough
test('transform: HTML del tag produces strikethrough', () => {
  const html = transform('Hello <del>world</del>', { processMarkdown: defaultProcessMarkdown, allowDangerousHtml: true });
  assert.ok(html.includes('<del>'), 'expected <del> tag from raw HTML');
});

test.run();
