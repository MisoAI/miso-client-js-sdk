import { STATUS, LAYOUT_CATEGORY } from '../../constants';
import TemplateBasedLayout from '../template';
import { product } from '../templates';

function root(layout, state) {
  const { className, role, templates } = layout;
  const { status } = state;
  const roleAttr = role ? `data-role="${role}"` : '';
  return `<div class="${className} ${status}" ${roleAttr}>${status === STATUS.READY ? templates[status](layout, state) : ''}</div>`;
}

function ready(layout, state) {
  const { templates } = layout;
  const items = state.value;

  // TODO: handle categories, attributes, etc. by introducing sublayout
  if ((items && items.length > 0) || state.ongoing) {
    return templates.list(layout, state, 'product', items);
  } else {
    return templates.empty(layout, state);
  }
}

function list(layout, state, type, items) {
  const { className, templates } = layout;
  // TODO: support separator?
  return `<ul class="${className}__list" data-item-type="${type}">${templates.items(layout, state, type, items)}</ul>`;
}

function items(layout, state, type, items) {
  const { templates } = layout;
  let index = 0;
  return items.map(item => templates.item(layout, state, type, item, index++)).join('');
}

function item(layout, state, type, item, index) {
  const { className, templates } = layout;
  const body = templates[type](layout, state, item, { index });
  return `<li class="${className}__item">${body}</li>`;
}

const DEFAULT_TEMPLATES = Object.freeze({
  product,
  root,
  [STATUS.READY]: ready,
  empty: () => ``,
  list,
  items,
  item,
});

export default class CollectionLayout extends TemplateBasedLayout {

  static get category() {
    return LAYOUT_CATEGORY.LIST;
  }

  static get defaultTemplates() {
    return DEFAULT_TEMPLATES;
  }

  constructor({ templates, ...options }) {
    super({
      templates: { ...DEFAULT_TEMPLATES, ...templates },
      ...options,
    });
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

  _html(state, rendered, incremental) {
    if (incremental) {
      const items = state.value.slice(rendered.value.length);
      return items.length > 0 ? this.templates.items(this, state, 'product', items) : '';
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

  _shallRenderIncrementally(state, rendered) {
    // TODO: compare item ids as well
    return this.options.incremental &&
    rendered && rendered.value && rendered.value.length > 0 &&
      state.status === STATUS.READY &&
      rendered.status === STATUS.READY &&
      state.session && rendered.session &&
      state.session.id === rendered.session.id;
  }

  _getListElement(element) {
    return element.querySelector(`.${this.className}__list`);
  }

}
