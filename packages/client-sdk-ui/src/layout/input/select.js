import { escapeHtml, kebabOrSnakeToHuman } from '@miso.ai/commons';
import TemplateBasedLayout from '../template.js';
import { makeTrackable } from '../mixin/trackable.js';

const TYPE = 'select';
const DEFAULT_CLASSNAME = 'miso-select';

function root(layout, state) {
  const { className, role, templates } = layout;
  const roleAttr = role ? `data-role="${role}"` : '';
  const values = layout._getItems(state);
  const selected = values.find(value => value.selected) || values[0];
  return `
<div class="${className}" ${roleAttr}>
  ${templates.button(layout, selected)}
  ${templates.options(layout, state)}
</div>`;
}

function button(layout, value) {
  const { className, templates } = layout;
  return `<button class="${className}__button" data-role="button" tabindex="0">${templates.text(layout, value)}</button>`;
}

function options(layout, state) {
  const { className, templates } = layout;
  const values = layout._getItems(state);
  return `<ul class="${className}__options">${values.map((value, index) => templates.option(layout, value, { index })).join('')}</ul>`;
}

function option(layout, value) {
  const { className, templates } = layout;
  const selectedClass = value.selected ? 'selected' : '';
  return `<li class="${className}__option ${selectedClass}" data-role="option" tabindex="0">${templates.text(layout, value)}</li>`;
}

function text(layout, value) {
  return escapeHtml(value && value.text && kebabOrSnakeToHuman(value.text) || value || '');
}

const DEFAULT_TEMPLATES = Object.freeze({
  root,
  button,
  options,
  option,
  text,
});

export default class SelectLayout extends TemplateBasedLayout {

  static get type() {
    return TYPE;
  }

  static get defaultTemplates() {
    return DEFAULT_TEMPLATES;
  }

  static get defaultClassName() {
    return DEFAULT_CLASSNAME;
  }

  constructor({ className = DEFAULT_CLASSNAME, templates, ...options } = {}) {
    super({
      className,
      templates: { ...DEFAULT_TEMPLATES, ...templates },
      ...options,
    });
    this._initTrackable();
  }

  initialize(view) {
    const { proxyElement } = view;
    this._unsubscribes = [
      ...this._unsubscribes,
      proxyElement.on('click', (e) => this._handleClick(e)),
    ];
  }

  _afterRender(element, state) {
    this._syncBindings(element, state);

  }

  _unrender() {
    this._clearBindings();
  }

  _getItems(state) {
    return state.value || [];
  }

  _getOptionsElement(element) {
    return element.querySelector(`[data-role="options"]`);
  }

  _getItemElements(element) {
    return element ? Array.from(element.querySelectorAll(`[data-role="option"]`)) : [];
  }

  _handleClick(event) {
    if (!this._element) {
      return;
    }
    for (let element = event.target; element && element !== this._element; element = element.parentElement) {
      const { role } = element.dataset;
      switch (role) {
        case 'button':
          this._toggle();
          break;
        case 'option':
          const binding = this._bindings.get(element);
          this._select(binding && binding.value);
          break;
      }
    }
  }

  _toggle() {
    if (!this._element) {
      return;
    }
    const child = this._element.children[0];
    child && child.classList.toggle('open');
  }

  async _select(value) {
    if (!value) {
      return;
    }
    // TODO: reflect selection right away
    this._view._emit('select', { value });
  }

  destroy() {
    this._destroyTrackable();
    super.destroy();
  }

}

makeTrackable(SelectLayout.prototype);
