import { isThreadUnread } from '@miso.ai/client-sdk-workflow';
import { LAYOUT_TYPE } from '../../constants.js';
import CollectionLayout from './collection.js';
import { setOrRemoveAttribute } from '../../util/dom.js';

const TYPE = LAYOUT_TYPE.THREADS;
const DEFAULT_CLASSNAME = 'miso-threads';

/**
 * The thread list of the chat history interface: a shell that renders one
 * <miso-thread-item> container element per thread item, incrementally — fresh
 * items (the list is newest-first) render as prepended items. The content
 * of an item is not rendered here: each <miso-thread-item> is assigned its item
 * subworkflow (workflow.getThreadWorkflow, off the item binding) in the
 * post-render sync pass, and the role elements inside (the title, and the
 * context menu's rename/delete buttons) render through that workflow's own
 * layouts — so a record change re-renders the affected item's roles alone.
 *
 * The shell keeps the list-level behaviors. Selection comes with the data:
 * the history workflow stamps `selectedThreadId` into its value and
 * decorates each thread record with a `selected` flag, so any selection
 * change flows down the regular data path; in-place state changes on
 * existing items (selected, unread, the thread identity of a settled
 * placeholder) are applied by `_syncItems` after each render, reading the
 * fresh values off the item bindings — no item re-render needed. Each item
 * carries a context menu (vertical dots), but that is the thread workflow's
 * too: its item-container layout inserts and toggles it — the shell only
 * keeps menu clicks (by their item-menu data-roles) from selecting.
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

  // item identity: the thread id, or the local placeholder id standing in
  // for it while a thread is being created — the workflow adopts the thread
  // id at the settle, so the element and its workflow survive it
  _getItemKey(thread) {
    return thread.thread_id || thread.placeholder_id || thread;
  }

  // the list is newest-first, so incremental renders PREPEND the fresh items
  // (the collection layout's stock incremental mode is append-only)
  _html(state, rendered, incremental) {
    if (incremental) {
      const values = this._getItems(state) || [];
      const fresh = values.slice(0, values.length - rendered.value.length);
      return fresh.length > 0 ? this.templates.items(this, state, fresh, { offset: 0 }) : '';
    }
    return this.templates.root(this, state);
  }

  _render(element, { state }, { notifyUpdate }) {
    const { incremental, html } = state;
    if (incremental) {
      if (html) {
        this._getListElement(element).insertAdjacentHTML('afterbegin', html);
      } else {
        notifyUpdate(false);
      }
    } else {
      element.innerHTML = html;
    }
  }

  _afterRender(element, state) {
    super._afterRender(element, state); // syncs bindings to the latest values
    this._syncWorkflows(element);
    this._syncItems(element);
  }

  // assign each <miso-thread-item> its item subworkflow, off the item binding
  _syncWorkflows(element) {
    const workflow = this._view && this._view.workflow;
    if (!workflow || typeof workflow.getThreadWorkflow !== 'function') {
      return;
    }
    for (const item of this._getItemElements(element)) {
      const binding = this._bindings.get(item);
      if (binding && item.isContainer) {
        item.workflow = workflow.getThreadWorkflow(binding.value);
      }
    }
  }

  // sync in-place item state changes from the bound values onto the existing
  // item elements: selection/unread state, and the thread identity of a
  // placeholder that settled into its real record — the item contents render
  // through the thread workflows, outside this layout's render cycle
  _syncItems(element) {
    for (const item of this._getItemElements(element)) {
      const binding = this._bindings.get(item);
      if (!binding) {
        continue;
      }
      const { value } = binding;
      setOrRemoveAttribute(item, 'data-selected', value.selected ? '' : undefined);
      setOrRemoveAttribute(item, 'data-unread', isThreadUnread(value) ? '' : undefined);
      setOrRemoveAttribute(item, 'data-thread-id', value.thread_id || undefined);
    }
  }

  // a click on a thread item means selection — a navigation action, not a
  // content-engagement click: emit a select view event and skip click tracking
  _onClick(event) {
    if (event.target.closest(`[data-role="item-menu-button"], [data-role="item-menu"]`)) {
      return; // the item's own context menu, owned by its container layout
    }
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
