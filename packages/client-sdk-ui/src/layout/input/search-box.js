import { defineValues, escapeHtml, findInAncestors, debounce } from '@miso.ai/commons';
import { LAYOUT_CATEGORY, STATUS } from '../../constants.js';
import { fields } from '../../actor/index.js';
import TemplateBasedLayout from '../template.js';
import { helpers, imageBlock, productInfoBlock } from '../templates.js';
import { SEND, SEARCH } from '../../asset/svgs.js';

const TYPE = 'search-box';
const DEFAULT_CLASSNAME = 'miso-search-box';
const DEFAULT_AUTOCOMPLETE_CLASSNAME = 'miso-autocomplete';

function root(layout) {
  const { className, role, options, workflow, autocomplete } = layout;
  const { placeholder, buttonText } = options;
  const roleAttr = role ? `data-role="${role}"` : '';
  const buttonContent = buttonText || workflow === 'search' ? SEARCH : SEND;
  return `
<div class="${className}" ${roleAttr}>
  <div class="${className}__input-group">
    <input class="${className}__input" type="text" data-role="input" ${placeholder ? `placeholder="${placeholder}"` : ''}>
    <button class="${className}__button" type="submit" data-role="submit">${buttonContent}</button>
  </div>
  <div class="${autocomplete.className}" data-role="autocomplete"></div>
</div>`.trim();
}

function completions(layout, items) {
  const { templates, workflow, autocomplete } = layout;
  // use options under layout.autocomplete from now on
  layout = {
    templates,
    workflow,
    ...autocomplete,
  };

  const products = [], queries = [];
  for (const item of items) {
    (item.product ? products : queries).push(item);
  }

  return templates.queries(layout, queries) + (queries.length > 0 && products.length > 0 ? `<hr>` : '') + templates.products(layout, products);
}

function queries(layout, items) {
  const { templates } = layout;
  return templates.completionList(layout, 'query', items);
}

function products(layout, items) {
  const { templates } = layout;
  return templates.completionList(layout, 'product', items);
}

function query(layout, { text, text_with_inverted_markups } = {}) {
  return text_with_inverted_markups || escapeHtml(text);
}

function product(layout, { product }) {
  const { templates } = layout;
  const [openTag, closeTag] = helpers.tagPair(layout, product, { role: false });
  return [
    openTag,
    templates.imageBlock(layout, product),
    templates.productInfoBlock(layout, product),
    closeTag,
  ].join('');
}

function completionList(layout, type, items) {
  const { className, templates } = layout;
  return `
<ul class="${className}__${type}-list" data-role="${type}-list">
  ${items.map(item => templates.completionItem(layout, type, item)).join('')}
</ul>`.trim();
}

function completionItem(layout, type, item) {
  const { className, templates } = layout;
  return `
<li class="${className}__${type}-item" data-role="${type}-item" data-index="${item._index}" tabindex="0">
  ${templates[type](layout, item)}
</li>`.trim();
}

const DEFAULT_TEMPLATES = Object.freeze({
  root,
  completions,
  completionList,
  completionItem,
  queries,
  products,
  query,
  product,
  imageBlock,
  productInfoBlock,
  helpers,
});

const DEFAULT_AUTOCOMPLETE_OPTIONS = Object.freeze({
  className: DEFAULT_AUTOCOMPLETE_CLASSNAME,
  debounce: 300,
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

  constructor({ className = DEFAULT_CLASSNAME, templates, autocomplete, ...options } = {}) {
    super({
      className,
      templates: { ...DEFAULT_TEMPLATES, ...templates },
      ...options,
    });
    defineValues(this, {
      autocomplete: { ...DEFAULT_AUTOCOMPLETE_OPTIONS, ...autocomplete },
    });
    this._contexts = new WeakMap();
    this._prevInput = undefined;
    this._debounce = debounce(this.autocomplete.debounce);
  }

  initialize(view) {
    this._view = view;
    const { proxyElement, hub } = view;
    this._unsubscribes = [
      ...this._unsubscribes,
      proxyElement.on('input', (e) => this._syncInput(e)),
      proxyElement.on('keydown', (e) => this._handleKeyDown(e)),
      proxyElement.on('click', (e) => this._handleClick(e)),
      proxyElement.on('focusin', (e) => this._handleFocusIn(e)),
      proxyElement.on('focusout', (e) => this._handleFocusOut(e)),
    ];
    this._unsubscribes.push(hub.on(fields.completions(), () => view.refresh({ force: true })));
  }

  focus() {
    // TODO: support blur as well
    if (this._element) {
      this._context().focus();
    } else {
      // take a rain check, wait for render
      this._focusRequested = true;
    }
  }

  open() {
    this._element.classList.add('open');
  }

  close() {
    this._element.classList.remove('open');
  }

  set value(value) {
    if (this._element) {
      this._context().value = value;
    } else {
      this._valueRequested = value;
    }
  }

  _preprocess({ state }) {
    state = super._preprocess({ state });
    return {
      ...state,
      completions: this._view.hub.states[fields.completions()],
    };
  }

  _render(element, data, controls) {
    if (element.childElementCount === 0) {
      // only render the template once, and also skip if there are children already to allow customized DOM
      super._render(element, data, controls);
    }
    this._updateCompletions(element, data, controls);
    this._fullfillFocusRequest(element);
    this._fullfillValueRequest(element);
  }

  _updateCompletions(element, { state, rendered }, { writeToState }) {
    if (!state.completions) {
      return;
    }
    const { status = STATUS.INITIAL, index, value: completions } = state.completions;
    if (rendered && rendered.completions.index === index && rendered.completions.status === status) {
      return;
    }
    const context = this._context(element);
    const { autocompleteElement } = context;
    if (!autocompleteElement) {
      return;
    }

    const items = context.trackItems(completions);

    element.classList[items.length > 0 ? 'add' : 'remove']('nonempty');
    autocompleteElement.setAttribute('data-status', status);
    autocompleteElement.innerHTML = this.templates.completions(this, items);

    writeToState({ completions: { index, status } });
  }

  _fullfillFocusRequest(element) {
    if (!element || !this._focusRequested) {
      return;
    }
    this._focusRequested = false;
    this._context(element).focus();
  }

  _fullfillValueRequest(element) {
    if (!element || !this._valueRequested) {
      return;
    }
    this._context(element).value = this._valueRequested;
    this._valueRequested = undefined;
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

  _syncInput() {
    const { inputElement } = this._context();
    if (!inputElement) {
      return;
    }
    const value = inputElement.value.trim();

    if (this._prevInput === value) {
      return;
    }
    this._prevInput = value;

    const self = this;
    this._debounce(() => self._view.hub.update(fields.input(), { value }));
  }

  _handleFocusIn({ target }) {
    if (!this._element) {
      return;
    }
    if (target.matches('[data-role="input"]')) {
      this._syncInput();
      this.open();
    }
  }

  _handleFocusOut({ relatedTarget }) {
    if (!this._element) {
      return;
    }
    if (!relatedTarget || !findInAncestors(relatedTarget, element => element === this._element || undefined)) {
      this.close();
    }
  }

  _handleKeyDown({ key, target, isComposing }) {
    if (!isComposing && key === 'Enter' && target.matches('input')) {
      this._submit(target.value);
      target.blur();
    }
    // TODO: select completion items with arrow keys
  }

  _handleClick({ target }) {
    const { inputElement } = this._context();
    for (let element = target; element && element !== this._element; element = element.parentElement) {
      if (element.matches('[data-role="submit"]') || element.matches('[data-role="button"]') || element.matches('[type="submit"]')) {
        if (inputElement) {
          inputElement.blur();
          this._submit(inputElement.value);
        }
        return;
      }
      if (element.matches('[data-role="query-item"]')) {
        const index = element.getAttribute('data-index');
        const item = this._context().data.get(parseInt(index));
        const value = item && item.text;
        if (value) {
          if (inputElement) {
            inputElement.value = value;
          }
          this._submit(value);
        }
        this.close();
        return;
      }
      if (element.matches('[data-role="product-item"]')) {
        return;
      }
    }
  }

  async _submit(value) {
    if (!value) {
      return;
    }
    this.close();
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
    this._data = new Map();
  }

  get inputElement() {
    return this._get('input');
  }

  get autocompleteElement() {
    return this._get('autocomplete');
  }

  get data() {
    return this._data;
  }

  trackItems(completions) {
    let index = 0;
    const data = this._data = new Map();
    const items = [];
    for (const field in completions) {
      for (const item of completions[field]) {
        if (item.product && !item.product.url) {
          continue; // product without URL is not clickable
        }
        item._index = index;
        item._field = field;
        data.set(index, item);
        items.push(item);
        index++;
      }
    }
    return items;
  }

  focus() {
    if (!this._element) {
      return;
    }
    const { inputElement } = this;
    inputElement && inputElement.focus();
  }

  set value(value) {
    if (!this._element) {
      return;
    }
    const { inputElement } = this;
    inputElement && (inputElement.value = value);
  }

  _get(role) {
    return !this._element ? undefined : this._cache[role] || (this._cache[role] = this._element.querySelector(`[data-role="${role}"]`));
  }

}
