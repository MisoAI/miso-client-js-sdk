import { Position } from './model/index.js';

export function shim(tree, options) {
  link(tree);
  patchBounds(tree, options);
  return tree;
}

function link(tree) {
  Array.isArray(tree) ?
    linkNodes(tree, { depth: 1 }) :
    linkNode(tree, { depth: 0, childIndex: 0 });
}

function linkNode(node, { parent, previousSibling, depth, childIndex } = {}) {
  if (!node) {
    return;
  }
  node.depth = depth;
  node.childIndex = childIndex;
  node.parent = node.parent || parent;
  if (previousSibling) {
    node.previousSibling = previousSibling;
    previousSibling.nextSibling = node;
  }
  node.children = node.children || [];
  linkNodes(node.children, { parent: node, depth: depth + 1 });
}

function linkNodes(nodes, { parent, depth }) {
  if (!nodes || nodes.length === 0) {
    return;
  }
  parent.firstChild = nodes[0];
  parent.lastChild = nodes[nodes.length - 1];

  let previousSibling;
  let childIndex = 0;
  for (const node of nodes) {
    linkNode(node, { parent, previousSibling, depth, childIndex });
    previousSibling = node;
    childIndex++;
  }
}

export function unlink(tree) {
  return (Array.isArray(tree) ? unlinkNodes : unlinkNode)(tree);
}

function unlinkNode({ parent, previousSibling, nextSibling, firstChild, lastChild, children, ...node }) {
  if (children) {
    node.children = unlinkNodes(children);
  }
  return node;
}

function unlinkNodes(nodes) {
  return nodes.map(unlinkNode);
}

function patchBounds(tree, { size = sizeOf } = {}) {
  (Array.isArray(tree) ? patchNodesBounds : patchNodeBounds)(tree, { size });
}

function patchNodeBounds(node, options) {
  // DFS through the tree and determine by size function
  const { parent, previousSibling, lastChild } = node;
  const left = previousSibling ? previousSibling.bounds.right : parent ? parent.bounds.left : 0;
  node.bounds = { left };
  if (!node._atomic) {
    patchNodesBounds(node.children, options);
  }
  node.bounds.right = !node._atomic && lastChild ? lastChild.bounds.right : left + options.size(node);
}

function patchNodesBounds(nodes, options) {
  for (const node of nodes) {
    patchNodeBounds(node, options);
  }
}

function sizeOf(node) {
  switch (node.type) {
    case 'root':
      return 0;
    case 'text':
      return node.value.length;
  }
  return 1;
}

export function clean(tree) {
  tree = unlink(tree);
  tree = (Array.isArray(tree) ? cleanNodes : cleanNode)(tree);
  return tree;
}

function cleanNode({ position, children = [], ...node }) {
  return {
    ...node,
    children: cleanNodes(children),
  };
}

function cleanNodes(nodes) {
  return nodes.map(cleanNode);
}

export function search(tree, index) {
  const isArray = Array.isArray(tree);

  const leftBound = (isArray ? tree[0] : tree).bounds.left;
  const rightBound = (isArray ? tree[tree.length - 1] : tree).bounds.right;
  if (index < leftBound || index > rightBound) {
    throw new Error(`Index ${index} is out of bounds [${leftBound}, ${rightBound}]`);
  }

  return (isArray ? searchNodes : searchNode)(tree, index);
}

function searchNode(node, index) {
  if (!node) {
    return undefined;
  }
  const { children } = node;
  return children && children.length > 0 && !node._atomic ? searchNodes(children, index) :
    node.type === 'text' ? Position.interior(index, node) :
    node.type === 'root' ? Position.empty(node) :
    Position.intermediate(index, node.previousSibling, node);
}

function searchNodes(nodes, index) {
  const len = nodes.length;
  let left = 0, right = len - 1;
  while (left < right) {
    const mid = (left + right) >> 1;
    const n = nodes[mid];
    const diff = index - n.bounds.right;
    if (diff === 0) {
      return Position.intermediate(index, n, n.nextSibling);
    } else if (diff < 0) {
      right = mid;
    } else {
      left = mid + 1;
    }
  }
  const node = nodes[left];
  if (left === 0 && index === node.bounds.left) {
    return Position.intermediate(index, undefined, node);
  }
  if (left === len - 1 && index === node.bounds.right) {
    return Position.intermediate(index, node, undefined);
  }
  return searchNode(node, index);
}

export function commonAncestor(a, b) {
  if (a === b) {
    return a;
  }
  const aDepth = a.depth;
  const bDepth = b.depth;
  if (aDepth > bDepth) {
    a = walkUpTo(a, bDepth);
  } else if (bDepth > aDepth) {
    b = walkUpTo(b, aDepth);
  }
  while (a !== b) {
    a = a.parent;
    b = b.parent;
  }
  return a;
}

export function walkUpTo(node, depth) {
  while (node.depth > depth) {
    node = node.parent;
  }
  return node;
}

export function childIndicesOf(base, target) {
  const indices = [];
  for (let n = target; n !== base; n = n.parent) {
    indices.push(n.childIndex);
  }
  return indices.reverse();
}

export function safeRightBoundOf(tree) {
  const { children } = tree;
  if (children.length === 0) {
    return 0;
  }
  //const lastChild = tree.lastChild;

  // optimize:
  //   assume title won't be longer than 50 characters, 
  //   so last child <p> is considered safe except for last char when content length > 50
  // TODO

  // fallback to ultimately safe option
  // TODO: confirm this

  // aggressive
  // clamp: the tree may have children yet zero content size, e.g. '```\n' -> pre > code > text('')
  return Math.max(0, tree.bounds.right - 1);
}

export function findConflict(prev, next) {
  if (next.source.startsWith(prev.source)) {
    // optimize:
    //   assume identical until safe right bound of prev tree
    // TODO
  }
  const prevChildren = prev.tree.children;
  const nextChildren = next.tree.children;

  if (prevChildren.length === 0) {
    return undefined;
  }
  if (nextChildren.length === 0) {
    return Position.empty(next.tree);
  }
  return findConflictInNodes(prevChildren, nextChildren);
}

function findConflictInNodes(prevNodes, nextNodes) {
  const len = Math.min(prevNodes.length, nextNodes.length);
  for (let i = 0, position; i < len; i++) {
    position = findConflictInNode(prevNodes[i], nextNodes[i]);
    if (position !== undefined) {
      return position;
    }
  }
  if (prevNodes.length < nextNodes.length) {
    // appended siblings are only conflict-free when they extend the index space;
    // zero total width means a DOM change at an already-passable boundary
    const firstExtra = nextNodes[prevNodes.length];
    if (firstExtra.bounds.left === nextNodes[nextNodes.length - 1].bounds.right) {
      return Position.intermediate(firstExtra.bounds.left, firstExtra.previousSibling, firstExtra);
    }
    return undefined;
  }
  if (prevNodes.length === nextNodes.length) {
    return undefined;
  }
  return Position.intermediate(nextNodes[nextNodes.length - 1].bounds.right, nextNodes[nextNodes.length - 1], undefined);
}

function findConflictInNode(prevNode, nextNode) {
  const leftBound = nextNode.bounds.left;
  if (!isSameNode(prevNode, nextNode)) {
    return Position.intermediate(leftBound, nextNode.previousSibling, nextNode);
  }
  if (prevNode.type === 'text') {
    // examine text value
    const prevValue = prevNode.value;
    const nextValue = nextNode.value;
    if (prevValue === nextValue) {
      return undefined;
    }
    const prefixLen = getCommonPrefixLength(prevValue, nextValue);
    // at nextNode's bounds, the position is intermediate rather than interior
    return prefixLen === 0 ?
      Position.intermediate(leftBound, nextNode.previousSibling, nextNode) :
      prefixLen === nextValue.length ?
        Position.intermediate(leftBound + prefixLen, nextNode, nextNode.nextSibling) :
        Position.interior(leftBound + prefixLen, nextNode);
  } else if (prevNode._atomic) {
    // interior already compared as part of isSameNode; children carry no bounds,
    // so do not dive
  } else if (hasChildren(prevNode) !== hasChildren(nextNode)) {
    // a childless element occupies one intrinsic unit that aliases with its future
    // children's first unit; gaining or losing children reinterprets that region
    return Position.intermediate(leftBound, nextNode.previousSibling, nextNode);
  } else {
    // dive into children
    return findConflictInNodes(prevNode.children, nextNode.children);
  }
}

function hasChildren(node) {
  return !!node.children && node.children.length > 0;
}

// mechanical subtree comparison; unlike isSameNode, carries no identity concept
function subtreeEquals(prevNode, nextNode) {
  if (prevNode.type !== nextNode.type) {
    return false;
  }
  if (prevNode.value !== undefined || nextNode.value !== undefined) {
    return prevNode.value === nextNode.value; // text, raw, comment
  }
  if (prevNode.tagName !== nextNode.tagName ||
    !propsEquals(prevNode.tagName, prevNode.properties || {}, nextNode.properties || {})) {
    return false;
  }
  return childrenEquals(prevNode, nextNode);
}

// compares exactly the aspects of a node that conflict search cannot localize any
// deeper: type, tag and props for every node — plus the entire interior for an
// atomic node, whose interior is not addressable by the index space
function isSameNode(prevNode, nextNode) {
  if (prevNode.type !== nextNode.type || prevNode._atomic !== nextNode._atomic) {
    return false;
  }
  if (prevNode.type === 'text') {
    return true;
  }
  // must be element
  if (prevNode.tagName !== nextNode.tagName ||
    !propsEquals(prevNode.tagName, prevNode.properties || {}, nextNode.properties || {})) {
    return false;
  }
  return !prevNode._atomic || childrenEquals(prevNode, nextNode);
}

function childrenEquals(prevNode, nextNode) {
  const prevChildren = prevNode.children || [];
  const nextChildren = nextNode.children || [];
  if (prevChildren.length !== nextChildren.length) {
    return false;
  }
  for (let i = 0; i < prevChildren.length; i++) {
    if (!subtreeEquals(prevChildren[i], nextChildren[i])) {
      return false;
    }
  }
  return true;
}

const SKIP_PROP_COMPARISON = new Set([
  'blockquote',
  'code',
  'del',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'li',
  'ol',
  'p',
  'pre',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul',
]);

// className is compared separately; tooltip content may depend on data outside the source
const IGNORED_PROPS = new Set(['className', 'data-tooltip', 'dataTooltip']);

function propsEquals(tagName, prevProps = {}, nextProps = {}) {
  const prevKeysCount = Object.keys(prevProps).length;
  const nextKeysCount = Object.keys(nextProps).length;
  if (prevKeysCount !== nextKeysCount) {
    return false;
  }
  if (!arrayEquals(prevProps.className, nextProps.className)) {
    return false;
  }
  if (SKIP_PROP_COMPARISON.has(tagName)) {
    return true;
  }
  for (const key of Object.keys(nextProps)) {
    if (IGNORED_PROPS.has(key)) {
      continue;
    }
    const prevValue = prevProps[key];
    const nextValue = nextProps[key];
    const equal = Array.isArray(prevValue) || Array.isArray(nextValue) ?
      arrayEquals(prevValue, nextValue) :
      prevValue === nextValue;
    if (!equal) {
      return false;
    }
  }
  return true;
}

function arrayEquals(prevArr, nextArr) {
  if (prevArr === nextArr) {
    return true;
  }
  if (!prevArr || !nextArr) {
    return false;
  }
  const len = prevArr.length;
  if (len !== nextArr.length) {
    return false;
  }
  for (let i = 0; i < len; i++) {
    if (prevArr[i] !== nextArr[i]) {
      return false;
    }
  }
  return true;
}

function getCommonPrefixLength(prevText, nextText) {
  const limit = Math.min(prevText.length, nextText.length);
  for (let i = 0; i < limit; i++) {
    if (prevText[i] !== nextText[i]) {
      return i;
    }
  }
  return limit;
}
