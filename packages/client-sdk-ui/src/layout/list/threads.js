import { getThreadId, isThreadUnread } from '@miso.ai/client-sdk-workflow';
import { LAYOUT_TYPE } from '../../constants.js';
import CollectionLayout from './collection.js';
import { setOrRemoveAttribute } from '../../util/dom.js';
import confirm from '../../util/confirm.js';

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
 *
 * Each item carries a context menu (vertical dots) with thread actions;
 * `delete` asks for confirmation (the shared confirm dialog util), then
 * emits a delete view event for the history workflow to act on.
 */
export default class ThreadsLayout extends CollectionLayout {

  static get type() {
    return TYPE;
  }

  static get defaultClassName() {
    return DEFAULT_CLASSNAME;
  }

  constructor({ className = DEFAULT_CLASSNAME, templates, ...options } = {}) {
    super({
      className,
      templates: { ...templates },
      ...options,
    });
  }

  initialize(view) {
    super.initialize(view);
    // clicking outside the list closes any open context menu
    if (typeof document !== 'undefined') {
      const onDocumentClick = (event) => {
        const element = this._element;
        if (element && !element.contains(event.target)) {
          this._closeMenus();
        }
      };
      document.addEventListener('click', onDocumentClick);
      this._unsubscribes.push(() => document.removeEventListener('click', onDocumentClick));
    }
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
    this._syncItems(element);
  }

  // sync in-place item changes from the bound values onto the existing item
  // elements: selection/unread state, and record changes that arrive without
  // a re-render (rename, a placeholder thread resolving to its real record)
  _syncItems(element) {
    for (const item of this._getItemElements(element)) {
      const binding = this._bindings.get(item);
      if (!binding) {
        continue;
      }
      const { value } = binding;
      setOrRemoveAttribute(item, 'data-selected', value.selected ? '' : undefined);
      setOrRemoveAttribute(item, 'data-unread', isThreadUnread(value) ? '' : undefined);
      setOrRemoveAttribute(item, 'data-thread-id', getThreadId(value) || undefined);
      const titleElement = item.querySelector(`.${this.className}__title`);
      const title = value.title || 'Untitled';
      if (titleElement && titleElement.textContent !== title) {
        titleElement.textContent = title;
      }
    }
  }

  // a click on a thread item means selection — a navigation action, not a
  // content-engagement click: emit a select view event and skip click tracking
  _onClick(event) {
    if (event.target.closest(`[data-role="thread-menu-button"]`)) {
      this._toggleMenu(event.target.closest(`[data-role="item"]`));
      return;
    }
    if (event.target.closest(`[data-role="thread-delete"]`)) {
      this._closeMenus();
      const binding = this._bindings.get(event.target.closest(`[data-role="item"]`));
      binding && this._requestDelete(binding);
      return;
    }
    if (event.target.closest(`[data-role="thread-menu"]`)) {
      return; // other clicks inside the menu don't select
    }
    this._closeMenus();
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

  // context menu //
  _toggleMenu(item) {
    const menu = item && item.querySelector(`[data-role="thread-menu"]`);
    if (!menu) {
      return;
    }
    const open = menu.hidden;
    this._closeMenus();
    menu.hidden = !open;
  }

  _closeMenus() {
    const element = this._element;
    if (!element) {
      return;
    }
    for (const menu of element.querySelectorAll(`[data-role="thread-menu"]:not([hidden])`)) {
      menu.hidden = true;
    }
  }

  // delete //
  async _requestDelete(binding) {
    const { value, element } = binding;
    const confirmed = await confirm({
      title: 'Delete thread',
      message: `Are you sure you want to delete "${value.title || 'this thread'}"? This cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    const { session } = this._view._state;
    this._view._emit('delete', { session, value, element });
  }

}
