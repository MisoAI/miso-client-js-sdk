import CollectionLayout from './collection.js';

const TYPE = 'carousel';
const DEFAULT_CLASSNAME = 'miso-carousel';

const DEFAULT_TEMPLATES = Object.freeze({
  ready,
  carousel,
  previous: chevron,
  next: chevron,
});

const INHERITED_DEFAULT_TEMPLATES = Object.freeze({
  ...CollectionLayout.defaultTemplates,
  ...DEFAULT_TEMPLATES,
});

function ready(layout, state) {
  const { templates } = layout;
  const nonEmpty = state.value && state.value.length > 0;
  const html = Object.getPrototypeOf(layout.constructor).defaultTemplates.ready(layout, state);
  return nonEmpty ? templates.carousel(layout, state, html) : html;
}

function carousel(layout, state, content) {
  const { className, templates } = layout;
  return `<div class="${className}__control-previous" data-role="previous">${templates.previous(layout, state)}</div><div class="${className}__viewport">${content}</div><div class="${className}__control-next" data-role="next">${templates.next(layout, state)}</div>`;
}

function chevron(layout) {
  const { className } = layout;
  return `<svg class="${className}__control-button" shape-rendering="geometricPrecision" stroke="currentColor" stroke-width="24" fill="#fff" viewBox="-30 -30 358 572"><path d="M285.77 441c16.24 16.17 16.32 42.46.15 58.7-16.16 16.24-42.45 16.32-58.69.16l-215-214.47c-16.24-16.16-16.32-42.45-.15-58.69L227.23 12.08c16.24-16.17 42.53-16.09 58.69.15 16.17 16.24 16.09 42.54-.15 58.7l-185.5 185.04L285.77 441z"/></svg>`;
}

export default class CarouselLayout extends CollectionLayout {

  static get category() {
    return super.category;
  }

  static get type() {
    return TYPE;
  }

  static get defaultTemplates() {
    return INHERITED_DEFAULT_TEMPLATES;
  }

  static get defaultClassName() {
    return DEFAULT_CLASSNAME;
  }

  constructor({ className = DEFAULT_CLASSNAME, templates, ...options } = {}) {
    super({ className, templates: { ...DEFAULT_TEMPLATES, ...templates }, ...options });
    window.addEventListener('resize', this.syncSize = this.syncSize.bind(this));
    this._page = 0;
    this._unsubscribes = [];
  }

  _render(element, states, controls) {
    super._render(element, states, controls);
    const { state } = states;
    this._itemCount = state.value ? state.value.length : undefined;
    this.syncSize();
  }

  get page() {
    return this._page;
  }

  get pageSize() {
    return this._pageSize;
  }

  next() {
    this._setPage(this._page + 1);
  }

  previous() {
    this._setPage(this._page - 1);
  }

  syncSize() {
    if (this._itemCount === undefined) {
      return; // data not ready yet
    }
    const grid = this._findGridElement();
    if (!grid) {
      return;
    }
    // update page size, page count and new page index
    const firstShownItemIndex = this._pageSize === undefined ? 0 : this._page * this._pageSize;
    const pageSize = this._pageSize = window.getComputedStyle(grid).getPropertyValue('grid-template-columns').split(' ').length;
    this._pageCount = Math.ceil(this._itemCount / this._pageSize);
    this._setPage(Math.floor(firstShownItemIndex / pageSize));
  }

  _setPage(page) {
    if (page < 0) {
      page = this._pageCount - 1;
    } else if (page >= this._pageCount) {
      page = 0;
    }
    if (page === this._page) {
      return;
    }
    this._page = page;
    const grid = this._findGridElement();
    if (grid) {
      const offset = page === 0 ? '' : `repeat(${page}, 0)`;
      grid.style.setProperty('grid-template-rows', `${offset} 1fr repeat(10, 0)`);
    }
  }

  _findGridElement() {
    const { element } = this._view;
    return element && element.querySelector(`.${this.className}__list`);
  }

  _onClick(event) {
    super._onClick(event);
    const element = event.target;
    if (element.closest(`[data-role="previous"]`)) {
      this.previous();
      return;
    }
    if (element.closest(`[data-role="next"]`)) {
      this.next();
      return;
    }
  }

  destroy() {
    window.removeEventListener('resize', this.syncSize);
    super.destroy();
  }

}
