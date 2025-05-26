import { visit } from 'unist-util-visit';
import { fromHtml } from 'hast-util-from-html';
import { removeItem, escapeHtml } from '@miso.ai/commons';

export default function rehypeCitationLink(handler) {
  return tree => {
    visit(tree, 'element', node => visitor(node, handler));
  };
}

function visitor(node, handler) {
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
  (node.properties.className || (node.properties.className = [])).push('miso-citation-link');

  // add other attributes
  node.properties['data-role'] = 'citation-link';
  node.properties['data-index'] = value;

  // remove original text node
  //child.value = '';
  node.children = [];

  // there might be tooltip DOM inside, but we want it to have size = 1
  node._atomic = true;

  // customize the node
  if (typeof handler === 'function') {
    try {
      const index = Number(value) - 1;
      handler(createMethods(node), index);
    } catch (e) {
      console.error(e);
    }
  }
}

function createMethods(node) {
  function addClass(className) {
    if (!className) {
      throw new Error(`Class name is blank.`);
    }
    const properties = node.properties || (node.properties = {});
    const classNames = properties.className || (properties.className = []);
    if (classNames.indexOf(className) === -1) {
      classNames.push(className);
    }
  }
  function removeClass(className) {
    if (!className) {
      throw new Error(`Class name is blank.`);
    }
    const { properties } = node;
    if (!properties) {
      return;
    }
    removeItem(properties.className, className);
  }
  function setAttribute(key, value, options) {
    const { skipEscape = false } = options || {};

    if (!key) {
      throw new Error(`Key is blank.`);
    }
    if (key === 'className') {
      return;
    }
    const properties = node.properties || (node.properties = {});
    properties[escapeHtml(key)] = skipEscape ? value : escapeHtml(value);
  }
  function removeAttribute(key) {
    if (!key) {
      throw new Error(`Key is blank.`);
    }
    if (key === 'className') {
      return;
    }
    const { properties } = node;
    if (!properties) {
      return;
    }
    delete properties[key];
  }
  function getOrCreateTooltipNode() {
    const children = node.children || (node.children = []);
    let tooltip = children[0];
    if (!tooltip) {
      tooltip = { type: 'element', tagName: 'span', properties: { className: ['miso-citation-tooltip'] }, children: [] };
      children.push(tooltip);
    }
    return tooltip;
  }
  function setTooltipHtml(html) {
    // TODO: onerror?
    const { children } = fromHtml(html, { fragment: true });
    const tooltip = getOrCreateTooltipNode();
    tooltip.children = children;
  }
  function setTooltipText(value) {
    setTooltipHtml(escapeHtml(value));
  }
  return Object.freeze({
    escapeHtml,
    addClass,
    removeClass,
    setAttribute,
    removeAttribute,
    setTooltipHtml,
    setTooltipText,
  });
}
