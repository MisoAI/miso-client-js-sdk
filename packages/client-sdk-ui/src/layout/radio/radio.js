import { findInAncestors, requestAnimationFrame as raf } from '@miso.ai/commons';
import { LAYOUT_CATEGORY } from '../../constants.js';
import TemplateBasedLayout from '../template.js';
import { requiresImplementation } from '../templates.js';

function root(layout) {
  const { className, role, templates } = layout;
  const roleAttr = role ? `data-role="${role}"` : '';
  return `
<div class="${className}" ${roleAttr}>
  ${templates.options(layout)}
</div>
`;
}

function option(layout, data) {
  const { className, templates } = layout;
  return `
<div role="button" class="${className}__option" data-value="${data.value}">
  ${templates.content(layout, data)}
</div>
`;
}

const DEFAULT_TEMPLATES = Object.freeze({
  ...requiresImplementation('options'),
  root,
  option,
});

export default class RadioLayout extends TemplateBasedLayout {

  static get category() {
    return LAYOUT_CATEGORY.RADIO;
  }

  static get defaultTemplates() {
    return DEFAULT_TEMPLATES;
  }

  constructor({ className, templates, field, defaultValue, ...options } = {}) {
    super({
      className,
      templates: { ...DEFAULT_TEMPLATES, ...templates },
      ...options,
    });
    this._field = field;
    this._defaultValue = defaultValue;
  }

  initialize(view) {
    const { proxyElement } = view;
    this._unsubscribes = [
      ...this._unsubscribes,
      view.hub.on(this._field, () => this._refresh()),
      proxyElement.on('click', (e) => this._handleClick(e)),
    ];
    this._defaultValue ? this._select(this._defaultValue) : this._clear();
  }

  _preprocess(states, controls) {
    if (states.rendered) {
      controls.skip(); // only render once
    }
    return super._preprocess(states, controls);
  }

  _handleClick({ target }) {
    const element = findInAncestors(target, (element) => element.hasAttribute('data-value') ? element : undefined);
    if (!element) {
      return;
    }
    let { unselected, value: oldValue } = this._view.hub.states[this._field];
    unselected = unselected || oldValue === undefined;
    const value = element.getAttribute('data-value');
    if (unselected || oldValue === undefined || oldValue !== value) {
      this._select(value);
    } else {
      this._clear();
    }
  }

  _refresh() {
    this._state = this._view.hub.states[this._field];
    raf(() => this._syncValueAttribute());
  }

  _syncValueAttribute() {
    if (!this._state || !this._view) {
      return;
    }
    const { element } = this._view;
    const root = element && element.children[0];
    if (!root) {
      return;
    }
    let { unselected, value } = this._state;
    if (unselected) {
      root.removeAttribute('data-selected');
    } else {
      root.setAttribute('data-selected', value);
    }
    this._state = undefined;
  }

  _select(value) {
    this._submit({ value });
  }

  _clear() {
    this._submit({ unselected: true });
  }

  async _submit(state) {
    this._view.hub.update(this._field, state);
  }

}
