import { escapeHtml } from '@miso.ai/commons';
import { LAYOUT_CATEGORY } from '../../constants.js';
import { fields } from '../../actor/index.js';
import TemplateBasedLayout from '../template.js';
import { makeTrackable } from '../trackable.js';

const TYPE = 'option-list';
const DEFAULT_CLASSNAME = 'miso-option-list';

function root(layout, state) {
  const { className, role, templates } = layout;
  const roleAttr = role ? `data-role="${role}"` : '';
  return `
<div class="${className}" ${roleAttr}>
  ${templates.options(layout, state)}
</div>
`;
}

function options(layout, state) {
  const { className, templates } = layout;
  const values = state.value || [];
  return `
<ol class="${className}__options" data-role="options">
  ${values.map((value, index) => templates.option(layout, value, { index })).join('')}
</ol>
`;
}

function option(layout, value) {
  const { className } = layout;
  const text = escapeHtml(value.text || value);
  return `<li class="${className}__option" data-role="option" tabindex="0">${text}</li>`;
}

const DEFAULT_TEMPLATES = Object.freeze({
  root,
  options,
  option,
});

export default class OptionListLayout extends TemplateBasedLayout {

  static get category() {
    return LAYOUT_CATEGORY.QUERY;
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

  constructor({ className = DEFAULT_CLASSNAME, templates, ...options } = {}) {
    super({
      className,
      templates: { ...DEFAULT_TEMPLATES, ...templates },
      ...options,
    });
    this._initTrackable();
  }

  initialize(view) {
    this._view = view;
    const { proxyElement, hub } = view;
    this._unsubscribes = [
      ...this._unsubscribes,
      proxyElement.on('click', (e) => this._handleClick(e)),
      hub.on(fields.suggestions(), () => this._handleInput()),
    ];
  }

  _preprocess() {
    return super._preprocess({
      state: this._view.hub.states[fields.suggestions()],
    });
  }

  _render(element, data, controls) {
    super._render(element, data, controls);
    const { state } = data;
    this._syncBindings(element, state);
    this._syncOptionValues(element, state);
  }

  _unrender() {
    this._clearBindings();
  }

  _syncOptionValues(element, state) {
    const optionsElement = element && this._getOptionsElement(element);
    if (!optionsElement) {
      return;
    }
    const optionValues = this._getItems(state) || [];
    optionsElement.classList[optionValues.length === 0 ? 'add' : 'remove']('empty');
  }

  _getItems(state) {
    return state.value;
  }

  _getOptionsElement(element) {
    return element.querySelector(`[data-role="options"]`);
  }

  _getItemElements(element) {
    return element ? Array.from(element.querySelectorAll(`[data-role="option"]`)) : [];
  }

  _handleClick(event) {
    const element = event.target.closest(`[data-role="option"]`);
    if (!element) {
      return;
    }
    const binding = this._bindings.get(element);
    const option = binding && binding.value;
    if (!option) {
      return;
    }
    this._trackClick(event, binding);
    this._submit(option.text);
  }

  async _submit(value) {
    if (!value) {
      return;
    }
    // TODO: q -> value
    this._view.hub.trigger(fields.query(), { q: value });
  }

  destroy() {
    this._destroyTrackable();
    this._view = undefined;
    super.destroy();
  }

}

makeTrackable(OptionListLayout.prototype);
