import { defineStatusGetters, defineActions, defineClickables, listenToClickables } from './helpers.js';

const CLASS_NAME = 'miso-collapsible';
const STATUS_EXPANDED = 'expanded';

const ACTIONS = [
  { action: 'expand', classAction: 'add', className: STATUS_EXPANDED },
  { action: 'collapse', classAction: 'remove', className: STATUS_EXPANDED },
];

const CLICKABLES = [
  { role: 'expand', action: 'expand' },
  { role: 'collapse', action: 'collapse' },
  { role: 'toggle-expand', action: 'toggle' },
];

export default class CollapsibleTrait {

  static get traitName() {
    return 'collapsible';
  }

  constructor(element) {
    this._element = element;
    element.collapsible = this;
    element.classList.add(CLASS_NAME);
    this._unsubscribes = [
      listenToClickables(this),
    ];
  }

  _destroy() {
    for (const unsubscribe of this._unsubscribes || []) {
      unsubscribe();
    }
    this._unsubscribes = [];
    delete this._element.collapsible;
    this._element.classList.remove(CLASS_NAME);
    this._element = undefined;
  }

  // api //
  toggle() {
    this.expanded ? this.collapse() : this.expand();
  }

}

defineStatusGetters(CollapsibleTrait.prototype, [STATUS_EXPANDED]);
defineActions(CollapsibleTrait.prototype, ACTIONS);
defineClickables(CollapsibleTrait.prototype, CLICKABLES);
