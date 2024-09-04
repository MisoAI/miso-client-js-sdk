import { defineValues } from '@miso.ai/commons';
import { STATUS, LAYOUT_CATEGORY } from '../../constants.js';
import TemplateBasedLayout from '../template.js';
import { product, article, question, productInfoBlock, articleInfoBlock, titleBlock, brandBlock, descriptionBlock, dateBlock, priceBlock, discountRateText, ctaBlock, cta, imageBlock, indexBlock, helpers } from '../templates.js';

const VALUE = Symbol.for('miso.value');

function root(layout, state) {
  const { className, role, templates } = layout;
  const { status } = state;
  const roleAttr = role ? `data-role="${role}"` : '';
  return `<div class="${className} ${status}" ${roleAttr}>${status === STATUS.READY ? templates[status](layout, state) : ''}</div>`;
}

function ready(layout, state) {
  const { templates } = layout;
  const values = state.value;

  // TODO: handle categories, attributes, etc. by introducing sublayout
  if ((values && values.length > 0) || state.ongoing) {
    return templates.list(layout, state, values);
  } else {
    return templates.empty(layout, state);
  }
}

function list(layout, state, values) {
  const { className, templates, options } = layout;
  const listTag = templates.ordered ? 'ol' : 'ul';
  // TODO: support separator?
  return `<${listTag} class="${className}__list" data-item-type="${options.itemType}">${templates.items(layout, state, values)}</${listTag}>`;
}

function items(layout, state, values, { offset = 0 } = {}) {
  const { templates } = layout;
  let index = offset;
  return values.map(value => templates.item(layout, state, value, index++)).join('');
}

function item(layout, state, value, index) {
  const { className, templates, options } = layout;
  const { itemType } = options;
  const body = templates[itemType](layout, state, value, { index });
  return `<li class="${className}__item">${body}</li>`;
}

// TODO: let templates.js control what to be included here

const DEFAULT_TEMPLATES = Object.freeze({
  product,
  article,
  question,
  root,
  [STATUS.READY]: ready,
  empty: () => ``,
  list,
  ordered: false,
  items,
  item,
  productInfoBlock,
  articleInfoBlock,
  brandBlock,
  titleBlock,
  descriptionBlock,
  dateBlock,
  priceBlock,
  discountRateText,
  ctaBlock,
  cta,
  imageBlock,
  indexBlock,
  helpers,
});

export default class CollectionLayout extends TemplateBasedLayout {

  static get category() {
    return LAYOUT_CATEGORY.LIST;
  }

  static get defaultTemplates() {
    return DEFAULT_TEMPLATES;
  }

  constructor({ templates, itemType = 'product', ...options }) {
    super({
      templates: { ...DEFAULT_TEMPLATES, ...templates },
      itemType,
      ...options,
    });
    defineValues(this, {
      bindings: Object.freeze({
        list: this._listBindings.bind(this),
      }),
    });
    this._view = undefined;
  }

  initialize(view) {
    this._view = view;
    const { proxyElement } = this._view = view;
    this._unsubscribes.push(proxyElement.on('click', this._onClick.bind(this)));
  }

  _preprocess({ state, rendered }) {
    const incremental = this._shallRenderIncrementally(state, rendered);
    const html = this._html(state, rendered, incremental);
    return {
      ...state,
      incremental,
      html,
    };
  }

  _shallRenderIncrementally(state, rendered) {
    // TODO: compare item ids as well
    return this.options.incremental &&
    rendered && rendered.value && rendered.value.length > 0 &&
      state.status === STATUS.READY &&
      rendered.status === STATUS.READY &&
      state.session && rendered.session &&
      state.session.id === rendered.session.id;
  }

  _html(state, rendered, incremental) {
    if (incremental) {
      const offset = rendered.value.length;
      const values = state.value.slice(offset);
      return values.length > 0 ? this.templates.items(this, state, values, { offset }) : '';
    } else {
      return this.templates.root(this, state);
    }
  }

  _render(element, { state }, { notifyUpdate }) {
    const { incremental, html } = state;
    if (incremental) {
      if (html) {
        const listElement = this._getListElement(element);
        listElement.insertAdjacentHTML('beforeend', html);
      } else {
        notifyUpdate(false);
      }
    } else {
      element.innerHTML = html;
    }
    this._syncValues(element, state);
  }

  _syncValues(element, state) {
    if (!element) {
      return;
    }
    const values = state.value || [];
    let i = 0;
    for (const itemElement of this._listItemElements(element)) {
      itemElement[VALUE] = values[i++];
    }
  }

  _getListElement(element) {
    return element.querySelector(`.${this.className}__list`);
  }

  _listItemElements(element) {
    return element ? Array.from(element.querySelectorAll(`[data-role="item"]`)) : [];
  }

  _listBindings(rootElement) {
    if (!rootElement) {
      return [];
    }
    const bindings = [];
    for (const element of this._listItemElements(rootElement)) {
      const value = element[VALUE];
      if (!value) {
        continue;
      }
      const key = this.options.itemType === 'product' ? value.product_id : value;
      bindings.push({ element, key, value });
    }
    return bindings;
  }

  _onClick(event) {
    const element = event.target.closest(`[data-role="item"]`);
    if (!element) {
      return;
    }
    const value = element[VALUE];
    const { session } = this._view._state;
    this._view._events.emit('click', { session, value, element, domEvent: event });
  }

  destroy() {
    this._view = undefined;
    super.destroy();
  }

}
