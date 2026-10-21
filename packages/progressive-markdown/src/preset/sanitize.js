import { defaultSchema } from '../rehype-sanitize.js';

// https://github.com/syntax-tree/hast-util-sanitize#schema
// note: attribute names are hast property names (e.g. `strokeWidth`, not `stroke-width`)

const EXTRA_HTML_TAGS = ['abbr', 'caption', 'cite', 'col', 'colgroup', 'figcaption', 'figure', 'mark', 'small', 'u'];

// presentational SVG only: no scripting, no external/id references (<use>, <image>, <foreignObject>, <animate>, ...)
const SVG_TAGS = [
  'svg', 'g', 'path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect', 'text', 'tspan', 'title', 'desc',
];

// paint values must not reference other resources: ids are clobber-prefixed anyway, and external URLs leak requests
const NO_URL = /^(?!.*url\s*\()/i;

const SVG_ATTRIBUTES = [
  'viewBox', 'preserveAspectRatio', 'role', 'ariaLabel', 'ariaHidden',
  'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'dx', 'dy', 'd', 'points', 'transform',
  ['fill', NO_URL], 'fillOpacity', 'fillRule',
  ['stroke', NO_URL], 'strokeWidth', 'strokeOpacity', 'strokeLineCap', 'strokeLineJoin', 'strokeDashArray', 'strokeDashOffset',
  'opacity', 'textAnchor', 'dominantBaseline', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
];

// presentation MathML (no <maction>, no <annotation-xml> which can embed HTML)
const MATH_TAGS = [
  'math', 'semantics', 'annotation', 'mrow', 'mi', 'mn', 'mo', 'ms', 'mtext', 'mspace', 'mpadded', 'mphantom',
  'mstyle', 'menclose', 'msqrt', 'mroot', 'mfrac', 'msub', 'msup', 'msubsup', 'munder', 'mover', 'munderover',
  'mmultiscripts', 'mprescripts', 'none', 'mtable', 'mtr', 'mtd',
];

const MATH_ATTRIBUTES = [
  'display', 'displaystyle', 'scriptlevel', 'mathvariant', 'mathsize', 'dir',
  'form', 'fence', 'separator', 'stretchy', 'symmetric', 'largeop', 'movablelimits', 'accent', 'accentunder',
  'lspace', 'rspace', 'minsize', 'maxsize', 'linethickness', 'depth', 'voffset', 'notation',
  'columnalign', 'rowalign', 'columnspan', 'rowspan', 'encoding',
];

export const presetMisoSanitizeSchema = frozenCopy({
  ...defaultSchema,
  tagNames: [...defaultSchema.tagNames, ...EXTRA_HTML_TAGS, ...SVG_TAGS, ...MATH_TAGS],
  attributes: {
    ...defaultSchema.attributes,
    ...Object.fromEntries(SVG_TAGS.map(tag => [tag, SVG_ATTRIBUTES])),
    ...Object.fromEntries(MATH_TAGS.map(tag => [tag, MATH_ATTRIBUTES])),
  },
  // drop the content as well, rather than unwrapping it as text
  strip: [...defaultSchema.strip, 'style'],
});

/**
 * Resolve the `sanitize` option of presetMiso into a schema, or `false` to disable sanitization.
 * - `true` / `undefined`: presetMisoSanitizeSchema
 * - `false`: no sanitization
 * - object: the schema, as is
 * - function: called with presetMisoSanitizeSchema, returns the schema
 */
export function resolveSanitizeSchema(sanitize = true) {
  if (sanitize === true) {
    return presetMisoSanitizeSchema;
  }
  if (sanitize === false) {
    return false;
  }
  if (typeof sanitize === 'function') {
    const schema = sanitize(presetMisoSanitizeSchema);
    if (!schema || typeof schema !== 'object') {
      throw new TypeError(`sanitize function must return a schema object: ${schema}`);
    }
    return schema;
  }
  if (typeof sanitize === 'object' && sanitize !== null) {
    return sanitize;
  }
  throw new TypeError(`sanitize must be a boolean, a schema object, or a function: ${sanitize}`);
}

// copy before freezing: the spread above still shares nested objects with rehype-sanitize's defaultSchema
function frozenCopy(value) {
  if (!value || typeof value !== 'object' || value instanceof RegExp) {
    return value;
  }
  if (Array.isArray(value)) {
    return Object.freeze(value.map(frozenCopy));
  }
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([k, v]) => [k, frozenCopy(v)])));
}
