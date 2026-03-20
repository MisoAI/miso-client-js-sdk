import { resolvePresets } from './preset/index.js';
import Parser from './parser.js';
import Compiler from './compiler.js';
import { shim } from './trees.js';

export function transformSync(markdown, sources = [], options = {}) {
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
  const parser = new Parser(options);
  const compiler = new Compiler(options);
  const tree = shim(parser.parseSync(markdown));
  return compiler.stringify(tree.children);
}
