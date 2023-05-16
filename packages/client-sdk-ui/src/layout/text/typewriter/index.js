import { trimObj, requestAnimationFrame as raf } from '@miso.ai/commons';
import { LAYOUT_CATEGORY, STATUS } from '../../../constants';
import TemplateBasedLayout from '../../template';
import ProgressController from './progress';
import PlaintextRenderer from './plaintext';

const TYPE = 'typewriter';
const DEFAULT_CLASSNAME = 'miso-typewriter';

function cursorClassName(className) {
  return `${className}__cursor`;
}

function root(layout) {
  let { className, role, options: { tag, format, builtInStyles = true } } = layout;
  if (tag === 'auto') {
    tag = format === 'markdown' ? 'div' : 'p';
  }
  const roleAttr = role ? `data-role="${role}"` : '';
  const classNames = [className, cursorClassName(className)];
  if (builtInStyles && format === 'markdown') {
    classNames.push('miso-markdown');
  }
  return `<${tag} class="${classNames.join(' ')}" ${roleAttr} data-format="${format}"></${tag}>`;
}

const DEFAULT_TEMPLATES = Object.freeze({
  root,
});

function areFromSameSession(a, b) {
  return a && b && a.session && b.session && a.session.uuid === b.session.uuid;
}

export default class TypewriterLayout extends TemplateBasedLayout {

  static get category() {
    return LAYOUT_CATEGORY.TEXT;
  }

  static get type() {
    return TYPE;
  }

  static get defaultTemplates() {
    return DEFAULT_TEMPLATES;
  }

  static get defaultClassName() {
    return DEFAULT_CLASSNAME;
  }

  constructor({
    className = DEFAULT_CLASSNAME,
    templates,
    cps,
    tag = 'auto',
    format = 'markdown',
    ...options
  } = {}) {
    super({
      className,
      templates: { ...DEFAULT_TEMPLATES, ...templates },
      cps,
      tag,
      format,
      ...options,
    });
    this._states = new WeakMap();
    this._progress = new ProgressController({ cps });
    if (format === 'markdown') {
      MisoClient.plugins.install('std:ui-markdown');
    }
  }

  initialize(view) {
    this._view = view;
    switch (this.options.format) {
      case 'plaintext':
        this._setupForPlaintext();
        break;
      default:
        this._setupForMarkdown();
    }
  }

  async _setupForMarkdown() {
    const context = await this._view._views._extensions.require('markdown');
    const cursorClass = cursorClassName(this.className);
    // TODO: options
    this._renderer = context.createRenderer({
      onRefChange: (oldRef, newRef) => {
        oldRef && oldRef.classList.remove(cursorClass);
        newRef && newRef.classList.add(cursorClass);
      }, 
      onDone: (element) => {
        element.classList.add('done');
      },
      onDebug: ({ index, ref, operation, cursors, conflict, tree }) => {
        console.log(`[${index}] ${cursors[0]} -> ${cursors[1]}${ conflict !== undefined ? ` !${conflict.index}` : '' } / ${tree.rightBound}`, ref, `${operation}`, conflict);
      },
    });
    // TODO: we may want to put readiness resolution here
  }

  _setupForPlaintext() {
    this._renderer = new PlaintextRenderer();
  }

  async render(_, state, { silence }) {
    await this._ready(); // TODO: just check readiness at raf()?
    this._updateInput(state);
    if (state.status === STATUS.READY) {
      this._requestLoop();
    }
    silence(); // skip notify view update here and do so manually
  }

  _getContentElement() {
    const element = this._view.element;
    if (!element) {
      return undefined;
    }
    if (element.children.length === 0) {
      element.innerHTML = this.templates.root(this);
    }
    const content = element.children[0];
    content.setAttribute('data-status', this._input.status || STATUS.INITIAL);
    return content;
  }

  async _ready() {
    if (this.options.format === 'markdown') {
      await MisoClient.plugins.whenInstalled('std:ui-markdown');
    }
  }

  _updateInput(state) {
    const prev = this._input;
    const { value: text = '', meta, session, status } = state;
    // TODO: might not always share same prefix, get streak from state
    const stage = meta && meta.answer_stage || 'result';
    const sameSession = areFromSameSession(prev, state);
    const sameStreak = sameSession && (stage === prev.stage);
    const streak = !prev ? 0 : sameStreak ? prev.streak : prev.streak + 1;

    const doneAt = (sameSession && prev && prev.doneAt) || (state.status === STATUS.READY && !state.ongoing ? Date.now() : undefined);
    const done = doneAt !== undefined;

    this._input = Object.freeze(trimObj({
      session,
      status,
      text,
      stage,
      streak,
      doneAt,
      done,
    }));
  }

  _requestLoop() {
    if (this._looping) {
      return;
    }
    this._looping = true;
    this._raf();
  }

  async _raf() {
    if (!this._looping) {
      return;
    }
    raf(() => {
      const element = this._getContentElement();
      const { session, done } = this._updateText(element, this._input);
      if (done) {
        this._looping = false;
      }
      this._view.updateState({ session }, { silent: !done });
      this._raf();
    });
  }

  _getState(element) {
    return this._states.get(element);
  }

  _setState(element, state) {
    this._states.set(element, Object.freeze(state));
    return state;
  }

  _updateText(element, input) {
    const timestamp = Date.now();
    const prevState = this._getState(element);

    let result;
    // TODO: distinguish between first render and element replacement
    if (!prevState || input.streak !== prevState.input.streak) {
      // new typing streak
      result = this._renderer.clear(element, prevState);
    } else {
      const cursor = this._progress.get(prevState, { input, timestamp });
      result = this._renderer.update(element, prevState, { input, timestamp, cursor });
    }

    this._setState(element, {
      timestamp,
      input,
      ...result,
    });
    const { session } = input;
    const { done } = result;
    return { session, done };
  }

}
