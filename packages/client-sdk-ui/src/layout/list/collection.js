import { STATUS } from '../../constants.js';
import TemplateBasedLayout from '../template.js';
import { makeTrackable } from '../trackable.js';
import { product, article, question, productInfoBlock, articleInfoBlock, titleBlock, brandBlock, descriptionBlock, dateBlock, priceBlock, discountRateText, ctaBlock, cta, imageBlock, indexBlock } from '../templates.js';

function root(layout, state) {
  const { className, role, templates } = layout;
  const { status } = state;
  const roleAttr = role ? `data-role="${role}"` : '';
  return `<div class="${className} ${status}" ${roleAttr}>${status === STATUS.READY ? templates[status](layout, state) : ''}</div>`;
}

function ready(layout, state) {
  const { templates } = layout;
  const values = layout._getItems(state);

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
  return `<${listTag} class="${className}__list" data-role="list" data-item-type="${options.itemType}">${templates.items(layout, state, values)}</${listTag}>`;
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
});

export default class CollectionLayout extends TemplateBasedLayout {

  static get defaultTemplates() {
    return DEFAULT_TEMPLATES;
  }

  constructor({ templates, itemType = 'product', ...options }) {
    super({
      templates: { ...DEFAULT_TEMPLATES, ...templates },
      itemType,
      ...options,
    });
    this._initTrackable();
  }

  initialize(view) {
    this._unsubscribes.push(view.proxyElement.on('click', this._onClick.bind(this)));
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
      const values = (this._getItems(state) || []).slice(offset);
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
  }

  _afterRender(element, state) {
    this._syncBindings(element, state);
  }

  _unrender() {
    this._clearBindings();
  }

  _getItems(state) {
    return state.value;
  }

  _getListElement(element) {
    return element.querySelector('[data-role="list"]');
  }

  _getItemElements(element) {
    return element ? Array.from(element.querySelectorAll(`[data-role="item"]`)) : [];
  }

  _onClick(event) {
    const element = event.target.closest(`[data-role="item"]`);
    if (!element) {
      return;
    }
    const binding = this._bindings.get(element);
    if (!binding) {
      return;
    }
    this._trackClick(event, binding);
    this._emitClickEvent(event, binding);
  }

  _emitClickEvent(event, binding) {
    const { session } = this._view._state;
    const { value, element } = binding;
    this._view._events.emit('click', { session, value, element, domEvent: event });
  }

  destroy() {
    this._destroyTrackable();
    this._view = undefined;
    super.destroy();
  }

}

makeTrackable(CollectionLayout.prototype);
