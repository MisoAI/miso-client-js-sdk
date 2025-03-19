import { CLASS_PREFIX } from './constants.js';
import { STATUS } from '../../constants.js';
import { fields } from '../../actor/index.js';
import { showMore as DEFAULT_PHRASE_SHOW_MORE, showLess as DEFAULT_PHRASE_SHOW_LESS } from './phrases.js';

const CLASS_OPEN = 'answer-box-open';
const CLASS_SHOWN = 'answer-box-shown';
const TOGGLE_BUTTON_SELECTOR = '[data-role="answer-box-toggle"]';

export default class AnswerBox {

  constructor(client, element, { classPrefix = CLASS_PREFIX, phrases = {}, hideWhenUnanswerable = true } = {}) {
    this._client = client;
    this._workflow = client.ui.hybridSearch;
    this._element = element;
    this._classPrefix = classPrefix;
    this._phrases = phrases;
    this._hideWhenUnanswerable = hideWhenUnanswerable;
    this._init();
  }

  _init() {
    const element = this._element;
    const workflow = this._workflow;

    // expose widget API
    workflow.answerBox = this;
    workflow._unsubscribes.push(() => {
      if (workflow.answerBox === this) {
        this.destroy();
        workflow.answerBox = undefined;
      }
    });

    // handle toggle button clicks
    const callback = event => this._handleClick(event);
    element.addEventListener('click', callback);

    // sync state
    this._syncWofkflowStatus();
    this._syncButtonText();

    this._unsubscribes = [
      () => element.removeEventListener('click', callback),
      // cling to data rather than view, as we may miss view event when tab is inactive due to raf
      workflow._answer._hub.on(fields.data(), () => this._syncWofkflowStatus()),
    ];
  }

  _handleClick({ target, button }) {
    // only left click
    if (button !== 0) {
      return;
    }
    if (target.closest(TOGGLE_BUTTON_SELECTOR)) {
      this.toggleOpen();
    }
  }

  _syncWofkflowStatus() {
    const { status } = this._workflow._answer;
    const { meta: { unanswerable = false } = {} } = this._workflow._answer._hub.states[fields.data()];

    switch (status) {
      case STATUS.ERRONEOUS:
      case STATUS.READY:
        if (unanswerable && this._hideWhenUnanswerable) {
          this.hide();
        } else {
          this.show();
        }
        break;
      default:
        this.hide();
    }
  }

  _updateBoxStatus(method, className) {
    this._element.classList[method](`${this._classPrefix}__${className}`);
  }

  _syncButtonText() {
    const phrase = this.isOpen ? this._phrases.showLess || DEFAULT_PHRASE_SHOW_LESS : this._phrases.showMore || DEFAULT_PHRASE_SHOW_MORE;
    for (const button of this._element.querySelectorAll(TOGGLE_BUTTON_SELECTOR)) {
      button.textContent = phrase;
    }
  }

  _syncScroll() {
    if (!this.isOpen) {
      this._element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  destroy() {
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    const workflow = this._workflow;
    if (workflow && workflow.answerBox === this) {
      delete workflow.answerBox;
    }
  }

}

const GETTERS = {
  isOpen: CLASS_OPEN,
  shown: CLASS_SHOWN,
};

const METHODS = {
  toggleOpen: ['toggle', CLASS_OPEN],
  open: ['open', CLASS_OPEN],
  close: ['remove', CLASS_OPEN],
  toggleHidden: ['toggle', CLASS_SHOWN],
  show: ['add', CLASS_SHOWN],
  hide: ['remove', CLASS_SHOWN],
};

for (const [prop, className] of Object.entries(GETTERS)) {
  Object.defineProperty(AnswerBox.prototype, prop, {
    get() {
      return this._element.classList.contains(`${this._classPrefix}__${className}`);
    },
  });
}

for (const [method, [action, className]] of Object.entries(METHODS)) {
  AnswerBox.prototype[method] = function() {
    this._updateBoxStatus(action, className);
    if (className === CLASS_OPEN) {
      this._syncButtonText();
      this._syncScroll();
    }
  };
}
