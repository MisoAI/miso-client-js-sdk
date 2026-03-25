import { resolvePresets } from './preset/index.js';
import Parser from './parser.js';
import Compiler from './compiler.js';
import { shim } from './trees.js';

export function transformSync(markdown, sources = [], options = {}) {
  [markdown, sources, options] = preprocess(markdown, sources, options);
  const parser = new Parser(options.parser || {});
  const tree = shim(parser.parseSync(markdown));
  return stringify(tree, options);
}

export async function transform(markdown, sources = [], options = {}) {
  [markdown, sources, options] = preprocess(markdown, sources, options);
  const parser = new Parser(options.parser || {});
  const tree = shim(await parser.parse(markdown));
  return stringify(tree, options);
}

function preprocess(markdown, sources = [], options = {}) {
  if (!Array.isArray(sources) && typeof sources === 'object' && sources !== null) {
    options = sources;
    sources = [];
  }
  const getSource = (index) => sources[index];
  options = resolvePresets({ ...options, getSource });
  const processMarkdown = options.processMarkdown || options.processValue;
  if (processMarkdown) {
    markdown = processMarkdown(markdown, { done: true });
  }
  return [markdown, sources, options];
}

function stringify(tree, options = {}) {
  const compiler = new Compiler(options.compiler || {});
  return compiler.stringify(tree.children);
}
