import Query from './query.js';

export default class Renderer {

  constructor({ query, onRefChange, onDone, onDebug } = {}) {
    this._onRefChange = onRefChange;
    this._onDone = onDone;
    this._onDebug = onDebug;
    this._query = query || new Query();
    this._index = 0;
  }

  clear(element, prevState) {
    const index = this._index++;
    this._query.clear();
    element.innerHTML = '';
    this._handleRefChange(prevState ? prevState.ref : element, element);
    return { cursor: 0, done: false, ref: element, index };
  }

  update(element, { cursor: prevCursor, ref: prevRef }, { value, cursor, done: dataDone }) {
    const index = this._index++;
    const query = this._query;

    // optimize:
    //   search for conflict only up to the cursor
    // TODO
    const { conflict } = query.update(value, { done: dataDone });

    const safeRightBound = dataDone ? query.rightBound : query.safeRightBound;
    const viewDone = !!dataDone && (cursor >= query.rightBound);

    cursor = Math.min(cursor, safeRightBound);

    // defense:
    //   on error, overwrite the whole thing
    // TODO

    // optimize:
    //   resolve conflict with backtracking
    // TODO

    // we have to overwrite the whole thing if we had rendered pass the conflict point
    const overwrite = conflict !== undefined && prevCursor >= conflict.index;

    let ref = prevRef;
    const operations = overwrite ? query.overwrite(cursor) : query.progress(prevCursor, cursor);
    for (const operation of operations) {
      this._onDebug && this._onDebug({ index, operation, ref, cursors: [prevCursor, cursor], conflict, tree: { rightBound: query.rightBound } });
      ref = operation.applyTo(element, ref);
    }
    viewDone && this._onDone && this._onDone(element);
    this._handleRefChange(prevRef, ref);

    return { cursor, done: viewDone, ref, index };
  }

  _handleRefChange(oldRef, newRef) {
    oldRef !== newRef && this._onRefChange && this._onRefChange(oldRef, newRef);
  }

}
