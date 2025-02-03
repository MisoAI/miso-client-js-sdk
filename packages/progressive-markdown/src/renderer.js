import Query from './query.js';
import { Operation } from './model/index.js';

function defaultApplyOperation(operation, element, ref) {
  return operation.applyTo(element, ref);
}

function wrapDebug(applyOperation, onDebug) {
  if (!onDebug) {
    return applyOperation;
  }
  return (operation, element, ref, debugContext) => {
    const { timestamp } = debugContext;
    const t0 = performance.now();
    ref = applyOperation(operation, element, ref);
    const t1 = performance.now();
    const event = { ...debugContext, operation, ref, elapsed: [t0 - timestamp, t1 - t0] };
    onDebug({ ...event, summary: summarize(event) });
    return ref;
  };
}

function summarize({ index, cursors = [0, 0], conflict, tree = { rightBound: 0 } }) {
  return `[${index}] ${cursors[0]} -> ${cursors[1]}${ conflict !== undefined ? ` !${conflict.index}` : '' } / ${tree.rightBound}`;
}

export default class Renderer {

  constructor({ parser, compiler, query, onRefChange, onDone, onDebug, applyOperation = defaultApplyOperation } = {}) {
    this._onRefChange = onRefChange;
    this._onDone = onDone;
    this._onDebug = onDebug;
    this._applyOperation = wrapDebug(applyOperation, onDebug);
    this._query = new Query({ ...query, parser, compiler });
    this._index = 0;
  }

  clear(element, prevState, { timestamp = performance.now() } = {}) {
    const index = this._index++;
    this._query.clear();
    const prevRef = prevState ? prevState.ref : element;
    const ref = this._applyOperation(Operation.clear(), element, prevRef, { index, timestamp });
    this._handleRefChange(prevRef, ref);
    return { cursor: 0, done: false, ref, index };
  }

  update(element, { cursor: prevCursor, ref: prevRef }, { value, cursor: rawCursor, timestamp, done: dataDone }) {
    prevCursor = Math.floor(prevCursor);
    let cursor = Math.floor(rawCursor);

    const index = this._index++;
    const query = this._query;

    // optimize:
    //   search for conflict only up to the cursor
    // TODO
    const { conflict } = query.update(value, { done: dataDone });

    const safeRightBound = dataDone ? query.rightBound : query.safeRightBound;
    const viewDone = !!dataDone && (cursor >= query.rightBound);

    if (cursor > safeRightBound) {
      cursor = safeRightBound;
      rawCursor = safeRightBound;
    }

    // defense:
    //   on error, overwrite the whole thing
    // TODO

    // optimize:
    //   resolve conflict with backtracking
    // TODO

    // we have to overwrite the whole thing if we had rendered pass the conflict point
    const overwrite = conflict !== undefined && prevCursor >= conflict.index;
    const operations = overwrite ? query.overwrite(cursor) : query.progress(prevCursor, cursor);

    const debugContext = { index, timestamp, cursors: [prevCursor, cursor], conflict, tree: { rightBound: query.rightBound } };
    let ref = prevRef;
    for (const operation of operations) {
      ref = this._applyOperation(operation, element, ref, debugContext);
    }

    viewDone && this._onDone && this._onDone(element);
    this._handleRefChange(prevRef, ref);

    return { cursor: rawCursor, done: viewDone, ref, index };
  }

  _handleRefChange(oldRef, newRef) {
    oldRef !== newRef && this._onRefChange && this._onRefChange(oldRef, newRef);
  }

}
