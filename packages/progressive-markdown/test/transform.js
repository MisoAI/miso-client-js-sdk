import { test } from 'uvu';
import * as assert from 'uvu/assert';
import remarkGfm from 'remark-gfm';
import { Parser, Compiler, trees } from '../src/index.js';
import { defaultProcessMarkdown } from '../src/preset/helpers.js';

function unescapeHtml(html) {
  return html
    .replace(/&#x3C;/g, '<')
    .replace(/&#x3E;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

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

// HTML tags inside code blocks should not be processed
test('transform: HTML tag in code block remains literal', () => {
  const html = transform('Use `<del>` for strikethrough', { allowDangerousHtml: true });
  assert.not.ok(html.includes('<del>'), 'expected no <del> tag inside code block');
  const codeContent = html.match(/<code>(.+?)<\/code>/)?.[1];
  assert.equal(unescapeHtml(codeContent), '<del>', 'expected literal <del> in code block');
});

test.run();
