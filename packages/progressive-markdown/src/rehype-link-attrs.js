import { visit } from 'unist-util-visit';

export default function rehypeLinkAttrs() {
  return tree => {
    visit(tree, 'element', visitor);
  };
}

function visitor(node) {
  const { tagName, properties } = node;
  // need to be an anchor with href and have only one child
  if (tagName !== 'a' || !properties || !properties.href) {
    return;
  }
  node.properties.target = '_blank';
  node.properties.rel = 'noopener';
}
