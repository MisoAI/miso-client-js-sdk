import { STATUS, LAYOUT_TYPE } from '../../constants.js';
import CollectionLayout from './collection.js';

const TYPE = LAYOUT_TYPE.MESSAGES;
const DEFAULT_CLASSNAME = 'miso-messages';

// the infinite scroll trigger sits ABOVE the list — older messages load as
// the user scrolls up, unlike the stock collection root's bottom trigger
function root(layout, state) {
  const { className, role, templates, options } = layout;
  const { status } = state;
  const roleAttr = role ? ` data-role="${role}"` : '';
  const itemTypeAttr = options.itemType ? ` data-item-type="${options.itemType}"` : '';
  return `<div class="${className} ${status}"${roleAttr}${itemTypeAttr}>${templates.trigger(layout, state)}${status === STATUS.READY ? templates[status](layout, state) : ''}${templates.loading(layout, state)}</div>`;
}

/**
 * The conversation panel of the chat history interface: a shell that renders
 * one <miso-message-item> container element per message item, incrementally —
 * fresh items land at either end of the list: appended messages (a posted
 * follow-up question) render as new items at the bottom, while an older
 * page fetched by the more flow (infinite scroll: the trigger, placed above
 * the list, fires the `more` hub field as the user scrolls up) renders as
 * prepended items — told apart by which boundary the already-rendered
 * records line up with.
 * The content of a message is not rendered here: each <miso-message-item> is
 * assigned its item subworkflow (workflow._getMessageWorkflow, off the item
 * binding) in the post-render sync pass, and the role elements inside
 * (question, answer, ...) render through that workflow's own layouts.
 *
 * All message-level presentation is the message workflow's own: a record
 * without its answer body presents as status `loading`, stamped on the
 * <miso-message-item> element by its container layout — there is deliberately no
 * per-message loading icon; the answer typewriter's blinking caret is the
 * loading indication — and the question bubble (text, authorship
 * attributes) renders through the `question` layout.
 *
 * The shell keeps the panel-level behaviors: scroll pinning (the view sticks
 * to the bottom while the user has not scrolled up, following content growth
 * as answers type out), scroll anchoring while scrolled up (prepended items
 * — and their contents, rendering in later through their own workflows —
 * must not shift the reading position), and the `ongoing` view state read
 * off the data — the last message's answer absent or unfinished — which
 * e.g. disables the search box while an answer is on its way.
 */
export default class MessagesLayout extends CollectionLayout {

  static get type() {
    return TYPE;
  }

  static get defaultClassName() {
    return DEFAULT_CLASSNAME;
  }

  constructor({ className = DEFAULT_CLASSNAME, templates, ...options } = {}) {
    super({ className, templates: { root, ...templates }, ...options });
    this._pinned = true; // whether the view sticks to the bottom on updates
    this._anchor = undefined; // the scroll anchor while prepended content settles
    this._ongoing = undefined;
  }

  // item identity: the question id, or the local placeholder id standing in
  // for it while a posted question awaits its response — the placeholder id
  // survives the settle, so the element and its workflow do too
  _getItemKey(message) {
    return message.placeholder_id || message.question_id || message;
  }

  // render //
  async render(element, state, controls = {}) {
    // capture the view state callback for the ongoing report
    this._notifyUpdate = controls.notifyUpdate;
    await super.render(element, state, controls);
  }

  // incremental renders cover a pure append (a posted follow-up at the
  // bottom) or a pure prepend (an older page above) — anything else
  // re-renders in full
  _shallRenderIncrementally(state, rendered) {
    if (!super._shallRenderIncrementally(state, rendered)) {
      return false;
    }
    const values = this._getItems(state) || [];
    const renderedValues = rendered.value;
    const count = values.length - renderedValues.length;
    return count === 0 || // in-place changes only
      this._getItemKey(values[0]) === this._getItemKey(renderedValues[0]) || // appended
      this._getItemKey(values[count]) === this._getItemKey(renderedValues[0]); // prepended
  }

  // the fresh items land at the tail (a posted follow-up) or at the head
  // (an older page fetched by the more flow): told apart by which boundary
  // the already-rendered records line up with
  _html(state, rendered, incremental) {
    if (!incremental) {
      return this.templates.root(this, state);
    }
    const values = this._getItems(state) || [];
    const renderedValues = rendered.value;
    const count = values.length - renderedValues.length;
    if (count === 0) {
      return '';
    }
    if (this._getItemKey(values[0]) === this._getItemKey(renderedValues[0])) {
      const fresh = values.slice(renderedValues.length);
      return {
        position: 'beforeend',
        items: this.templates.items(this, state, fresh, { offset: renderedValues.length }),
      };
    }
    const fresh = values.slice(0, count);
    return {
      position: 'afterbegin',
      items: this.templates.items(this, state, fresh, { offset: 0 }),
    };
  }

  _render(element, { state }, { notifyUpdate }) {
    const { incremental, html } = state;
    if (incremental) {
      if (html) {
        const listElement = this._getListElement(element);
        if (html.position === 'afterbegin') {
          this._prependAnchored(listElement, html.items);
        } else {
          listElement.insertAdjacentHTML('beforeend', html.items);
        }
      } else {
        notifyUpdate(false);
      }
    } else {
      element.innerHTML = html;
    }
  }

  _afterRender(element, state) {
    super._afterRender(element, state); // syncs bindings and (re)arms the trigger
    if (!state.incremental) {
      // a fresh render (thread load): jump to the bottom
      this._dropAnchor();
      this._scrollToBottom({ force: true });
    } else if (state.html && state.html.position === 'beforeend') {
      // appended items (posted follow-up): jump to the bottom
      this._scrollToBottom({ force: true });
    }
    this._watchGrowth(this._getListElement(element) || element);
    this._syncWorkflows(element);
    this._syncOngoing(state);
  }

  _unrender() {
    super._unrender();
    this._dropAnchor();
  }

  // assign each <miso-message-item> its item subworkflow, off the item binding
  _syncWorkflows(element) {
    const workflow = this._view && this._view.workflow;
    if (!workflow || typeof workflow._getMessageWorkflow !== 'function') {
      return;
    }
    for (const item of this._getItemElements(element)) {
      const binding = this._bindings.get(item);
      if (binding && item.isContainer) {
        item.workflow = workflow._getMessageWorkflow(binding.value);
      }
    }
  }

  // whether an answer is on its way — pending, or still being generated —
  // reported as the `ongoing` view state, e.g. for the search box to disable
  // submission
  _syncOngoing(state) {
    const messages = state.value || [];
    const last = messages[messages.length - 1];
    // a message settled by a failed content fetch is not on its way anymore
    const ongoing = !!last && !last.error && (last.answer === undefined || last.finished === false);
    if (this._ongoing === ongoing) {
      return;
    }
    this._ongoing = ongoing;
    this._notifyUpdate && this._notifyUpdate({ ongoing });
  }

  // scrolling //
  /**
   * Scroll the containing scrollable to the bottom. Unless forced, only
   * applies while the user is pinned to the bottom — scrolling up to read
   * releases the pin, scrolling back down restores it.
   */
  _scrollToBottom({ force = false } = {}) {
    const scrollable = this._getScrollable();
    if (!scrollable || !(force || this._pinned)) {
      return;
    }
    scrollable.scrollTop = scrollable.scrollHeight;
    this._pinned = true;
  }

  _getScrollable() {
    const element = this._element;
    if (!element || typeof getComputedStyle === 'undefined') {
      return undefined;
    }
    for (let el = element; el && el.nodeType === 1 && el !== document.body; el = el.parentElement) {
      const { overflowY } = getComputedStyle(el);
      if (overflowY === 'auto' || overflowY === 'scroll') {
        this._watchScroll(el);
        return el;
      }
    }
    return undefined;
  }

  _watchScroll(scrollable) {
    if (this._watchedScrollable === scrollable) {
      return;
    }
    this._unwatchScroll && this._unwatchScroll();
    const onScroll = () => {
      this._pinned = scrollable.scrollHeight - scrollable.scrollTop - scrollable.clientHeight < 40;
      if (this._pinned) {
        // back at the bottom: the reading position needs no anchor
        this._anchor = undefined;
      } else if (this._anchor && this._anchor.element.isConnected) {
        // follow the user: the anchor holds the position they scrolled to,
        // not the one where the prepend happened
        this._anchor.top = this._relativeTop(this._anchor.element, scrollable);
      }
    };
    scrollable.addEventListener('scroll', onScroll, { passive: true });
    this._watchedScrollable = scrollable;
    const unwatch = this._unwatchScroll = () => {
      scrollable.removeEventListener('scroll', onScroll);
      this._watchedScrollable = undefined;
      this._unwatchScroll = undefined;
    };
    this._unsubscribes.push(() => this._unwatchScroll === unwatch && unwatch());
  }

  // the message contents render (and type out) through their own workflows,
  // outside this layout's render cycle: follow the content growth — pinned,
  // the view sticks to the bottom; scrolled up with an anchor active (a
  // prepended page still rendering its contents in), the anchor is held
  // stationary instead
  _watchGrowth(element) {
    if (!element || this._watchedGrowth === element || typeof ResizeObserver === 'undefined') {
      return;
    }
    this._unwatchGrowth && this._unwatchGrowth();
    const observer = new ResizeObserver(() => this._onContentGrowth());
    observer.observe(element);
    this._watchedGrowth = element;
    const unwatch = this._unwatchGrowth = () => {
      observer.disconnect();
      this._watchedGrowth = undefined;
      this._unwatchGrowth = undefined;
    };
    this._unsubscribes.push(() => this._unwatchGrowth === unwatch && unwatch());
  }

  _onContentGrowth() {
    if (this._pinned) {
      this._scrollToBottom();
    } else {
      this._restoreAnchor();
    }
  }

  // scroll anchoring for prepended content //
  // The anchor is the previously-first item: everything prepended — and
  // its content, rendering in later through the item workflows — sits
  // above it, so holding the anchor stationary holds the reading position,
  // while growth below it (a streaming answer at the bottom) moves nothing
  // above and needs no compensation. Not the browser's own scroll
  // anchoring, which not every engine provides.
  _prependAnchored(listElement, items) {
    this._setAnchor();
    listElement.insertAdjacentHTML('afterbegin', items);
    this._restoreAnchor();
  }

  _setAnchor() {
    const scrollable = this._getScrollable();
    const element = this._getItemElements(this._element)[0];
    this._anchor = scrollable && element
      ? { element, scrollable, top: this._relativeTop(element, scrollable) }
      : undefined;
  }

  _restoreAnchor() {
    const anchor = this._anchor;
    if (!anchor) {
      return;
    }
    const { element, scrollable, top } = anchor;
    if (!element.isConnected) {
      this._anchor = undefined;
      return;
    }
    const delta = this._relativeTop(element, scrollable) - top;
    if (delta) {
      scrollable.scrollTop += delta;
    }
  }

  _relativeTop(element, scrollable) {
    return element.getBoundingClientRect().top - scrollable.getBoundingClientRect().top;
  }

  _dropAnchor() {
    this._anchor = undefined;
  }

}
