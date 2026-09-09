import { LAYOUT_TYPE } from '../../constants.js';
import CollectionLayout from './collection.js';

const TYPE = LAYOUT_TYPE.MESSAGES;
const DEFAULT_CLASSNAME = 'miso-messages';

/**
 * The conversation panel of the chat history interface: a shell that renders
 * one <miso-message-item> container element per message item, incrementally —
 * appended messages (e.g. a posted follow-up question) render as new items.
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
 * as answers type out), and the `ongoing` view state read off the data — the
 * last message's answer absent or unfinished — which e.g. disables the
 * search box while an answer is on its way.
 */
export default class MessagesLayout extends CollectionLayout {

  static get type() {
    return TYPE;
  }

  static get defaultClassName() {
    return DEFAULT_CLASSNAME;
  }

  constructor({ className = DEFAULT_CLASSNAME, ...options } = {}) {
    super({ className, ...options });
    this._pinned = true; // whether the view sticks to the bottom on updates
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

  _afterRender(element, state) {
    super._afterRender(element, state); // syncs bindings to the latest values
    if (!state.incremental || state.html) {
      // a fresh render (thread load) or appended items (posted follow-up):
      // jump to the bottom
      this._scrollToBottom({ force: true });
    }
    this._watchGrowth(this._getListElement(element) || element);
    this._syncWorkflows(element);
    this._syncOngoing(state);
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
    const ongoing = !!last && (last.answer === undefined || last.finished === false);
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
  // outside this layout's render cycle: follow the content growth to keep
  // the view pinned to the bottom
  _watchGrowth(element) {
    if (!element || this._watchedGrowth === element || typeof ResizeObserver === 'undefined') {
      return;
    }
    this._unwatchGrowth && this._unwatchGrowth();
    const observer = new ResizeObserver(() => this._scrollToBottom());
    observer.observe(element);
    this._watchedGrowth = element;
    const unwatch = this._unwatchGrowth = () => {
      observer.disconnect();
      this._watchedGrowth = undefined;
      this._unwatchGrowth = undefined;
    };
    this._unsubscribes.push(() => this._unwatchGrowth === unwatch && unwatch());
  }

}
