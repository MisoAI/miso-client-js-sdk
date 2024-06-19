import { pacer } from '@miso.ai/commons';
import Renderer from './renderer.js';
import { resolvePresets } from './preset/index.js';

const DEFAULT_CLASSES = ['miso-typewriter', 'miso-markdown'];
const DEFAULT_CURSOR_CLASS = 'miso-typewriter__cursor';
const MISO_CIRCLED_CITATION_INDEX = 'miso-circled-citation-index';

export default class Controller {

  constructor(element, {
    circledCitationIndex = true,
    classes = DEFAULT_CLASSES,
    cursorClass = DEFAULT_CURSOR_CLASS,
    nextCursorFn,
    speed,
    acceleration,
    ...options
  } = {}) {
    this._element = element;
    this._getNextCursor = typeof nextCursorFn === 'function' ? nextCursorFn : pacer({ speed, acceleration });
    this._renderer = new Renderer(resolvePresets({
      ...options,
      getSource: (index) => this._getSource(index),
      cursorClass,
    }));

    this._response = undefined;
    this._rendered = undefined;
    this._updateRequested = false;

    for (const className of classes) {
      element.classList.add(className);
    }
    if (circledCitationIndex) {
      element.classList.add(MISO_CIRCLED_CITATION_INDEX);
    }
  }

  clear() {
    this.update(undefined);
  }

  update(response) {
    this._response = response;
    this._requestUpdateDom();
  }

  _getSource(index) {
    const { sources = [] } = this._response || {};
    return sources[index];
  }

  _requestUpdateDom() {
    if (this._updateRequested) {
      return;
    }
    this._updateRequested = true;
    window.requestAnimationFrame(() => this._updateDom());
  }

  _updateDom() {
    if (!this._updateRequested) {
      return;
    }
    this._updateRequested = false;

    if (!this._response) {
      this._rendered = this._renderer.clear(this._element, this._rendered);
      return;
    }

    const timestamp = Date.now();
    const { answer, answer_stage, finished } = this._response;
    const previouslyDone = this._rendered && this._rendered.done;
    const done = previouslyDone || finished;
    const doneAt = previouslyDone ? this._rendered.doneAt : finished ? timestamp : undefined;

    let result;
    if (!this._rendered || answer_stage !== this._rendered.answer_stage) {
      // new typing streak
      result = this._renderer.clear(this._element, this._rendered);
    } else {
      const cursor = this._getNextCursor(this._rendered.cursor, doneAt, this._rendered.timestamp, timestamp);
      result = this._renderer.update(this._element, this._rendered, { value: answer, timestamp, cursor, done });
    }
    const rendered = { ...this._rendered, timestamp, answer_stage, ...result };
    if (!previouslyDone && done) {
      rendered.doneAt = doneAt;
    }
    this._rendered = Object.freeze(rendered);

    if (!result.done) {
      this._requestUpdateDom();
    }
  }

}
