import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { transformSync, presetMiso, presetMisoSanitizeSchema } from '../src/index.js';

const DEFAULT_MISO_OPTIONS = { presets: [presetMiso] };

function render(markdown, options = {}) {
  return transformSync(markdown, { ...DEFAULT_MISO_OPTIONS, ...options });
}

// XSS vectors //
test('sanitize: strips javascript: URL from markdown link', () => {
  const html = render('[click](javascript:alert(1))');
  assert.not.ok(html.includes('javascript:'), html);
  assert.ok(html.includes('click'), html);
});

test('sanitize: strips javascript: URL from HTML link', () => {
  const html = render('<a href="JaVaScRiPt:alert(1)">click</a>');
  assert.not.ok(/javascript:/i.test(html), html);
});

test('sanitize: strips event handler attributes', () => {
  const html = render('<img src="https://example.com/a.png" onerror="alert(1)">');
  assert.not.ok(html.includes('onerror'), html);
  assert.ok(html.includes('src="https://example.com/a.png"'), html);
});

test('sanitize: strips script element with its content', () => {
  const html = render('text <script>alert(1)</script>');
  assert.not.ok(html.includes('script'), html);
  assert.not.ok(html.includes('alert'), html);
});

test('sanitize: strips style element with its content, and style attributes', () => {
  const html = render('<style>body { display: none }</style><span style="position:fixed">a</span>');
  assert.not.ok(html.includes('display'), html);
  assert.not.ok(html.includes('style'), html);
  assert.ok(html.includes('<span>a</span>'), html);
});

test('sanitize: strips class attributes from HTML', () => {
  const html = render('<span class="miso-citation-link">a</span>');
  assert.not.ok(html.includes('class'), html);
});

test('sanitize: strips iframe and video by default', () => {
  const html = render('<iframe src="https://example.com"></iframe><video src="https://example.com/a.mp4"></video>');
  assert.not.ok(html.includes('iframe'), html);
  assert.not.ok(html.includes('video'), html);
});

test('sanitize: clobber-prefixes ids', () => {
  const html = render('<span id="location">a</span>');
  assert.ok(html.includes('id="user-content-location"'), html);
});

// SVG & MathML //
test('sanitize: keeps presentational SVG, strips handlers and unsafe children', () => {
  const html = render('<svg viewBox="0 0 10 10" width="10"><circle cx="5" cy="5" r="4" fill="red" stroke-width="2" onclick="alert(1)"/><foreignObject><div>x</div></foreignObject><a href="javascript:alert(1)">y</a></svg>');
  assert.ok(html.includes('<svg viewBox="0 0 10 10" width="10">'), html);
  assert.ok(html.includes('<circle cx="5" cy="5" r="4" fill="red" stroke-width="2">'), html);
  assert.not.ok(html.includes('onclick'), html);
  assert.not.ok(html.includes('foreignObject'), html);
  assert.not.ok(html.includes('javascript:'), html);
});

test('sanitize: strips url() references in SVG paint', () => {
  const html = render('<svg><rect width="1" height="1" fill="url(https://example.com/x.svg#a)"/></svg>');
  assert.not.ok(html.includes('url('), html);
});

test('sanitize: keeps MathML', () => {
  const html = render('<math display="block"><mfrac><mi mathvariant="bold">x</mi><mn>2</mn></mfrac></math>');
  assert.ok(html.includes('<math display="block"><mfrac><mi mathvariant="bold">x</mi><mn>2</mn></mfrac></math>'), html);
});

// Miso features survive //
test('sanitize: keeps attributes added by miso plugins', () => {
  const html = render('<a href="https://example.com">[1]</a> and [link](https://example.com)');
  assert.ok(html.includes('class="miso-citation-link"'), html);
  assert.ok(html.includes('data-role="citation-link"'), html);
  assert.ok(html.includes('data-index="1"'), html);
  assert.ok(html.includes('target="_blank"'), html);
  assert.ok(html.includes('rel="noopener"'), html);
});

test('sanitize: keeps GFM tables and task lists', () => {
  const html = render('| a | b |\n| - | - |\n| 1 | 2 |\n\n- [x] done');
  assert.ok(html.includes('<table>'), html);
  assert.ok(html.includes('<td>1</td>'), html);
  assert.ok(html.includes('type="checkbox"'), html);
});

test('sanitize: footnote ids and links match', () => {
  const html = render('Footnote[^1]\n\n[^1]: note');
  assert.ok(html.includes('href="#user-content-fn-1"'), html);
  assert.ok(html.includes('id="user-content-fn-1"'), html);
  assert.ok(html.includes('href="#user-content-fnref-1"'), html);
  assert.ok(html.includes('id="user-content-fnref-1"'), html);
  assert.not.ok(html.includes('user-content-user-content-'), html);
});

// customization //
test('sanitize: false disables sanitization', () => {
  const html = render('<span class="foo" onclick="x()">a</span>', { sanitize: false });
  assert.ok(html.includes('class="foo"'), html);
  assert.ok(html.includes('onclick'), html);
});

test('sanitize: function extends the built-in schema', () => {
  const html = render('<iframe src="https://example.com/embed" onload="x()"></iframe><script>alert(1)</script>', {
    sanitize: schema => ({
      ...schema,
      tagNames: [...schema.tagNames, 'iframe'],
      attributes: { ...schema.attributes, iframe: ['src'] },
    }),
  });
  assert.ok(html.includes('<iframe src="https://example.com/embed"></iframe>'), html);
  assert.not.ok(html.includes('onload'), html);
  assert.not.ok(html.includes('script'), html);
});

test('sanitize: object replaces the schema', () => {
  const html = render('<b>a</b><i>b</i>', { sanitize: { tagNames: ['b'] } });
  assert.ok(html.includes('<b>a</b>'), html);
  assert.not.ok(html.includes('<i>'), html);
});

test('sanitize: invalid option throws', () => {
  assert.throws(() => render('a', { sanitize: 'yes' }));
  assert.throws(() => render('a', { sanitize: () => undefined }));
});

test('sanitize: built-in schema is immutable', () => {
  assert.ok(Object.isFrozen(presetMisoSanitizeSchema));
  assert.ok(Object.isFrozen(presetMisoSanitizeSchema.tagNames));
  assert.throws(() => presetMisoSanitizeSchema.tagNames.push('iframe'));
});

// citation link methods run after sanitization //
test('sanitize: citation setHref rejects unsafe protocols', () => {
  const errors = [];
  const error = console.error;
  console.error = e => errors.push(e);
  try {
    const html = render('<a href="https://example.com">[1]</a>', {
      onCitationLink: ({ setHref }) => setHref(' javascript:alert(1)'),
    });
    assert.not.ok(html.includes('javascript:'), html);
    assert.ok(html.includes('href="https://example.com"'), html);
    assert.equal(errors.length, 1);
  } finally {
    console.error = error;
  }
});

test('sanitize: citation setAttribute rejects unsafe href', () => {
  const errors = [];
  const error = console.error;
  console.error = e => errors.push(e);
  try {
    const html = render('<a href="https://example.com">[1]</a>', {
      onCitationLink: ({ setAttribute }) => setAttribute('href', 'data:text/html,x', { escapeValue: false }),
    });
    assert.not.ok(html.includes('data:'), html);
    assert.equal(errors.length, 1);
  } finally {
    console.error = error;
  }
});

test('sanitize: citation setHref accepts safe URLs', () => {
  const html = render('<a href="https://example.com">[1]</a>', {
    onCitationLink: ({ setHref }) => setHref(href => `${href}/?ref=miso`),
  });
  assert.ok(html.includes('href="https://example.com/?ref=miso"'), html);
});

test.run();
