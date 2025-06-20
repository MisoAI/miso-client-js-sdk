import MisoUtilityElement from './miso-utility.js';
import { defineStatusGetters } from '../utils.js';

const TAG_NAME = 'miso-collapsible';

const STATUS_EXPANDED = 'expanded';
const STATUS_HIDDEN = 'hidden';

const ACTIONS = {
  expand: ['add', STATUS_EXPANDED],
  collapse: ['remove', STATUS_EXPANDED],
  hide: ['add', STATUS_HIDDEN],
  show: ['remove', STATUS_HIDDEN],
};

const EXPAND_BUTTON_SELECTOR = '[data-role="expand"]';
const COLLAPSE_BUTTON_SELECTOR = '[data-role="collapse"]';
const TOGGLE_EXPAND_BUTTON_SELECTOR = '[data-role="toggle-expand"]';

export default class MisoCollapsibleElement extends MisoUtilityElement {

  static get tagName() {
    return TAG_NAME;
  }

  constructor() {
    super({
      actions: Object.keys(ACTIONS),
    });
  }

  // lifecycle //
  async connectedCallback() {
    super.connectedCallback();
    const handleClick = event => this._handleClick(event);
    this.addEventListener('click', handleClick);
    this._unsubscribes.push(() => this.removeEventListener('click', handleClick));
  }

  toggleExpand() {
    this.expanded ? this.collapse() : this.expand();
  }
  
  _handleClick({ target, button }) {
    // only left click
    if (button !== 0) {
      return;
    }
    if (target.closest(EXPAND_BUTTON_SELECTOR)) {
      this.expand();
    } else if (target.closest(COLLAPSE_BUTTON_SELECTOR)) {
      this.collapse();
    } else if (target.closest(TOGGLE_EXPAND_BUTTON_SELECTOR)) {
      this.toggleExpand();
    }
  }

}

defineStatusGetters(MisoCollapsibleElement.prototype, [STATUS_EXPANDED, STATUS_HIDDEN]);

for (const [method, [action, status]] of Object.entries(ACTIONS)) {
  MisoCollapsibleElement.prototype[method] = function() {
    this.classList[action](status);
    this[`_${method}`] && this[`_${method}`]();
  };
}
