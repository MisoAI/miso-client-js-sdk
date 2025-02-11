import { mixin, requestAnimationFrame as raf } from '@miso.ai/commons';

export function makeSwipeable(prototype) {
  mixin(prototype, SwipeableMixin.prototype);
}

export class SwipeableMixin {
  
  _initSwipeable() {
    this._swipeableContext = {
      itemCount: undefined,
      itemIndex: undefined,
      displayedCount: undefined,
      displayedIndex: undefined,
      displayEventIndex: undefined,
    };
  }

  // TODO: autoplay

  get itemIndex() {
    return this._swipeableContext.itemIndex;
  }

  set itemIndex(index) {
    const context = this._swipeableContext;
    if (context.itemCount === undefined) {
      return;
    }
    if (index < 0) {
      index = context.itemCount - 1;
    } else if (index >= context.itemCount) {
      index = 0;
    }
    context.itemIndex = index;
    raf(() => this._syncSwipeableItemIndex());
  }

  next() {
    if (this._swipeableContext.itemCount === undefined) {
      return;
    }
    this.itemIndex++;
  }

  previous() {
    if (this._swipeableContext.itemCount === undefined) {
      return;
    }
    this.itemIndex--;
  }

  _renderSwipeable(element, states, controls) {
    this._syncSwipeableItemCount(states);
    this._syncSwipeableItemIndex();
  }

  _afterRenderSwipeable() {
    this._emitSwipeableDisplayEvent();
  }

  _syncSwipeableItemCount({ state } = {}) {
    const context = this._swipeableContext;
    const items = this._getItems(state);
    const oldItemCount = context.itemCount;
    const itemCount = context.itemCount = items ? items.length : undefined;

    if (itemCount === oldItemCount) {
      return;
    }
    // TODO: concern count === 0
    if (itemCount === undefined) {
      context.itemIndex = undefined;
    } else if (oldItemCount === undefined) {
      context.itemIndex = 0;
    }

    this._syncDisplayedSwipeableItemCount();
  }

  _syncDisplayedSwipeableItemCount() {
    const context = this._swipeableContext;
    const { itemCount } = context;
    if (itemCount === context.displayedCount) {
      return;
    }
    let { element } = this._view;
    element = element.firstElementChild;
    if (!element) {
      return;
    }
    context.displayedCount = itemCount;
    if (itemCount === undefined) {
      element.removeAttribute('data-item-count');
    } else {
      element.setAttribute('data-item-count', itemCount);
    }
  }

  _syncSwipeableItemIndex() {
    const context = this._swipeableContext;
    const index = context.itemIndex;
    if (index === context.displayedIndex) {
      return;
    }
    context.displayedIndex = index;

    this._syncSwipeableListIndex(index);
    this._syncSwipeableIndicatorIndex(index);
  }

  _syncSwipeableListIndex(index) {
    const { element } = this._view;
    const listElement = element && this._getListElement(element);
    if (!listElement) {
      return;
    }
    listElement.style.left = `${-index * 100}%`;
  }

  _syncSwipeableIndicatorIndex(index) {
    const { element } = this._view;
    const indicatorElement = element && this._getSwipeableIndicatorElement(element);
    if (!indicatorElement) {
      return;
    }
    let i = 0;
    for (const item of indicatorElement.children) {
      item.classList[ i === index ? 'add' : 'remove' ]('active');
      i++;
    }
  }

  _getSwipeableIndicatorElement(element) {
    return element.querySelector('[data-role="index-indicator"]');
  }

  _emitSwipeableDisplayEvent() {
    const context = this._swipeableContext;
    const index = context.displayedIndex;
    if (context.displayEventIndex === index) {
      return;
    }
    context.displayEventIndex = index;
    this._view._events.emit('display', { index });
  }

  _onClickSwipeable(event) {
    const { target } = event;
    if (target.closest(`[data-role="previous"]`)) {
      event.preventDefault();
      this.previous();
    }
    if (target.closest(`[data-role="next"]`)) {
      event.preventDefault();
      this.next();
    }
  }

  // TODO: swipe gesture

}
