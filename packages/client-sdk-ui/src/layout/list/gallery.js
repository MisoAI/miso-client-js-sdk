import { trimObj } from '@miso.ai/commons';
import CollectionLayout from './collection.js';
import { addOrRemoveClass, resolveCssLength, cssAspectRatio } from '../../util/dom.js';

function calculateItemSizes(itemCount, columnCount) {
  const totalSpaces = columnCount * 2;
  let remainingSpaces = Math.max(totalSpaces - itemCount, 0);

  let small = itemCount;
  // turning a small block into a large block takes 3 extra spaces
  const large = Math.min(Math.floor(remainingSpaces / 3), small);
  small -= large;
  remainingSpaces -= large * 3;
  // turning a small block into a medium block takes 1 extra space
  const medium = Math.min(remainingSpaces, small);
  small -= medium;
  remainingSpaces -= medium;

  return [large, medium, small];
}

function item(layout, state, value, index) {
  const { className, templates, options } = layout;
  const { itemType } = options;
  const body = templates[itemType](layout, state, value, { index });
  const sizeClass = value._size ? ` ${className}__item-${value._size}` : '';
  return `<li class="${className}__item${sizeClass}">${body}</li>`;
}

const DEFAULT_HEIGHT = '16rem';

const DEFAULT_TEMPLATES = Object.freeze({
  ...CollectionLayout.defaultTemplates,
  item,
});

const TYPE = 'gallery';
const DEFAULT_CLASSNAME = 'miso-gallery';

export default class GalleryLayout extends CollectionLayout {

  static get type() {
    return TYPE;
  }

  static get defaultTemplates() {
    return DEFAULT_TEMPLATES;
  }

  static get defaultClassName() {
    return DEFAULT_CLASSNAME;
  }

  constructor({ className = DEFAULT_CLASSNAME, templates, ...options } = {}) {
    super({
      className,
      templates: { ...DEFAULT_TEMPLATES, ...templates },
      ...options,
    });
    this._galleryContext = {
      itemAspectRatio: undefined,
      itemCount: undefined,
      columnCount: undefined,
    };
  }

  syncSize() {
    const { element } = this._view;
    const listElement = element && this._getListElement(element);
    if (!listElement) {
      return;
    }
    this._syncListAspectRatio(listElement);
    this._syncItemSizes(listElement);
  }

  _preprocess({ state, rendered }) {
    const incremental = this._shallRenderIncrementally(state, rendered);
    const bodyHtml = incremental ? undefined : this._bodyHtml(state);
    const itemsHtml = this._itemsHtml(state, rendered);
    return {
      ...state,
      ...trimObj({
        incremental,
        bodyHtml,
        itemsHtml,
      }),
    };
  }

  _bodyHtml(state) {
    return this.templates.root(this, { ...state, value: [] });
  }

  _itemsHtml(state, rendered) {
    const offset = (rendered && rendered.value && rendered.value.length) || 0;
    const values = (this._getItems(state) || []).slice(offset);
    return values.length > 0 ? this.templates.items(this, state, values, { offset }) : '';
  }

  _render(element, states, controls) {
    this._syncItemCount(states);
    this._syncCssVariables();
    const listElement = this._renderListElement(element, states, controls);
    if (!listElement) {
      return;
    }
    this._syncListAspectRatio(listElement);
    this._renderItems(listElement, states, controls);
  }

  _renderListElement(element, { state }) {
    const { incremental, bodyHtml } = state;
    if (!incremental) {
      element.innerHTML = bodyHtml;
    }
    return this._getListElement(element);
  }

  _renderItems(listElement, states) {
    if (states.state.incremental) {
      this._appendItems(listElement, states);
    } else {
      this._updateItems(listElement, states);
    }
  }

  _updateItems(listElement, { state }) {
    const { itemSizes } = this._galleryContext;
    const values = this._writeItemSizes(this._getItems(state), itemSizes);
    listElement.innerHTML = this.templates.items(this, state, values);
  }

  _appendItems(listElement, { state }) {
    const { itemSizes } = this._galleryContext;
    // update existing items
    this._syncItemSizes(listElement);
    // append new items
    const offset = listElement.children.length;
    const values = this._writeItemSizes(this._getItems(state).slice(offset), itemSizes, offset);
    listElement.insertAdjacentHTML('beforeend', this.templates.items(this, state, values, { offset }));
  }

  _writeItemSizes(values = [], [large = 0, medium = 0] = [], offset = 0) {
    let omitted = 0;
    if (offset > 0) {
      omitted = Math.min(offset, large);
      offset -= omitted;
      large -= omitted;
    }
    if (offset > 0) {
      omitted = Math.min(offset, medium);
      offset -= omitted;
      medium -= omitted;
    }
    const results = [];
    for (const value of values) {
      let _size = 'small';
      if (large > 0) {
        _size = 'large';
        large--;
      } else if (medium > 0) {
        _size = 'medium';
        medium--;
      }
      results.push({ ...value, _size });
    }
    return results;
  }

  _syncCssVariables() {
    const context = this._galleryContext;
    let { itemAspectRatio = 1, height = DEFAULT_HEIGHT } = this.options;
    itemAspectRatio = context.itemAspectRatio = cssAspectRatio(itemAspectRatio);
    const { element } = this._view;
    if (!element) {
      return;
    }
    // TODO: skip if equal to default values
    element.style.setProperty('--miso-gallery-height', `${height}`);
    element.style.setProperty('--miso-gallery-item-1x1-aspect-ratio', `${itemAspectRatio}`);
    element.style.setProperty('--miso-gallery-item-1x2-aspect-ratio', `${itemAspectRatio.scaleBy([1, 2])}`);
  }

  _syncListAspectRatio(listElement) {
    const context = this._galleryContext;
    const { itemCount, itemAspectRatio } = context;
    const { height = DEFAULT_HEIGHT } = this.options;
    const resolvedHeight = resolveCssLength(height);
    const width = listElement.clientWidth;
    if (width === 0) {
      context.columnCount = undefined;
      context.itemSizes = undefined;
      return; // probably not visible yet
    }
    const columnCount = context.columnCount = Math.round((width * itemAspectRatio.width * 2) / (resolvedHeight * itemAspectRatio.height));
    context.itemSizes = calculateItemSizes(itemCount, columnCount);

    // update DOM
    listElement.style.aspectRatio = `${columnCount} / 2`;
    listElement.style.height = 'auto';
  }

  _syncItemCount({ state } = {}) {
    const items = this._getItems(state);
    this._galleryContext.itemCount = items ? items.length : undefined;
  }

  _syncItemSizes(listElement) {
    const { itemSizes = [] } = this._galleryContext;
    let [large = 0, medium = 0] = itemSizes;
    const { className } = this;

    // update DOM
    for (const itemElement of listElement.children) {
      let lg = false, md = false;
      if (large > 0) {
        lg = true;
        large--;
      } else if (medium > 0) {
        md = true;
        medium--;
      }
      addOrRemoveClass(itemElement, `${className}__item-large`, lg);
      addOrRemoveClass(itemElement, `${className}__item-medium`, md);
      addOrRemoveClass(itemElement, `${className}__item-small`, !lg && !md);
    }
  }

}
