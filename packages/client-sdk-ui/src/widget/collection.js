import { ATTR_DATA_MISO_PRODUCT_ID } from '../constants';
import TemplateBasedWidget from './template';

function ready(widget, state) {
  const { templates } = widget;
  const { data } = state;
  const { products } = data;
  let html = '';
  let empty = true;

  if (products) {
    html += templates.list(widget, state, 'product', products);
    if (products.length > 0) {
      empty = false;
    }
  }
  // TODO: handle categories, attributes, etc.

  if (empty) {
    html = templates.empty(widget, state);
  }

  return html;
}

function list(widget, state, type, items) {
  const { className, templates } = widget;
  // TODO: support separator
  return `<ul class="${className}__list" data-item-type="${type}">${items.map(item => templates.item(widget, state, type, item)).join('')}</ul>`;
}

function item(widget, state, type, item) {
  const { className, templates } = widget;
  const { product_id } = item;
  const body = templates[type](widget, state, item);
  return `<li class="${className}__item" ${type === 'product' && product_id ? `${ATTR_DATA_MISO_PRODUCT_ID}="${product_id}"` : ''}>${body}</li>`;
}

const DEFAULT_TEMPLATES = Object.freeze({
  empty: () => ``,
  ready,
  list,
  item,
  product: () => {
    throw new Error(`Template "product" is absent.`);
  },
});

const INHERITED_DEFAULT_TEMPLATES = Object.freeze({
  ...TemplateBasedWidget.defaultTemplates,
  DEFAULT_TEMPLATES,
});

export default class CollectionWidget extends TemplateBasedWidget {

  static get defaultTemplates() {
    return INHERITED_DEFAULT_TEMPLATES;
  }

  constructor(className, templates) {
    super(className, { ...DEFAULT_TEMPLATES, ...templates });
  }

}
