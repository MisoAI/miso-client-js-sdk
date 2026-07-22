import { isThreadUnread } from '@miso.ai/client-sdk-workflow';
import { LAYOUT_TYPE } from '../../constants.js';
import CollectionLayout from './collection.js';
import { setOrRemoveAttribute } from '../../util/dom.js';

const TYPE = LAYOUT_TYPE.THREADS;
const DEFAULT_CLASSNAME = 'miso-threads';

/**
 * The thread list of the chat history interface: a list of `thread` items.
 *
 * Selection comes with the data: the history workflow stamps
 * `selectedThreadId` into its value and the role mapping decorates each
 * thread record with a `selected` flag, so any selection change flows down
 * the regular data path and refreshes the view. The list renders
 * incrementally (append-only); in-place state changes on existing items
 * (selected, unread) are applied by `_syncSelection` after each render,
 * reading the fresh values off the item bindings — no item re-render needed.
 */
export default class ThreadsLayout extends CollectionLayout {

  static get type() {
    return TYPE;
  }

  static get defaultClassName() {
    return DEFAULT_CLASSNAME;
  }

  constructor({ className = DEFAULT_CLASSNAME, ...options } = {}) {
    super({ className, ...options });
  }

  _afterRender(element, state) {
    super._afterRender(element, state); // syncs bindings to the latest values
    this._syncSelection(element);
  }

  // sync in-place item states (selected, and unread for the same reason) from
  // the bound values onto the existing item elements
  _syncSelection(element) {
    for (const item of this._getItemElements(element)) {
      const binding = this._bindings.get(item);
      if (!binding) {
        continue;
      }
      const { value } = binding;
      setOrRemoveAttribute(item, 'data-selected', value.selected ? '' : undefined);
      setOrRemoveAttribute(item, 'data-unread', isThreadUnread(value) ? '' : undefined);
    }
  }

  // a click on a thread item means selection — a navigation action, not a
  // content-engagement click: emit a select view event and skip click tracking
  _onClick(event) {
    const element = event.target.closest(`[data-role="item"]`);
    if (!element) {
      return;
    }
    const binding = this._bindings.get(element);
    if (!binding) {
      return;
    }
    const { session } = this._view._state;
    const { value } = binding;
    this._view._emit('select', { session, value, element: binding.element, domEvent: event });
  }

}
