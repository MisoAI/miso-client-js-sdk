import { LAYOUT_CATEGORY } from '../../constants.js';
import { fields } from '../../actor/index.js';
import TemplateBasedLayout from '../template.js';
import { SEND, SEARCH } from '../../asset/svgs.js';

const TYPE = 'search-box';
const DEFAULT_CLASSNAME = 'miso-search-box';

function root(layout) {
  const { className, role, templates, options, workflow } = layout;
  const { autocomplete, placeholder, buttonText } = options;
  const roleAttr = role ? `data-role="${role}"` : '';
  const buttonContent = buttonText || workflow === 'search' ? SEARCH : SEND;
  return `
<div class="${className}" ${roleAttr}>
  <div class="${className}__input-group">
    <input class="${className}__input" type="text" data-role="input" ${placeholder ? `placeholder="${placeholder}"` : ''}>
    <button class="${className}__button" type="submit" data-role="button">${buttonContent}</button>
  </div>
  ${autocomplete ? templates.autocomplete(layout) : ''}
</div>
`;
}

function autocomplete(layout) {
  const { className, templates } = layout;
  return `
<div class="${className}__autocomplete" data-role="autocomplete">
  ${templates.suggestionList(layout)}
</div>
`;
}

function suggestionList(layout) {
  const { className } = layout;
  return `<ol class="${className}__suggestion-list" data-role="suggestion-list"></ol>`;
}

function suggestionItem(layout, value) {
  const { className } = layout;
  const text = value.text || value;
  return `<li class="${className}__suggestion-item" data-role="suggestion-item" tabindex="0">${text}</li>`;
}

const DEFAULT_TEMPLATES = Object.freeze({
  root,
  autocomplete,
  suggestionList,
  suggestionItem,
});

export default class SearchBoxLayout extends TemplateBasedLayout {

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
    this._contexts = new WeakMap();
    this._suggestionItems = new WeakMap(); // TODO: put them on elements as layout can be potentially replaced
  }

  initialize(view) {
    const { autocomplete } = this.options;
    this._view = view;
    const { proxyElement, hub } = view;
    this._unsubscribes = [
      ...this._unsubscribes,
      proxyElement.on('keydown', (e) => this._handleKeyDown(e)),
      proxyElement.on('click', (e) => this._handleClick(e)),
    ];
    if (autocomplete) {
      this._unsubscribes.push(hub.on(fields.suggestions(), () => this._handleInput()));
    }
  }

  _preprocess({ state }) {
    state = super._preprocess({ state });
    const { autocomplete } = this.options;
    if (!autocomplete) {
      return state;
    }
    const suggestions = this._view.hub.states[fields.suggestions()];
    return { ...state, suggestions };
  }

  _render(element, data, controls) {
    if (element.childElementCount === 0) {
      // only render the template once, and also skip if there are children already to allow customized DOM
      super._render(element, data, controls);
    }
    this._setupAutocomplete(element);
    this._renderSuggestions(element, data, controls);
  }

  _setupAutocomplete(element) {
    const { autocomplete } = this.options;
    if (!autocomplete) {
      return;
    }
    this._context(element).setupAutocomplete();
  }

  _renderSuggestions(element, { state }, { writeToState } = {}) {
    const { autocomplete } = this.options;
    if (!autocomplete) {
      return;
    }

    const { suggestionListElement, autocompleteElement } = this._context(element);
    if (!suggestionListElement) {
      // not actually rendered
      writeToState && writeToState({ suggestions: { value: [] } });
      return;
    }

    // TODO: incremental
    const { suggestions = {} } = state;
    const suggestionItems = suggestions.value || [];
    autocompleteElement.classList[suggestionItems.length === 0 ? 'add' : 'remove']('empty');
    suggestionListElement.innerHTML = suggestionItems.map((suggestion) => this.templates.suggestionItem(this, suggestion)).join('');
    let i = 0;
    for (const itemElement of suggestionListElement.children) {
      this._suggestionItems.set(itemElement, suggestionItems[i++]);
    }
  }

  _context(element) {
    element = element || this._view.element;
    if (!element) {
      return Context.empty();
    }
    let context = this._contexts.get(element);
    if (!context) {
      this._contexts.set(element, context = new Context(element));
    }
    return context;
  }

  _handleKeyDown({ key, target, isComposing }) {
    if (!isComposing && key === 'Enter' && target.matches('input')) {
      this._submit(target.value);
      target.blur();
    }
  }

  _handleClick({ target }) {
    const { inputElement } = this._context();
    for (let element = target; element && element !== this._view.element; element = element.parentElement) {
      if (element.matches('[type="submit"]') || element.matches('[data-role="button"]')) {
        if (inputElement) {
          inputElement.blur();
          this._submit(inputElement.value);
        }
        return;
      }
    }
    const { autocomplete } = this.options;
    if (!autocomplete) {
      return;
    }
    for (let element = target; element && element !== this._view.element; element = element.parentElement) {
      const suggestion = this._suggestionItems.get(element);
      if (!suggestion) {
        continue;
      }
      const value = suggestion.text || suggestion;
      if (inputElement) {
        inputElement.value = value;
      }
      this._submit(value);
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

class Context {

  static empty() {
    return Context._empty || (Context._empty = new Context());
  }

  constructor(element) {
    this._element = element;
    this._cache = {};
  }

  get inputElement() {
    return this._get('input');
  }

  get autocompleteElement() {
    return this._get('autocomplete');
  }

  get suggestionListElement() {
    return this._get('suggestion-list');
  }

  setupAutocomplete() {
    if (!this._element || this._autocompleteSetup) {
      return;
    }
    this._autocompleteSetup = true;
    const { inputElement, autocompleteElement } = this;
    if (inputElement && autocompleteElement) {
      // TODO: should we clean up
      inputElement.addEventListener('focus', () => {
        autocompleteElement.classList.add('open');
      });
      inputElement.addEventListener('blur', () => {
        autocompleteElement.classList.remove('open');
      });
    }
  }

  _get(role) {
    return !this._element ? undefined : this._cache[role] || (this._cache[role] = this._element.querySelector(`[data-role="${role}"]`));
  }

}
