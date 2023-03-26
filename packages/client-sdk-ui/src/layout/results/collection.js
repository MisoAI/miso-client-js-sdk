import { ROLE, STATUS } from '../../constants';
import TemplateBasedLayout from '../template';
import { requiresImplementation } from '../templates';

function root(layout, state) {
  const { className, templates } = layout;
  const { status } = state;
  return `<div class="miso__root ${status}"><div class="${className}">${templates[status](layout, state)}</div>${templates.banner(layout, state)}</div>`;
}

function ready(layout, state) {
  const { templates } = layout;
  const { products } = state.value;

  // TODO: handle categories, attributes, etc.
  if (products && products.length > 0) {
    return templates.list(layout, state, 'product', products);
  } else {
    return templates.empty(layout, state);
  }
}

function list(layout, state, type, items) {
  const { className, templates } = layout;
  // TODO: support separator
  return `<ul class="${className}__list" data-item-type="${type}">${items.map(item => templates.item(layout, state, type, item)).join('')}</ul>`;
}

function item(layout, state, type, item) {
  const { className, templates } = layout;
  const body = templates[type](layout, state, item);
  return `<li class="${className}__item">${body}</li>`;
}

const DEFAULT_TEMPLATES = Object.freeze({
  ...requiresImplementation('product'),
  root,
  [STATUS.INITIAL]: () => ``,
  [STATUS.LOADING]: () => ``,
  [STATUS.ERRONEOUS]: () => ``,
  [STATUS.READY]: ready,
  empty: () => ``,
  list,
  item,
});

const INHERITED_DEFAULT_TEMPLATES = Object.freeze({
  ...TemplateBasedLayout.defaultTemplates,
  ...DEFAULT_TEMPLATES,
});

export default class CollectionLayout extends TemplateBasedLayout {

  static get role() {
    return ROLE.RESULTS;
  }

  static get defaultTemplates() {
    return INHERITED_DEFAULT_TEMPLATES;
  }

  constructor(className, templates, options) {
    super(className, { ...DEFAULT_TEMPLATES, ...templates }, options);
  }

}
