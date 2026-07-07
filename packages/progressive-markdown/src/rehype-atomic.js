import { visit } from 'unist-util-visit';

// embedded content whose interior is not typewriter material: it should pop in
// whole rather than being revealed progressively
export const DEFAULT_ATOMIC_TAGS = Object.freeze([
  'svg',
  'math',
  'iframe',
  'video',
  'audio',
  'canvas',
  'object',
  'embed',
]);

export default function rehypeAtomic(tags = DEFAULT_ATOMIC_TAGS) {
  const tagSet = new Set(tags);
  return tree => {
    visit(tree, 'element', node => {
      if (tagSet.has(node.tagName)) {
        node._atomic = true;
      }
    });
  };
}
