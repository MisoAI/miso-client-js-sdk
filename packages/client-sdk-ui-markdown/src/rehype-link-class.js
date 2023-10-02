import { visit } from 'unist-util-visit';
import { dingbatChar } from '@miso.ai/commons';

export default function rehypeLinkClass(options = {}) {
  // TODO: may need to offer some options like rel, className, etc.
  return tree => {
    visit(tree, 'element', visitor);
  };
}

function visitor(node) {
  const { tagName, properties, children } = node;
  // need to be an anchor with href and have only one child
  if (tagName !== 'a' || !properties || !properties.href || !children || children.length !== 1) {
    return;
  }

  const child = children[0];
  let { type, value } = child;
  // need to be a text node with value like '[123]'
  if (type !== 'text' || !value.match(/^\[\d+\]$/)) {
    return;
  }
  value = value.slice(1, -1);

  // add CSS class name
  (node.properties.className || (node.properties.className = [])).push('citition-link');

  // add other attributes
  node.properties['data-role'] = 'citation-link';
  node.properties['data-index'] = value;
  try {
    const index = parseInt(value);
    if (index >= 0 && index < 10) {
      node.properties['data-char'] = dingbatChar(index);
      node.properties['data-char-negative'] = dingbatChar(index, true);
    }
  } catch (e) {}
  node.properties.target = '_blank';
  node.properties.rel = 'noopener';

  // remove square brackets from the text
  child.value = '';
}
