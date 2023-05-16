const TYPE = Object.freeze({
  INTERIOR: 'interior',
  INTERMEDIATE: 'intermediate',
  PIVOTAL: 'pivotal',
});

export default class Position {

  static get TYPE() {
    return TYPE;
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
    return this.refNode.parent;
  }

  get depth() {
    return this.refNode.depth;
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
    return this === other || (
      other &&
      this.type === other.type &&
      this.intermediate ? equalsIntermidiate(this, other) : equalsInterior(this, other)
    );
  }

}

function unlinkNode({ parent, previousSibling, nextSibling, firstChild, lastChild, children, position, ...node }) {
  return node;
}

function equalsInterior(a, b) {
  return a.node === b.node && a.index === b.index;
}

function equalsIntermidiate(a, b) {
  return a.left === b.left && a.right === b.right;
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
