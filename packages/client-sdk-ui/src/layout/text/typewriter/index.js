import { trimObj, defineValues, Resolution } from '@miso.ai/commons';
import { LAYOUT_CATEGORY, STATUS } from '../../../constants.js';
import ProgressiveLayout from '../../progressive.js';
import ProgressController from './progress.js';
import PlaintextRenderer from './plaintext.js';
import { containerElement, cursorClassName, fromSameSession } from './utils.js';

const TYPE = 'typewriter';
const DEFAULT_CLASSNAME = 'miso-typewriter';

export default class TypewriterLayout extends ProgressiveLayout {

  static get category() {
    return LAYOUT_CATEGORY.TEXT;
  }

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
    this._progress = new ProgressController(options);
    this._readiness = new Resolution();

    // kick off sooner
    if (format === 'markdown') {
      TypewriterLayout.MisoClient.plugins.install('std:ui-markdown');
    }
  }

  initialize(view) {
    this._view = view;
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
    const cursorClass = cursorClassName(this.className);
    const { onDebug } = this.options;
    // TODO: options
    this._renderer = context.createRenderer({
      onRefChange: (oldRef, newRef) => {
        oldRef && oldRef.classList.remove(cursorClass);
        newRef && newRef.classList.add(cursorClass);
      }, 
      onDone: (element) => {
        element.classList.add('done');
      },
      onDebug,
      onCitationLink: this._handleCitationLink.bind(this),
    });
    // capture citation link click if necessary
    this._unsubscribes.push(this._view.proxyElement.on('click', (e) => this._handleClick(e)));
  }

  _handleCitationLink(methods, index) {
    const { onCitationLink } = this.options;
    if (typeof onCitationLink !== 'function') {
      return;
    }
    const { data = {} } = this._view._data;
    const { sources = [] } = data;
    const source = sources[index];
    try {
      onCitationLink(methods, { source, index });
    } catch (e) {
      console.error(e);
    }
  }

  /*
  _handleCitationTooltip({ node, tooltip, index }) {
    const { tooltip: tooltipOptions } = this.options;
    if (!tooltipOptions || !tooltip || tooltip.properties['data-value']) {
      return;
    }
    const { data = {} } = this._view._data;
    const { sources = [] } = data;
    const source = sources[index];
    if (!source) {
      return;
    }
    // TODO: allow HTML
    let value;
    try {
      value = typeof tooltipOptions === 'function' ? tooltipOptions(source) : source.title;
    } catch (e) {
      console.error(e);
    }
    if (!value) {
      return;
    }
    tooltip.properties['data-value'] = escapeHtml(value);
  }
  */

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
    if (!rendered || state.streak !== rendered.streak) {
      // new typing streak
      result = this._renderer.clear(container, rendered);
    } else {
      const cursor = this._progress.get(rendered, state);
      result = this._renderer.update(container, rendered, { ...state, cursor });
    }
    writeToState(result);

    const ongoing = state.status === STATUS.READY && !result.done;
    // silence on consecutive ongoing renders
    const silent = ongoing && (!rendered || rendered.status === STATUS.READY);
    notifyUpdate({ ongoing }, { silent });

    ongoing && loop();
  }

  // event //
  _handleClick({ target }) {
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
