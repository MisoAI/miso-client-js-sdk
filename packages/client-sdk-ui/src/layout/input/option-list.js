import { defineValues, escapeHtml } from '@miso.ai/commons';
import { LAYOUT_CATEGORY } from '../../constants.js';
import { fields } from '../../actor/index.js';
import TemplateBasedLayout from '../template.js';

const OPTION_VALUE = Symbol.for('miso.option-value');

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
    defineValues(this, {
      bindings: Object.freeze({
        list: this._listBindings.bind(this),
      }),
    });
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
    this._syncOptionValues(element, data);
  }

  _syncOptionValues(element, { state }) {
    if (!element) {
      return;
    }
    const optionsElement = this._getOptionsElement(element);
    if (!optionsElement) {
      return;
    }
    const optionValues = state.value || [];
    optionsElement.classList[optionValues.length === 0 ? 'add' : 'remove']('empty');
    let i = 0;
    for (const optionElement of this._listOptionElements(optionsElement)) {
      optionElement[OPTION_VALUE] = optionValues[i++];
    }
  }

  _listBindings(rootElement) {
    if (!rootElement) {
      return [];
    }
    const optionsElement = this._getOptionsElement(rootElement);
    const bindings = [];
    for (const element of this._listOptionElements(optionsElement)) {
      const value = element[OPTION_VALUE];
      if (!value) {
        continue;
      }
      const key = value.text || value;
      bindings.push({ key, value, element });
    }
    return bindings;
  }

  _getOptionsElement(element) {
    return element.querySelector(`[data-role="options"]`);
  }

  _listOptionElements(optionsElement) {
    return optionsElement ? Array.from(optionsElement.querySelectorAll(`[data-role="option"]`)) : [];
  }

  _handleClick(e) {
    for (let element = e.target; element && element !== this._view.element; element = element.parentElement) {
      const option = element[OPTION_VALUE];
      if (!option) {
        continue;
      }
      this._submit(option.text);
      return;
    }
  }

  async _submit(value) {
    if (!value) {
      return;
    }
    // TODO: q -> value
    this._view.hub.trigger(fields.query(), { q: value });
  }

}
