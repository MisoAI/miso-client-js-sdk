import { isElement, trimObj, asArray } from '@miso.ai/commons';
import { ATTR_PRODUCT_ID } from './constants';
import { viewable as whenViewable } from '../../utils';

function mergeOptions(def, opt) {
  // if opt is falsy then return false, merge otherwise
  return !!opt && { ...def, ...opt };
}

const DEFAULT_TRACKING_OPTIONS = {
  watchElements: false,
  viewable: {
    area: 0.5,
    duration: 1000,
  },
  click: {
    lenient: false,
  }
};

const STATE = {
  INITIAL: 0,
  TRACKING: 1,
  TRIGGERED: 2,
};

export default class Tracker {

  constructor(unit) {
    this._unit = unit;
    this._eventStates = new Map();
    this._sentEvents = {
      impression: new Set(),
      viewable: new Set(),
      click: new Set(),
    };
    this._handleClick = this._handleClick.bind(this);
  }

  start(options) {
    const root = this._unit.element;
    if (!root) {
      throw new Error(`The unit has no bound element. Call unit.bind(element) to associated the unit to an element.`);
    }
    if (this._options) {
      // throw, for the options could be different and this won't be idempotent
      throw new Error(`Already tracking events.`);
    }
    // settle tracking options
    this._options = this._normalizeOptions(options);

    this._watchElements();
    this._trackClicks();

    this.sync();
  }

  sync() {
    const { impression, viewable } = this._options;
    if (!impression && !viewable) {
      return;
    }
    // scan all descendants for product item elements
    const elements = this._unit.element.querySelectorAll(`[${ATTR_PRODUCT_ID}]`);
    this._trackImpressions(elements);
    this._trackViewables(elements);
  }

  interceptEventPayload(callback) {
    this._eventPayloadPass = callback;
  }

  impression(productIds) {
    this._sendEvent('impression', productIds, true);
  }

  viewable(productIds) {
    this._sendEvent('viewable', productIds, true);
  }

  click(productIds) {
    this._sendEvent('click', productIds, true);
  }



  _normalizeOptions({ impression = {}, viewable = {}, click = {}, ...options } = {}) {
    return trimObj({
      ...DEFAULT_TRACKING_OPTIONS,
      ...options,
      impression: mergeOptions(DEFAULT_TRACKING_OPTIONS.impression, impression),
      viewable: mergeOptions(DEFAULT_TRACKING_OPTIONS.viewable, viewable),
      click: mergeOptions(DEFAULT_TRACKING_OPTIONS.click, click),
    });
  }

  _watchElements() {
    const { watchElements, impression, viewable } = this._options;
    if (!watchElements || (!impression && !viewable)) {
      return;
    }
    const observer = this._mutationObserver = new MutationObserver(mutations => {
      let hasAddedElements = false;
      let removedElements = [];
      for (const { addedNodes, removedNodes } of mutations) {
        hasAddedElements = hasAddedElements || addedNodes.length > 0;
        addedElements = [...addedElements, ...addedNodes];
        removedElements = [...removedElements, ...removedNodes];
      }
      if (hasAddedElements) {
        this.sync();
      }
      this._untrackViewables(removedElements);
    });
    observer.observe(this._element, { childList: true, subtree: true });
  }

  _unwatchElements() {
    this._mutationObserver && this._mutationObserver.disconnect();
  }

  _trackImpressions(elements) {
    const options = this._options.impression;
    if (!options) {
      return;
    }
    const productIds = [];
    for (const element of elements) {
      const productId = element.getAttribute(ATTR_PRODUCT_ID);
      if (!productId) {
        continue;
      }
      const state = this._getEventState(productId);
      if (state.impression !== STATE.TRIGGERED) {
        state.impression = STATE.TRIGGERED;
        productIds.push(productId);
      }
    }
    this._sendEvent('impression', productIds);
  }

  _trackViewables(elements) {
    const options = this._options.viewable;
    if (!options) {
      return;
    }
    for (const element of elements) {
      this._trackViewableOnElement(element);
    }
  }

  async _trackViewableOnElement(element) {
    if (!isElement(element)) {
      return;
    }
    const productId = element.getAttribute(ATTR_PRODUCT_ID);
    if (!productId) {
      return;
    }
    // TODO: when element is replaced without proper unload...
    const state = this._getEventState(productId);
    if (state.viewable !== STATE.INITIAL) {
      return;
    }
    state.viewable = STATE.TRACKING;
    const { area, duration } = this._options.viewable;
    await whenViewable(element, { area, duration });
    state.viewable = STATE.TRIGGERED;
    this._sendEvent('viewable', [productId]);
  }

  _untrackAllViewables() {
    // TODO
  }

  _untrackViewables(elements) {
    // we need to scan through all descendants to scavenge detached product items
    // TODO
  }

  _trackClicks() {
    this._unit.element.addEventListener('click', this._handleClick);
  }

  _untrackClicks() {
    this._unit.element.removeEventListener('click', this._handleClick);
  }

  _destroy() {
    this._unwatchElements();
    this._untrackClicks();
  }



  _getEventState(productId) {
    let state = this._eventStates.get(productId);
    if (!state) {
      this._eventStates.set(productId, state = {
        impression: STATE.INITIAL,
        viewable: STATE.INITIAL,
        click: STATE.INITIAL,
      });
    }
    return state;
  }

  _handleClick(event) {
    const options = this._options && this._options.click;
    if (!options) {
      return;
    }
    let productId;
    for (let element = event.target; !productId && element && element !== document; element = element.parentElement) {
      productId = element.getAttribute(ATTR_PRODUCT_ID);
    }
    if (!productId) {
      return;
    }
    const state = this._getEventState(productId);
    if (state.click === STATE.TRIGGERED) {
      return;
    }
    if (!options.lenient) {
      // only left click counts

      // event isPreventDefault

      // go through a real link

      // TODO
    }
    state.click = STATE.TRIGGERED;
    this._sendEvent('click', [productId]);
  }

  _sendEvent(type, productIds, manual) {
    if (type !== 'impression' && type !== 'viewable' && type !== 'click') {
      throw new Error(`Unrecognized event type: ${type}`);
    }
    productIds = asArray(productIds);

    // dedupe
    const sentEvents = this._sentEvents[type];
    productIds = productIds.filter(id => {
      const sent = sentEvents.has(id);
      if (!sent) {
        sentEvents.add(id);
      }
      return !sent;
    });

    if (productIds.length === 0) {
      return;
    }

    // TODO: emit

    // we want to queue the event for a while so we can merge them and save requests
    // TODO

    const client = this._unit._context._client;
    const payloads = this._buildPayloads(type, productIds, manual);
    if (payloads.length > 0) {
      client.api.interactions.upload(payloads);
    }
  }

  _buildPayloads(type, productIds, manual) {
    const { id, uuid } = this._unit;
    let payload = {
      type: type === 'viewable' ? 'viewable_impression' : type,
      product_ids: productIds,
      context: {
        custom_context: {
          unit_id: id,
          unit_instance_uuid: uuid,
          trigger: manual ? 'manual' : 'auto',
        },
      },
    };
    if (this._eventPayloadPass) {
      // TODO: handle error
      payload = this._eventPayloadPass(payload);
    }
    return asArray(payload);
  }

}
