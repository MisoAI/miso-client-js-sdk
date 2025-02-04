import { trimObj, defineValues, Resolution, pacer } from '@miso.ai/commons';
import { STATUS } from '../../../constants.js';
import ProgressiveLayout from '../../progressive.js';
import PlaintextRenderer from './plaintext.js';
import { containerElement, cursorClassName, fromSameSession, normalizeOnDebug } from './utils.js';

const TYPE = 'typewriter';
const DEFAULT_CLASSNAME = 'miso-typewriter';

export default class TypewriterLayout extends ProgressiveLayout {

  static get type() {
    return TYPE;
  }

  static get defaultClassName() {
    return DEFAULT_CLASSNAME;
  }

  constructor({
    className = DEFAULT_CLASSNAME,
    tag = 'auto',
    format = 'markdown',
    tooltip = false,
    speed,
    acceleration,
    nextCursorFn,
    ...options
  } = {}) {
    super({
      tag,
      format,
      tooltip,
      ...options,
    });
    defineValues(this, {
      className,
    });
    this._prevState = undefined;
    this._getNextCursor = typeof nextCursorFn === 'function' ? nextCursorFn : pacer({ speed, acceleration });
    this._readiness = new Resolution();

    // kick off sooner
    if (format === 'markdown') {
      TypewriterLayout.MisoClient.plugins.install('std:ui-markdown');
    }
  }

  initialize() {
    this._setup();
  }

  // setup //
  async _setup() {
    try {
      switch (this.options.format) {
        case 'plaintext':
          await this._setupForPlaintext();
          break;
        default:
          await this._setupForMarkdown();
      }
      this._readiness.resolve();
    } catch (e) {
      this._readiness.reject(e);
    }
  }

  async _setupForMarkdown() {
    const context = await this._view._views._extensions.require('markdown');
    if (!this._view) {
      return; // destroyed
    }
    const cursorClass = cursorClassName(this.className);
    const { onDebug, onCitationLink, variant } = this.options;
    // TODO: options
    this._renderer = context.createRenderer({
      cursorClass,
      getSource: index => this._getSource(index),
      onCitationLink,
      onDebug: normalizeOnDebug(onDebug),
      variant,
    });
    // capture citation link click if necessary
    this._unsubscribes.push(this._view.proxyElement.on('click', (e) => this._onClick(e)));
  }

  _getSource(index) {
    const { data = {} } = this._view._data;
    const { sources = [] } = data;
    return sources[index];
  }

  async _setupForPlaintext() {
    this._renderer = new PlaintextRenderer();
  }

  async _ready() {
    return this._readiness.promise;
  }

  // render //
  async render(...args) {
    await this._ready();
    await super.render(...args);
  }

  _preprocess({ state }) {
    const prev = this._prevState;
    const { value = '', meta, session, status, ongoing } = state;
    const stage = meta && meta.answer_stage || 'result';
    const sameSession = fromSameSession(prev, state);
    const sameStreak = sameSession && (stage === prev.stage);
    const streak = !prev ? 0 : sameStreak ? prev.streak : prev.streak + 1;

    const doneAt = (sameSession && prev && prev.doneAt) || (status === STATUS.READY && !ongoing ? Date.now() : undefined);
    const done = doneAt !== undefined;

    return this._prevState = Object.freeze(trimObj({
      session,
      status,
      value,
      stage,
      streak,
      doneAt,
      done,
    }));
  }

  _render(element, { state, rendered }, { notifyUpdate, writeToState, loop }) {
    const container = containerElement(this, element, state);
    // TODO: distinguish between first render and element replacement
    let result;
    const newStreak = !rendered || state.streak !== rendered.streak;
    if (newStreak) {
      // new typing streak
      result = this._renderer.clear(container, rendered);
    } else {
      const cursor = this._getNextCursor(rendered.cursor, state.doneAt, rendered.timestamp, state.timestamp);
      result = this._renderer.update(container, rendered, { ...state, cursor });
    }
    writeToState(result);

    const ongoing = state.status === STATUS.READY && !result.done;
    // silence on consecutive ongoing renders
    const silent = ongoing && (!rendered || rendered.status === STATUS.READY) && !newStreak;
    notifyUpdate({ ongoing }, { silent });

    ongoing && loop();
  }

  // event //
  _onClick({ target }) {
    const element = target.closest(`[data-role="citation-link"]`);
    if (!element) {
      return;
    }
    const index = parseInt(element.dataset.index);
    if (Number.isNaN(index)) {
      return;
    }
    this._view._events.emit('citation-click', { index });
  }

}
