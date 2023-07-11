const TYPE = Object.freeze({
  EMPTY: 'empty',
  INTERIOR: 'interior',
  INTERMEDIATE: 'intermediate',
  PIVOTAL: 'pivotal',
});

export default class Position {

  static get TYPE() {
    return TYPE;
  }

  static empty(root) {
    return new Position({ type: TYPE.EMPTY, index: 0, root });
  }

  static intermediate(index, left, right) {
    return new Position({ type: TYPE.INTERMEDIATE, index, left, right });
  }

  static interior(index, node) {
    return new Position({ type: TYPE.INTERIOR, index, node, offset: index - node.bounds.left });
  }

  static pivotal(node, childIndices, original) {
    return new Position({ type: TYPE.PIVOTAL, index: original.index, node, childIndices, original });
  }

  static equals(a, b) {
    return a === b || (a && a.equals(b));
  }

  constructor(args) {
    Object.assign(this, args);
    Object.freeze(this);
  }

  get empty() {
    return this.type === TYPE.EMPTY;
  }

  get intermediate() {
    return this.type === TYPE.INTERMEDIATE;
  }

  get interior() {
    return this.type === TYPE.INTERIOR;
  }

  get pivotal() {
    return this.type === TYPE.PIVOTAL;
  }

  get refNode() {
    return this.node || this.right || this.left;
  }

  get parent() {
    return this.refNode ? this.refNode.parent : this.root;
  }

  get depth() {
    return this.refNode ? this.refNode.depth : 0;
  }

  pivot(depth) {
    if (this.depth <= depth) {
      return this;
    }
    const childIndices = [];
    let node;
    for (node = this.parent; node.depth > depth; node = node.parent) {
      childIndices.push(node.childIndex);
    }
    childIndices.reverse();
    return Position.pivotal(node, childIndices, this);
  }

  get leftSlice() {
    switch (this.type) {
      case TYPE.INTERIOR:
        return sliceNodeLeft(this);
      case TYPE.PIVOTAL:
        const { node, childIndices, original } = this;
        return sliceLeft(node, childIndices, original, 0);
      default:
        throw new Error(`Cannot slice position of type: ${this.type}`);
    }
  }

  crop(toOffset) {
    switch (this.type) {
      case TYPE.INTERIOR:
        return cropNode(this, toOffset);
        default:
          throw new Error(`Cannot crop position of type: ${this.type}`);
      }
  }

  get unlinked() {
    const { node, left, right, ...position } = this;
    const obj = { ...position };
    if (node) {
      obj.node = unlinkNode(node);
    }
    if (left) {
      obj.left = unlinkNode(left);
    }
    if (right) {
      obj.right = unlinkNode(right);
    }
    return obj;
  }

  equals(other) {
    if (this === other) {
      return true;
    }
    if (!other || this.type !== other.type) {
      return false;
    }
    switch (this.type) {
      case TYPE.EMPTY:
        return this.root === other.root;
      case TYPE.INTERMEDIATE:
        return this.left === other.left && this.right === other.right;
      case TYPE.INTERIOR:
        return this.node === other.node && this.index === other.index;
      case TYPE.PIVOTAL:
        return this.node === other.node && this.index === other.index;
      default:
        return false;
    }
  }

  toString() {
    const head = `${formatType(this.type)}${this.index}`;
    switch (this.type) {
      case TYPE.EMPTY:
        return head;
      case TYPE.INTERMEDIATE:
        if (this.right) {
          return `${head}:${formatNode(this.right)}`;
        } else {
          const path = formatNode(this.parent);
          return `${head}:${ path ? `${path}/${this.left.childIndex + 1}` : this.left.childIndex + 1 }`;
        }
      case TYPE.INTERIOR:
        return `${head}:${formatNode(this.node)}+${this.offset}`;
      case TYPE.PIVOTAL:
        return `${head}:${formatNode(this.node)}#${this.childIndices.join('/')}`;
    }
    return '?';
  }

}

function unlinkNode({ parent, previousSibling, nextSibling, firstChild, lastChild, children, position, ...node }) {
  return node;
}

function sliceLeft({ children, ...node }, childIndices, original, level) {
  let slicedChildren;
  if (level < childIndices.length) {
    const childIndex = childIndices[level];
    // continue to slice subtree
    slicedChildren = [
      ...children.slice(0, childIndex),
      sliceLeft(children[childIndex], childIndices, original, level + 1),
    ];
  } else if (original.interior) {
    // interior type
    slicedChildren = [
      ...children.slice(0, original.node.childIndex),
      sliceNodeLeft(original),
    ];
  } else {
    // intermediate type
    slicedChildren = children.slice(0, original.right.childIndex);
  }
  return {
    ...node,
    children: slicedChildren,
  };
}

function sliceNodeLeft(position) {
  if (position.node.type !== 'text') {
    throw new Error('Cannot slice non-text node');
  }
  return sliceTextNodeLeft(position);
}

function sliceTextNodeLeft({ node: { value, ...node }, offset }) {
  return {
    ...node,
    value: value.slice(0, offset),
  };
}

function cropNode({ node: { value, ...node }, offset }, toOffset) {
  return {
    ...node,
    value: toOffset !== undefined ? value.slice(offset, toOffset) : value.slice(offset),
  };
}

function formatType(type) {
  switch (type) {
    case TYPE.EMPTY:
      return 'E';
    case TYPE.INTERMEDIATE:
      return 'M';
    case TYPE.INTERIOR:
      return 'I';
    case TYPE.PIVOTAL:
      return 'P';
  }
}

function formatNode(node) {
  let str = '';
  for (let n = node; n && n.type !== 'root'; n = n.parent) {
    str = str ? `${n.childIndex}/${str}` : `${n.childIndex}`;
  }
  return str;
}
