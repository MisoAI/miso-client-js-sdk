import { defineValues, requestAnimationFrame as raf } from '@miso.ai/commons';
import { VIEW_STATUS, ATTR_DATA_MISO_PRODUCT_ID } from '../constants';

const TYPE = 'list';

function renderProduct(widget, state, { url, cover_image, title, description, sale_price, original_price, ...product }) {
  const openTag = url ? `<a class="miso-list__wrapper" href="${url}" target="_blank" rel="noopener">` : `<div class="miso-list__wrapper">`;
  const clostTag = url ? `</a>` : `</div>`;
  const img = cover_image ? `<img src="${cover_image}">` : '';
  const imgBox = `<div class="miso-list__img-box">${img}</div>`;
  let infoContent = '';
  if (title) {
    infoContent += `<div class="miso-list__title">${title}</div>`;
  }
  if (description) {
    infoContent += `<div class="miso-list__desc">${description}</div>`;
  }
  const price = sale_price || original_price;
  if (price) {
    infoContent += `<div class="miso-list__price">${price}</div>`;
  }
  const infoBox = `<div class="miso-list__info-box">${infoContent}</div>`;
  return `${openTag}${imgBox}${infoBox}${clostTag}`;
}

const DEFAULT_CLASSNAMES =  Object.freeze({
  root: 'miso-list',
});

const DEFAULT_TEMPLATES = Object.freeze({
  container: ({ classNames }, { status }, body) => `<div class="${classNames.root} ${status}">${body}</div>`,
  [VIEW_STATUS.INITIAL]: () => ``,
  [VIEW_STATUS.LOADING]: () => ``,
  [VIEW_STATUS.ERRONEOUS]: () => ``,
  empty: () => ``,
  list: (_0, _1, body) => `<ul>${body}</ul>`,
  item: (_0, _1, { product_id }, body) => `<li ${ product_id ? `${ATTR_DATA_MISO_PRODUCT_ID}="${product_id}"` : ''}>${body}</li>`,
  product: renderProduct,
});

export default class ListWidget {

  static get type() {
    return TYPE;
  }

  static get defaultTemplates() {
    return DEFAULT_TEMPLATES;
  }

  static get defaultClassNames() {
    return DEFAULT_CLASSNAMES;
  }

  constructor({ templates, classNames } = {}) {
    defineValues(this, {
      templates: {
        ...DEFAULT_TEMPLATES,
        ...templates,
      },
      classNames: {
        ...DEFAULT_CLASSNAMES,
        ...classNames,
      },
    });
  }

  async render(element, state) {
    const html = this._html(state);
    await raf(() => {
      element.innerHTML = html;
    });
  }

  _html(state) {
    const body = state.status === VIEW_STATUS.READY ? this._renderData(state) : this._renderNonData(state);
    return this.templates.container(this, state, body);
  }

  _renderData(state) {
    const { data } = state;
    const { products } = data;
    let html = '';
    let empty = true;

    if (products) {
      html += this._list(state, 'products', 'product', products);
      if (products.length > 0) {
        empty = false;
      }
    }
    // TODO: handle categories, attributes, etc.

    if (empty) {
      html = this.templates.empty(this, state);
    }

    return html;
  }

  _renderNonData(state) {
    return this.templates[state.status](this, state);
  }

  _list(state, collectionType, itemType, items) {
    const body = this._items(state, itemType, items);
    return this.templates.list(this, state, body);
  }

  _items(state, type, items) {
    return items.map(item => this._item(state, type, item)).join('');
  }

  _item(state, type, item) {
    const content = this.templates[type](this, state, item);
    return this.templates.item(this, state, item, content);
  }

}
