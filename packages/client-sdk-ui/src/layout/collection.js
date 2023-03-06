import { ATTR_DATA_MISO_PRODUCT_ID } from '../constants';
import TemplateBasedLayout from './template';

function ready(layout, state) {
  const { templates } = layout;
  const { data } = state;
  const { products } = data;
  let html = '';
  let empty = true;

  if (products) {
    html += templates.list(layout, state, 'product', products);
    if (products.length > 0) {
      empty = false;
    }
  }
  // TODO: handle categories, attributes, etc.

  if (empty) {
    html = templates.empty(layout, state);
  }

  return html;
}

function list(layout, state, type, items) {
  const { className, templates } = layout;
  // TODO: support separator
  return `<ul class="${className}__list" data-item-type="${type}">${items.map(item => templates.item(layout, state, type, item)).join('')}</ul>`;
}

function item(layout, state, type, item) {
  const { className, templates } = layout;
  const { product_id } = item;
  const body = templates[type](layout, state, item);
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
  ...TemplateBasedLayout.defaultTemplates,
  DEFAULT_TEMPLATES,
});

export default class CollectionLayout extends TemplateBasedLayout {

  static get defaultTemplates() {
    return INHERITED_DEFAULT_TEMPLATES;
  }

  constructor(className, templates, options) {
    super(className, { ...DEFAULT_TEMPLATES, ...templates }, options);
  }

}
