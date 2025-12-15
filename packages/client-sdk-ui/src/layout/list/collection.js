import { STATUS } from '../../constants.js';
import TemplateBasedLayout from '../template.js';
import { makeTrackable } from '../mixin/trackable.js';
import { makeTriggerable } from '../mixin/triggerable.js';
import { product, article, compactArticle, image, question, productInfoBlock, articleInfoBlock, compactArticleInfoBlock, imageInfoBlock, titleBlock, brandBlock, descriptionBlock, dateBlock, authorsBlock, authorsAndDateBlock, priceBlock, discountRateText, ctaBlock, cta, imageBlock, indexBlock } from '../templates.js';

function root(layout, state) {
  const { className, role, templates, options } = layout;
  const { status } = state;
  const roleAttr = role ? ` data-role="${role}"` : '';
  const itemTypeAttr = options.itemType ? ` data-item-type="${options.itemType}"` : '';
  return `<div class="${className} ${status}"${roleAttr}${itemTypeAttr}>${status === STATUS.READY ? templates[status](layout, state) : ''}${templates.trigger(layout, state)}${templates.loading(layout, state)}</div>`;
}

function ready(layout, state) {
  const { templates } = layout;
  const values = layout._getItems(state) || [];

  // TODO: handle categories, attributes, etc. by introducing sublayout
  if (values.length > 0 || state.ongoing) { // TODO: ad-hoc ongoing?
    return templates.body(layout, state, values);
  } else {
    return templates.empty(layout, state);
  }
}

function body(layout, state, values) {
  return layout.templates.list(layout, state, values);
}

function list(layout, state, values) {
  const { className, templates, options } = layout;
  const listTag = templates.ordered ? 'ol' : 'ul';
  const itemTypeAttr = options.itemType ? ` data-item-type="${options.itemType}"` : ''; // backward compatible
  // TODO: support separator?
  return `<${listTag} class="${className}__list" data-role="list"${itemTypeAttr}>${templates.items(layout, state, values)}</${listTag}>`;
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

function trigger(layout, state) {
  const { className } = layout;
  return `<div class="${className}__trigger" data-role="trigger"></div>`;
}

function loading() {
  return `<div class="miso-loading" aria-label="Loading" data-role="loading"></div>`;
}

// TODO: let templates.js control what to be included here

const DEFAULT_TEMPLATES = Object.freeze({
  product,
  article,
  compactArticle,
  image,
  question,
  root,
  [STATUS.READY]: ready,
  empty: () => ``,
  body,
  list,
  ordered: false,
  items,
  item,
  productInfoBlock,
  articleInfoBlock,
  compactArticleInfoBlock,
  imageInfoBlock,
  brandBlock,
  titleBlock,
  descriptionBlock,
  dateBlock,
  authorsBlock,
  authorsAndDateBlock,
  priceBlock,
  discountRateText,
  ctaBlock,
  cta,
  imageBlock,
  indexBlock,
  trigger,
  loading,
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
    this._initTriggerable();
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
      state.value && state.value.length >= rendered.value.length &&
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
    this._syncTrigger(element, state);
  }

  _unrender() {
    this._clearBindings();
    this._untrackTrigger();
  }

  _getItems(state) {
    return state.value && (state.value.products || state.value);
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
    this._view._emit('click', { session, value, element, domEvent: event });
  }

  destroy() {
    this._destroyTrackable();
    this._destroyTriggerable();
    this._view = undefined;
    super.destroy();
  }

}

makeTrackable(CollectionLayout.prototype);
makeTriggerable(CollectionLayout.prototype);
