import { visit } from 'unist-util-visit';

export default function rehypeFollowUpLink() {
  return tree => {
    visit(tree, 'element', visitor);
  };
}

function visitor(node) {
  const { tagName, properties } = node;
  // need to be an anchor with href and have only one child
  if (tagName !== 'a' || !properties) {
    return;
  }
  const href = properties.href;
  if (!href || !href.startsWith('?q=')) {
    return;
  }
  try {
    const url = new URL(href, window.location.href);
    const q = url.searchParams.get('q');
    if (!q || url.hash !== '#follow-up') {
      return;
    }
    node.properties['data-role'] = 'follow-up-link';
    node.properties['data-q'] = q;
    (node.properties.className || (node.properties.className = [])).push('miso-follow-up-link');
    delete node.properties.href;
    delete node.properties.target;
    delete node.properties.rel;
  } catch (e) {
    console.error(e);
  }
}
