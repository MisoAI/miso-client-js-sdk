import { test } from 'uvu';
import * as assert from 'uvu/assert';
import remarkGfm from 'remark-gfm';
import { transformSync, presetMiso } from '../src/index.js';

function unescapeHtml(html) {
  return html
    .replace(/&#x3C;/g, '<')
    .replace(/&#x3E;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

const DEFAULT_MISO_OPTIONS = { presets: [presetMiso] };

// Without miso preset, tildes become strikethrough via GFM
test('transformSync: tildes become strikethrough without miso preset', () => {
  const html = transformSync('Hello ~~world~~', { parser: { remark: [remarkGfm] } });
  assert.ok(html.includes('<del>'), 'expected <del> tag for strikethrough');
});

// With miso preset, tildes are escaped and won't become strikethrough
test('transformSync: miso preset escapes tildes', () => {
  const html = transformSync('Hello ~~world~~', DEFAULT_MISO_OPTIONS);
  assert.not.ok(html.includes('<del>'), 'expected no <del> tag when tildes are escaped');
  assert.ok(html.includes('~'), 'expected literal tilde in output');
});

// HTML <del> tags still work with miso preset (allowDangerousHtml: true)
test('transformSync: miso preset allows HTML del tag', () => {
  const html = transformSync('Hello <del>world</del>', DEFAULT_MISO_OPTIONS);
  assert.ok(html.includes('<del>'), 'expected <del> tag from raw HTML');
});

// HTML tags inside code blocks should not be processed
test('transformSync: HTML tag in code block remains literal', () => {
  const html = transformSync('Use `<del>` for strikethrough', DEFAULT_MISO_OPTIONS);
  assert.not.ok(html.includes('<del>'), 'expected no <del> tag inside code block');
  const codeContent = html.match(/<code>(.+?)<\/code>/)?.[1];
  assert.equal(unescapeHtml(codeContent), '<del>', 'expected literal <del> in code block');
});

// trailing table row is kept when done
test('transformSync: miso preset renders all table rows when done', () => {
  const markdown = '| Col1 | Col2 |\n| --- | --- |\n| A | B |\n| C | D |';
  const html = transformSync(markdown, DEFAULT_MISO_OPTIONS);
  assert.ok(html.includes('<td>C</td>'), 'expected last table row to be present when done');
});

test.run();
