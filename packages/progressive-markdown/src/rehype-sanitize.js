import { visit } from 'unist-util-visit';
import rehypeSanitizeBase, { defaultSchema } from 'rehype-sanitize';

export { defaultSchema };

// https://github.com/syntax-tree/hast-util-sanitize#schema
export default function rehypeSanitize(schema = defaultSchema) {
  const sanitize = rehypeSanitizeBase(schema);
  return tree => {
    unclobber(tree, schema);
    return sanitize(tree);
  };
}

// remark-rehype already prefixes the ids it generates (e.g. GFM footnotes), and the sanitizer would prefix them
// again, breaking the in-page links pointing to them. Strip the prefix beforehand, so every value ends up prefixed
// exactly once.
function unclobber(tree, { clobber, clobberPrefix } = {}) {
  if (!clobber || !clobber.length || !clobberPrefix) {
    return;
  }
  const unprefix = value => typeof value === 'string' && value.startsWith(clobberPrefix) ? value.slice(clobberPrefix.length) : value;
  visit(tree, 'element', ({ properties }) => {
    if (!properties) {
      return;
    }
    for (const key of clobber) {
      const value = properties[key];
      if (value !== undefined) {
        properties[key] = Array.isArray(value) ? value.map(unprefix) : unprefix(value);
      }
    }
  });
}
