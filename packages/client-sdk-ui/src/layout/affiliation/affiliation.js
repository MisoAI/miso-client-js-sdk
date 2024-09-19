import { CarouselItemViewabilityObserver } from '@miso.ai/commons';
import { STATUS, LAYOUT_CATEGORY, EVENT_TYPE } from '../../constants.js';
import CollectionLayout from '../list/collection.js';
import { affiliation } from '../templates.js';

const TYPE = 'affiliation';
const DEFAULT_CLASSNAME = 'miso-affiliation';

function root(layout, state) {
  const { className, role, templates } = layout;
  const { status } = state;
  const roleAttr = role ? ` data-role="${role}"` : '';
  const data = state.value || {};
  const channelAttr = data.channel ? ` data-channel="${data.channel}"` : '';
  return `<div class="${className} ${status}"${roleAttr}${channelAttr}>${status === STATUS.READY ? templates[status](layout, state) : ''}</div>`;
}

function ready(layout, state) {
  const { templates } = layout;
  const items = layout._getItems(state);

  if (items && items.length > 0) {
    return templates.control(layout, state, 'previous') + templates.body(layout, state) + templates.control(layout, state, 'next');
  } else {
    return templates.empty(layout, state);
  }
}

function control(layout, state, direction) {
  const { className } = layout;
  return `<div class="${className}__control-${direction}" data-role="${direction}"></div>`;
}

function body(layout, state) {
  const { className, templates } = layout;
  const items = layout._getItems(state);
  return `<div class="${className}__body">${templates.list(layout, state, items)}</div>`;
}

function header(layout, state) {
  const { className, templates } = layout;
  let { headerText } = templates;
  if (typeof headerText === 'function') {
    headerText = headerText(layout, state);
  }
  if (!headerText) {
    return '';
  }
  return `<div class="${className}__header"><div class="${className}__header-tab">${headerText}</div></div>`;
}

function item(layout, state, value, index) {
  const { className, templates, options } = layout;
  const { itemType } = options;
  const header = templates.itemHeader(layout, state, value, { index });
  const body = templates[itemType](layout, state, value, { index });
  return `<li class="${className}__item">${header}${body}</li>`;
}

function itemHeader(layout, state, value, meta) {
  const { className, templates } = layout;
  let { headerText } = templates;
  if (typeof headerText === 'function') {
    headerText = headerText(layout, state, value, meta);
  }
  if (!headerText) {
    return '';
  }
  return `<div class="${className}__item-header"><div class="${className}__item-header-tab">${headerText}</div></div>`;
}

const DEFAULT_TEMPLATES = Object.freeze({
  root,
  [STATUS.READY]: ready,
  control,
  body,
  header,
  item,
  itemHeader,
  affiliation,
  ctaText: 'View',
  headerText: 'Featured',
});

const INHERITED_DEFAULT_TEMPLATES = Object.freeze({
  ...CollectionLayout.defaultTemplates,
  ...DEFAULT_TEMPLATES,
});

export default class AffiliationLayout extends CollectionLayout {

  static get category() {
    return LAYOUT_CATEGORY.AFFILIATION;
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
    super({ className, itemType: 'affiliation', templates: { ...DEFAULT_TEMPLATES, ...templates }, ...options });
    this._itemCount = undefined;
    this._itemIndex = 0;
    this._displayedIndex = undefined;
    this._viewable = new CarouselItemViewabilityObserver(this._onViewable.bind(this));
  }

  get itemIndex() {
    return this._itemIndex;
  }

  next() {
    if (this._itemCount === undefined) {
      return;
    }
    this.go(this._itemIndex + 1);
  }

  previous() {
    if (this._itemCount === undefined) {
      return;
    }
    this.go(this._itemIndex - 1);
  }

  go(index) {
    if (this._itemCount === undefined) {
      return;
    }
    if (index < 0) {
      index = this._itemCount - 1;
    } else if (index >= this._itemCount) {
      index = 0;
    }
    this._itemIndex = index;
    this._syncItemIndex();
  }

  _getItems(state) {
    const { products } = state.value || {};
    return products;
  }

  _render(element, states, controls) {
    super._render(element, states, controls);
    this._syncItemCount(element, states);
    this._syncItemIndex();
  }

  _syncElement(element) {
    const oldElement = this._element;
    super._syncElement(element);
    this._syncViewableElement(oldElement, element);
  }

  _syncViewableElement(oldElement, newElement) {
    if (oldElement === newElement) {
      return;
    }
    oldElement && this._viewable.unobserve(oldElement);
    newElement && this._viewable.observe(newElement);
  }

  _syncItemCount(element, states) {
    element = element.firstElementChild;
    if (!element) {
      return;
    }
    const { state } = states;
    const items = this._getItems(state);
    const itemCount = this._itemCount = items ? items.length : undefined;
    if (itemCount === undefined) {
      element.removeAttribute('data-item-count');
    } else {
      element.setAttribute('data-item-count', itemCount);
    }
  }

  _syncItemIndex() {
    // TODO: raf
    const { element } = this._view;
    const listElement = element && this._getListElement(element);
    if (!listElement) {
      return;
    }
    const index = this._itemIndex;
    if (index === this._displayedIndex) {
      return;
    }
    this._displayedIndex = index;
    listElement.style.left = `${-index * 100}%`;
    this._viewable.display(index);
    this._view._events.emit('display', { index });
  }

  _onViewable(index) {
    const item = this._getRenderedItemData(index);
    if (!item) {
      return;
    }
    this._view._events.emit(EVENT_TYPE.VIEWABLE, [item]);
  }

  _getRenderedItemData(index) {
    const { value } = this._rendered.get(this._element) || {};
    if (!value) {
      return undefined;
    }
    const { products = [] } = value;
    return products[index];
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

}
