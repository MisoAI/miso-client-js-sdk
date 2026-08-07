import { Resolution, pacer, requestAnimationFrame as raf } from '@miso.ai/commons';
import { hasAnswer, getGeneratedBy } from '@miso.ai/client-sdk-workflow';
import { LAYOUT_TYPE } from '../../constants.js';
import CollectionLayout from './collection.js';
import { cursorClassName } from '../text/typewriter/utils.js';
import { messageAuthor } from '../templates.js';
import { setOrRemoveAttribute } from '../../util/dom.js';

const TYPE = LAYOUT_TYPE.MESSAGES;
const DEFAULT_CLASSNAME = 'miso-messages';
const TYPEWRITER_CLASSNAME = 'miso-typewriter';

/**
 * The conversation panel of the chat history interface: a list of `message`
 * items (question bubble + answer body), rendered incrementally — appended
 * messages (e.g. a posted follow-up question) render as new items, while
 * in-place changes are applied to existing items by a post-render pass
 * (`_syncMessages`):
 *
 * - question texts are filled in when they arrive (the head request carries
 *   question ids only)
 * - a finished answer body is transformed from markdown to HTML in one shot
 *   through the `std:ui-markdown` plugin
 * - a streaming answer (a follow-up being generated, `finished: false`) is
 *   driven by a per-message typewriter: a progressive markdown renderer with
 *   a paced cursor, like the typewriter layout of the ask workflow
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
    this._renderedAnswers = new WeakMap(); // answer element -> rendered markdown
    this._typewriters = new WeakMap(); // answer element -> MessageTypewriter
    this._readiness = new Resolution();
    this._pinned = true; // whether the view sticks to the bottom on updates
    this._displaying = false; // whether a typewriter is still displaying an answer
    // kick off sooner
    MessagesLayout.MisoClient.plugins.install('std:ui-markdown');
  }

  initialize(view) {
    super.initialize(view);
    this._setup();
  }

  // setup //
  async _setup() {
    try {
      const plugin = await MessagesLayout.MisoClient.plugins.install('std:ui-markdown');
      if (!this._view) {
        return; // destroyed
      }
      this._markdown = plugin.getContext(this._view.workflow._client);
      this._readiness.resolve();
    } catch (e) {
      this._readiness.reject(e);
    }
  }

  async _ready() {
    return this._readiness.promise;
  }

  // render //
  async render(element, state, controls = {}) {
    // capture the view state callback, so the typewriter can report the
    // `ongoing` state outside the render cycle
    this._notifyUpdate = controls.notifyUpdate;
    await super.render(element, state, controls);
  }

  _afterRender(element, state) {
    super._afterRender(element, state); // syncs bindings to the latest values
    if (!state.incremental) {
      this._displaying = false; // a fresh render (thread load) drops any ongoing typewriter
    }
    if (!state.incremental || state.html) {
      // a fresh render (thread load) or appended items (posted follow-up):
      // jump to the bottom
      this._scrollToBottom({ force: true });
    }
    this._syncMessages(element).catch(error => console.error(error));
  }

  async _syncMessages(element) {
    await this._ready();
    const items = this._getItemElements(element);
    let displaying = false;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const binding = this._bindings.get(item);
      if (!binding) {
        continue;
      }
      const message = binding.value;
      const last = i === items.length - 1;
      this._syncQuestion(item, message);
      this._syncAnswer(item, message, { last });
      if (last) {
        displaying = this._isDisplaying(item, message);
      }
    }
    this._setDisplaying(displaying);
  }

  // whether the (last) message pair is still being displayed: its answer is
  // pending, streaming, or still being typed — live (posted in this session)
  // or not: an answer still generating is picked up by the answers polling
  // even after switching away from the thread and back, and must keep
  // blocking submission all the same
  _isDisplaying(item, message) {
    if (!hasAnswer(message)) {
      return true; // waiting for the answer body
    }
    const answerElement = item.querySelector('[data-role="answer"]');
    const typewriter = answerElement && this._typewriters.get(answerElement);
    return typewriter ? !typewriter.done : message.finished === false;
  }

  _syncQuestion(item, message) {
    const questionElement = item.querySelector('[data-role="question"]');
    if (!questionElement) {
      return;
    }
    // the authorship arrives with the answers response, after the stub render
    setOrRemoveAttribute(questionElement, 'data-author', messageAuthor(message));
    setOrRemoveAttribute(questionElement, 'data-generated-by', getGeneratedBy(message));
    const { question } = message;
    if (!question || questionElement.textContent === question) {
      return;
    }
    questionElement.textContent = question;
    questionElement.hidden = false;
  }

  _syncAnswer(item, message, { last = false } = {}) {
    const answerElement = item.querySelector('[data-role="answer"]');
    if (!answerElement) {
      return;
    }
    // an ongoing typewriter keeps consuming updates until it finishes typing
    const typewriter = this._typewriters.get(answerElement);
    if (typewriter) {
      typewriter.update(message);
      return;
    }
    if (!hasAnswer(message)) {
      return; // still loading; the spinner stays
    }
    if (message.live || message.finished === false) {
      // an answer being generated live in this session: drive it with a
      // typewriter (even if the data arrived complete in one shot)
      const typewriter = new MessageTypewriter(this._markdown, answerElement, {
        onUpdate: () => this._scrollToBottom(), // keep pinned to the bottom while typing
        onDone: () => this._setDisplaying(false),
      });
      this._typewriters.set(answerElement, typewriter);
      typewriter.update(message);
      return;
    }
    // a finished answer: transform in one shot
    if (this._renderedAnswers.get(answerElement) === message.answer) {
      return; // already rendered
    }
    this._renderedAnswers.set(answerElement, message.answer);
    this._transform(answerElement, message).then(() => {
      last && this._scrollToBottom();
    }).catch(error => {
      this._renderedAnswers.delete(answerElement);
      console.error(error);
    });
  }

  async _transform(answerElement, { answer, sources }) {
    answerElement.innerHTML = await this._markdown.transform(answer, sources);
  }

  // whether the last answer is still being displayed (typed); reported as
  // the `ongoing` view state, e.g. for the search box to disable submission
  _setDisplaying(displaying) {
    if (this._displaying === displaying) {
      return;
    }
    this._displaying = displaying;
    this._notifyUpdate && this._notifyUpdate({ ongoing: displaying });
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

}

// TODO: can't we just use Controller?
/**
 * Types a streaming answer into an element: a progressive markdown renderer
 * fed by data updates, advanced by a paced cursor on animation frames — the
 * typewriting effect, without the full typewriter layout machinery.
 */
class MessageTypewriter {

  constructor(markdown, element, { onUpdate, onDone } = {}) {
    this._element = element;
    this._onUpdate = onUpdate;
    this._onDone = onDone;
    // the element acts as a typewriter container: it starts as the caret ref
    // (the cursor class moves into the content as it types), and the preset
    // stamps the `done` class on finish, which hides the caret via CSS
    element.classList.add(TYPEWRITER_CLASSNAME, cursorClassName(TYPEWRITER_CLASSNAME));
    this._renderer = markdown.createRenderer({
      cursorClass: cursorClassName(TYPEWRITER_CLASSNAME),
      getSource: index => (this._sources || [])[index],
    });
    this._getNextCursor = pacer();
    this._rendered = this._renderer.clear(element);
    this._timestamp = undefined;
    this._value = '';
    this._sources = undefined;
    this._dataDone = false;
    this._doneAt = undefined;
    this._requested = false;
  }

  get done() {
    return this._rendered.done;
  }

  update({ answer = '', finished, sources }) {
    this._value = answer;
    this._sources = sources;
    this._dataDone = finished !== false;
    this._requestFrame();
  }

  _requestFrame() {
    if (this._requested || this._rendered.done) {
      return;
    }
    this._requested = true;
    raf(timestamp => this._frame(timestamp));
  }

  _frame(timestamp) {
    this._requested = false;
    if (!this._element.isConnected) {
      // the element is gone (re-render, thread switch); stop typing
      this._onDone && this._onDone();
      return;
    }
    const prev = this._rendered;
    const prevTimestamp = this._timestamp !== undefined ? this._timestamp : timestamp;
    if (this._dataDone && this._doneAt === undefined) {
      this._doneAt = timestamp;
    }
    const cursor = this._getNextCursor(prev.cursor, this._doneAt, prevTimestamp, timestamp);
    this._rendered = this._renderer.update(this._element, prev, { value: this._value, cursor, timestamp, done: this._dataDone });
    this._timestamp = timestamp;
    this._onUpdate && this._onUpdate();
    if (!this._rendered.done) {
      this._requestFrame();
    } else {
      this._onDone && this._onDone();
    }
  }

}
