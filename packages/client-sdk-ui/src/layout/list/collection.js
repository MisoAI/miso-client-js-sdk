import { requestAnimationFrame as raf } from '@miso.ai/commons';
import { STATUS, LAYOUT_CATEGORY } from '../../constants';
import TemplateBasedLayout from '../template';
import { requiresImplementation } from '../templates';

function root(layout, state) {
  const { className, role, templates } = layout;
  const { status } = state;
  const roleAttr = role ? `data-role="${role}"` : '';
  return `<div class="miso__root ${status}"><div class="${className}" ${roleAttr}>${templates[status](layout, state)}</div>${templates.banner(layout, state)}</div>`;
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
  // TODO: support separator
  return `<ul class="${className}__list" data-item-type="${type}">${templates.items(layout, state, type, items)}</ul>`;
}

function items(layout, state, type, items) {
  const { templates } = layout;
  return items.map(item => templates.item(layout, state, type, item)).join('');
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
  items,
  item,
});

const INHERITED_DEFAULT_TEMPLATES = Object.freeze({
  ...TemplateBasedLayout.defaultTemplates,
  ...DEFAULT_TEMPLATES,
});

export default class CollectionLayout extends TemplateBasedLayout {

  static get category() {
    return LAYOUT_CATEGORY.LIST;
  }

  static get defaultTemplates() {
    return INHERITED_DEFAULT_TEMPLATES;
  }

  constructor(className, templates, options) {
    super(className, { ...DEFAULT_TEMPLATES, ...templates }, options);
  }

  initialize(view) {
    this._view = view;
  }

  async render(element, state, { silence }) {
    // keep track of incoming state
    this._html = this.templates.root(this, state);
    this._state = state;
    silence();

    // TODO: move incremental logic here

    // only render the last update request
    await raf(() => {
      if (!this._html) {
        return; // use _html as a flag of render request
      }
      // if rendering current state with updated data, do so by appending new elements to the list
      const state = this._state;
      const { session } = state;
      const incremental = this._shallRenderIncrementally(state);
      const listElement = incremental && this._getListElement(element);
      if (listElement) {
        const items = state.value.slice(this._rendered.value.length);
        if (items.length > 0) {
          listElement.insertAdjacentHTML('beforeend', this.templates.items(this, state, 'product', items));
          this._view.updateState({ session });
        }
      } else {
        element.innerHTML = this._html;
        this._view.updateState({ session });
      }

      this._html = undefined;
      this._rendered = state;
    });
  }

  _shallRenderIncrementally(state) {
    if (!this.options.incremental) {
      return false;
    }
    const { status, session = {} } = state;
    const rendered = this._rendered || {};
    return status === STATUS.READY &&
      rendered.status === STATUS.READY &&
      session && rendered.session &&
      session.id === rendered.session.id;
  }

  _getListElement(element) {
    return element.querySelector(`.${this.className}__list`);
  }

}
