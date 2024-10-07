import { CarouselItemViewabilityObserver, requestAnimationFrame as raf } from '@miso.ai/commons';
import { STATUS, LAYOUT_CATEGORY } from '../../constants.js';
import CollectionLayout from '../list/collection.js';
import { affiliation, helpers } from '../templates.js';
import { TRIANGLE } from '../../asset/svgs.js';

const TYPE = 'affiliation';
const DEFAULT_CLASSNAME = 'miso-affiliation';

function root(layout, state) {
  const { className, role, templates } = layout;
  const { status } = state;
  const roleAttr = role ? ` data-role="${role}"` : '';
  const data = state.value || {};
  const channelAttr = data.channel ? ` data-channel="${data.channel}"` : '';
  const items = layout._getItems(state);
  const itemCount = items ? items.length : undefined;
  const itemCountAttr = itemCount !== undefined ? ` data-item-count="${itemCount}"` : '';
  return `<div class="${className} ${status}"${roleAttr}${channelAttr}${itemCountAttr}>${status === STATUS.READY ? templates[status](layout, state) : ''}</div>`;
}

function ready(layout, state) {
  const { templates } = layout;
  const items = layout._getItems(state);

  if (items && items.length > 0) {
    return templates.controlContainer(layout, state, 'previous') + templates.body(layout, state) + templates.controlContainer(layout, state, 'next');
  } else {
    return templates.empty(layout, state);
  }
}

function controlContainer(layout, state, direction) {
  const { className, templates } = layout;
  return `<div class="${className}__control-${direction}-container">${templates.control(layout, state, direction)}</div>`;
}

function control(layout, state, direction) {
  const { className, templates } = layout;
  return `<div class="${className}__control-${direction}" data-role="${direction}">${templates.controlIcon(layout, state, direction)}</div>`;
}

function controlIcon(layout, state, direction) {
  return TRIANGLE;
}

function body(layout, state) {
  const { className, templates } = layout;
  const items = layout._getItems(state);
  return `<div class="${className}__body">${templates.list(layout, state, items)}</div>`;
}

function item(layout, state, value, index) {
  const { className, templates, options } = layout;
  const { itemType } = options;
  const header = templates.itemHeader(layout, state, value, { index });
  const body = templates[itemType](layout, state, value, { index });
  return `<li class="${className}__item"><div class="${className}__item-inner">${header}${body}</div></li>`;
}

function itemHeader(layout, state, value, meta) {
  const { className, templates } = layout;
  let { itemHeaderLeftText, itemHeaderRightText } = templates;
  itemHeaderLeftText = helpers.asFunction(itemHeaderLeftText)(layout, state, value, meta);
  itemHeaderRightText = helpers.asFunction(itemHeaderRightText)(layout, state, value, meta);
  return `<div class="${className}__item-header">
  <div class="${className}__item-header-left">${itemHeaderLeftText}</div>
  <div class="${className}__item-header-right">${itemHeaderRightText}</div>
</div>`;
}

function itemHeaderRightText(layout, state, value, meta) {
  const { className, templates } = layout;
  const logoText = helpers.asFunction(templates.logoText)(layout, state, value, meta) || '';
  const logoImg = helpers.asFunction(templates.logoImg)(layout, state, value, meta);
  return logoImg ? `<span class="${className}__item-header-logo-text">${logoText}</span>${logoImg}` : '';
}

function logoImg(layout, state, value, meta) {
  const { className, templates } = layout;
  const logoUrl = helpers.asFunction(templates.logoUrl)(layout, state, value, meta);
  if (!logoUrl) {
    return '';
  }
  const logoAltText = helpers.asFunction(templates.logoAltText)(layout, state, value, meta);
  const logoAltTextAttr = logoAltText ? ` alt="${logoAltText}"` : '';
  return `<img class="${className}__item-header-logo" src="${logoUrl}"${logoAltTextAttr}>`;
}

const DEFAULT_TEMPLATES = Object.freeze({
  root,
  [STATUS.READY]: ready,
  controlContainer,
  control,
  controlIcon,
  body,
  item,
  itemHeader,
  affiliation,
  ctaText: 'View deal',
  itemHeaderLeftText: `Today's best deals`,
  itemHeaderRightText,
  logoImg,
  logoText: 'Selected by',
});

const INHERITED_DEFAULT_TEMPLATES = Object.freeze({
  ...CollectionLayout.defaultTemplates,
  ...DEFAULT_TEMPLATES,
});

/*
function normalizeAutoplayOptions(options) {
  if (options === true) {
    options = { interval: 10000 };
  } else if (typeof options === 'number') {
    if (options <= 0) {
      options = false;
    } else {
      options = { interval: Math.max(options, 500) };
    }
  }
  return options;
}

function autoplayOptionsEquals(a, b) {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.interval === b.interval;
}
*/

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

  constructor({ className = DEFAULT_CLASSNAME, templates, autoplay, ...options } = {}) {
    super({ className, itemType: 'affiliation', templates: { ...DEFAULT_TEMPLATES, ...templates }, ...options });
    this._itemCount = undefined;
    this._itemIndex = 0;
    this._displayedCount = undefined;
    this._displayedIndex = undefined;
    this._viewable = undefined;

    // TODO: extract this
    /*
    this._autoplay = {};
    this.autoplay(autoplay);
    */
  }

  initialize(view) {
    super.initialize(view);
    const { viewable: options } = this._view.tracker.options || {};
    this._viewable = new CarouselItemViewabilityObserver(this._onViewable.bind(this), options);
  }

  /*
  autoplay(options = false) {
    options = normalizeAutoplayOptions(options);
    if (autoplayOptionsEquals(options, this._autoplay.options)) {
      return;
    }
    if (this._autoplay.options) {
      clearInterval(this._autoplay.intervalId);
    }
    this._autoplay = { options };
    // TODO: use slower transition speed for autoplay
    // TODO: pause on hover
    // TODO: cooldown after manual interaction
    if (options) {
      this._autoplay.intervalId = setInterval(() => this.next(), options.interval);
    }
  }
  */

  get itemIndex() {
    return this._itemIndex;
  }

  set itemIndex(index) {
    if (this._itemCount === undefined) {
      return;
    }
    if (index < 0) {
      index = this._itemCount - 1;
    } else if (index >= this._itemCount) {
      index = 0;
    }
    this._itemIndex = index;
    raf(() => this._syncItemIndex());
  }

  next() {
    if (this._itemCount === undefined) {
      return;
    }
    this.itemIndex++;
  }

  previous() {
    if (this._itemCount === undefined) {
      return;
    }
    this.itemIndex--;
  }

  _getItems(state) {
    const { products } = state.value || {};
    return products;
  }

  _render(element, states, controls) {
    super._render(element, states, controls);
    // sync again for incremental item rendering
    this._syncItemCount(states);
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

  _syncItemCount({ state } = {}) {
    const items = this._getItems(state);
    const itemCount = this._itemCount = items ? items.length : undefined;
    if (itemCount === this._displayedCount) {
      return;
    }
    let { element } = this._view;
    element = element.firstElementChild;
    if (!element) {
      return;
    }
    this._displayedCount = itemCount;
    if (itemCount === undefined) {
      element.removeAttribute('data-item-count');
    } else {
      element.setAttribute('data-item-count', itemCount);
    }
  }

  _syncItemIndex() {
    const index = this._itemIndex;
    if (index === this._displayedIndex) {
      return;
    }
    const { element } = this._view;
    const listElement = element && this._getListElement(element);
    if (!listElement) {
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
    this._view.tracker.viewable([item]);
  }

  _getRenderedItemData(index) {
    const { value } = this._rendered.get(this._element) || {};
    if (!value) {
      return undefined;
    }
    const { products = [] } = value;
    return products[index];
  }

  _trackViewables() {} // omit default behavior for we want to track by other means

  _onClick(event) {
    const element = event.target;
    if (element.closest(`[data-role="previous"]`)) {
      this.previous();
      return;
    }
    if (element.closest(`[data-role="next"]`)) {
      this.next();
      return;
    }
    super._onClick(event);
  }

}
