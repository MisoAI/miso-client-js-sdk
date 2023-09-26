import Parser from './parser.js';
import Compiler from './compiler.js';
import { Operation, optimizeOperations as optimize } from './model/index.js';
import { shim, search, commonAncestor, safeRightBoundOf, findConflict } from './trees.js';

export default class Query {

  constructor({ parser, compiler, ...options } = {}) {
    this._parser = new Parser(parser);
    this._compiler = new Compiler(compiler);
    this._options = options;
    this.clear();
  }

  clear() {
    this._source = undefined;
    this._done = false;
    this._tree = undefined;
    this._cache = undefined;
  }

  update(source, { done } = {}) {
    if (this._done) {
      return {};
    }
    if (!done && source === this._source) {
      return {};
    }
    const oldSource = this._source;
    const oldTree = this._tree;

    this._source = source;
    this._done = done;
    const tree = this._tree = shim(this._parser.parseSync(source));
    this._cache = undefined;

    const conflict = oldSource ? findConflict({ source: oldSource, tree: oldTree }, { source, done, tree }) : undefined;

    return conflict ? { conflict } : {};
  }

  get source() {
    return this._source;
  }

  get done() {
    return this._done;
  }

  get tree() {
    return this._tree;
  }

  get rightBound() {
    this._assertTreeReady();
    return this._tree.bounds.right;
  }

  get safeRightBound() {
    this._assertTreeReady();
    return this._done ? this.rightBound : safeRightBoundOf(this._tree);
  }

  positionOf(index) {
    return this._search(index);
  }

  overwrite(to) {
    this._assertTreeReady();
    if (to !== undefined && to > this.safeRightBound) {
      throw new Error(`Unsafe right bound: ${to} > ${this.safeRightBound}`);
    }
    if (to === 0) {
      return '';
    }
    if (to === undefined || to === this.rightBound) {
      return optimize([
        Operation.set(this._compiler.stringify(this._tree.children)),
      ]);
    }

    const toPos = this._search(to, { memoize: true });
    const toPivotPos = toPos.pivot(1);

    // top level nodes
    const toPivotNodeChildIndex = toPivotPos.pivotal ? toPivotPos.node.childIndex : toPivotPos.left;
    const nodes = this._tree.children.slice(0, toPivotNodeChildIndex);

    // add the left slice of the remaining pivot node
    if (toPivotPos.pivotal || toPivotPos.interior) {
      nodes.push(toPivotPos.leftSlice);
    }

    const html = this._compiler.stringify(nodes);
    const descendLevel = toPos.depth - 1;

    return optimize([
      Operation.set(html),
      Operation.descend(descendLevel),
    ]);
  }

  /*
  backtrack(from, to) {
    this._assertTreeReady();
    if (from < to) {
      throw new Error(`Illegal range: ${from} < ${to}`);
    }
    if (from === to) {
      return [];
    }
    // TODO
  }
  */

  progress(from, to) {
    this._assertTreeReady();
    if (to === undefined) {
      to = this.rightBound;
    }
    if (from > to) {
      throw new Error(`Illegal range: ${from} > ${to}`);
    }
    if (to > this.safeRightBound) {
      throw new Error(`Unsafe right bound: ${to} > ${this.safeRightBound}`);
    }
    if (from === to) {
      return [];
    }
    if (from === 0) {
      return this.overwrite(to);
    }

    const fromPos = this._search(from);
    const toPos = this._search(to, { memoize: true }); // memoize to-position

    if (fromPos.equals(toPos)) {
      return [];
    }

    const operations = [];

    // finish up from-node if necessary
    if (fromPos.interior) {
      const sameNode = toPos.interior && fromPos.node === toPos.node;
      const html = this._compiler.stringify(fromPos.crop(sameNode ? toPos.offset : undefined));
      operations.push(Operation.append(html));

      // same node, we're done
      if (sameNode) {
        return operations;
      }
    }

    const fromRefNode = fromPos.node || fromPos.left;
    const toRefNode = toPos.node || toPos.right;

    // toRefNode is undefined iff at the right-most position, thus ancestor is the root
    const ancestor = toRefNode ? commonAncestor(fromRefNode, toRefNode) : this._tree;
    const pivotDepth = ancestor.depth + 1;

    const fromPivotPos = fromPos.pivot(pivotDepth);
    const toPivotPos = toPos.pivot(pivotDepth);

    // walk up to the pivot level
    if (fromPivotPos.pivotal) {
      for (let n = fromRefNode; n.depth > pivotDepth; n = n.parent) {
        // optimize:
        //   solidify the last ascended node by re-setting its innerHTML
        // TODO
        if (n.nextSibling) {
          // finish up what's left at this level
          const html = this._compiler.stringify(n.parent.children.slice(n.childIndex + 1));
          operations.push(Operation.append(html));
        }
        // close the tag
        operations.push(Operation.ascend());
      }
    }

    // walk horizontally to destination's ancestor at this level
    const fromPivotNodeChildIndex = !fromPivotPos.intermediate ? fromPivotPos.node.childIndex + 1 : fromPivotPos.right.childIndex;
    const toPivotNodeChildIndex = !toPivotPos.intermediate ? toPivotPos.node.childIndex : toPivotPos.right ? toPivotPos.right.childIndex : undefined;
    const nodes = ancestor.children.slice(fromPivotNodeChildIndex, toPivotNodeChildIndex);
    
    // add the left slice of the remaining pivot node
    if (!toPivotPos.intermediate) {
      nodes.push(toPivotPos.leftSlice);
    }

    operations.push(Operation.append(this._compiler.stringify(nodes)));

    // may need to descend
    operations.push(Operation.descend(toPos.depth - pivotDepth));

    return optimize(operations);
  }

  // helpers //
  _search(cursor, { memoize = false } = {}) {
    this._assertTreeReady();
    if (this._cache && cursor === this._cache.cursor) {
      return this._cache.position;
    }
    // optimize:
    //   use memoized position as the starting point to steal from locality
    // TODO
    const position = search(this._tree, cursor, {});
    if (memoize) {
      this._cache = { cursor, position };
    }
    return position;
  }

  _assertTreeReady() {
    if (!this._tree) {
      throw new Error('Source not available yet.');
    }
  }

}
