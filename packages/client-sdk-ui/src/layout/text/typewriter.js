import { trimObj, requestAnimationFrame as raf } from '@miso.ai/commons';
import { LAYOUT_CATEGORY, STATUS } from '../../constants';
import TemplateBasedLayout from '../template';

const TYPE = 'typewriter';
const DEFAULT_CLASSNAME = 'miso-typewriter';

function root(layout) {
  const { className, role, options: { tag } } = layout;
  const roleAttr = role ? `data-role="${role}"` : '';
  return `<${tag} class="${className}" ${roleAttr}></${tag}>`;
}

const DEFAULT_TEMPLATES = Object.freeze({
  root,
});

const INHERITED_DEFAULT_TEMPLATES = Object.freeze({
  ...TemplateBasedLayout.defaultTemplates,
  ...DEFAULT_TEMPLATES,
});

function sameSession(a, b) {
  return a && b && a.session && b.session && a.session.id === b.session.id;
}

export default class TypewriterLayout extends TemplateBasedLayout {

  static get category() {
    return LAYOUT_CATEGORY.TEXT;
  }

  static get type() {
    return TYPE;
  }

  static get defaultTemplates() {
    return INHERITED_DEFAULT_TEMPLATES;
  }

  static get defaultClassName() {
    return DEFAULT_CLASSNAME;
  }

  constructor({ className = DEFAULT_CLASSNAME, templates, cps = 75, tag = 'p', ...options } = {}) {
    super(className, { ...DEFAULT_TEMPLATES, ...templates }, { cps, tag, ...options });
  }

  initialize(view) {
    this._view = view;
  }

  async render(_, state, { silence }) {
    this._updateInput(state);
    this._requestLoop();
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
    return element.children[0];
  }

  _updateInput(state) {
    const prev = this._input;
    const { value: text = '', session } = state;
    const incremental = sameSession(prev, state) && text && text.startsWith(prev.text);
    const streak = !prev ? { index: 0 } : incremental ? prev.streak : { index: prev.streak.index + 1 };
    const doneAt = (prev && prev.done) || (state.status === STATUS.READY && !state.ongoing ? Date.now() : undefined);
    const done = doneAt !== undefined;

    this._input = trimObj({
      session,
      text,
      streak,
      doneAt,
      done,
    });
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
      const { session, done } = this._rendered = this._updateText(element, this._rendered, this._input);
      if (done) {
        this._looping = false;
      }
      this._view.updateState({ session }, { silent: !done });
      this._raf();
    });
  }

  _cps(input, now) {
    let cps = this.options.cps * (Math.random() + 0.5);
    if (input.done) {
      // speed up gradually when input is done
      cps *= (now - input.doneAt) / 250;
    }
    return cps;
  }

  _updateText(element, rendered, input) {
    const timestamp = Date.now();
    if (!rendered || input.streak.index !== rendered.streak.index) {
      // new typing streak
      element.innerHTML = '';
      return {
        timestamp,
        streak: {
          ...input.streak,
          start: timestamp,
          cursor: 0,
        },
        done: false,
      };
    }

    // incremental typing
    const cps = this._cps(input, timestamp);
    const chars = Math.floor((timestamp - rendered.timestamp) * cps / 1000);
    if (chars <= 0) {
      return {
        timestamp,
        streak: rendered.streak,
        done: false,
      };
    }
    const fullLength = input.text.length;
    const prevCursor = rendered.streak.cursor;
    const cursor = Math.min(fullLength, prevCursor + chars);
    const done = !!input.done && (cursor === fullLength);
    if (done) {
      element.innerHTML = input.text;
      element.classList.add('done');
    } else {
      const text = input.text.substring(prevCursor, cursor);
      element.insertAdjacentHTML('beforeend', text);
    }
    return {
      timestamp,
      streak: {
        ...rendered.streak,
        cursor,
      },
      done,
    };
  }

}
