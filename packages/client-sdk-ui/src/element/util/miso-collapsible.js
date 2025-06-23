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

const CLICKABLES = [
  { role: 'expand', action: 'expand' },
  { role: 'collapse', action: 'collapse' },
  { role: 'toggle-expand', action: 'toggleExpand' },
];

export default class MisoCollapsibleElement extends MisoUtilityElement {

  static get tagName() {
    return TAG_NAME;
  }

  constructor() {
    super({
      actions: Object.keys(ACTIONS),
      clickables: CLICKABLES,
    });
  }

  // lifecycle //
  toggleExpand() {
    this.expanded ? this.collapse() : this.expand();
  }
  
}

defineStatusGetters(MisoCollapsibleElement.prototype, [STATUS_EXPANDED, STATUS_HIDDEN]);

for (const [method, [action, status]] of Object.entries(ACTIONS)) {
  MisoCollapsibleElement.prototype[method] = function() {
    this.classList[action](status);
    this[`_${method}`] && this[`_${method}`]();
  };
}
