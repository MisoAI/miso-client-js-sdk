import { trimObj } from '@miso.ai/commons';

export default class Ecommerce {

  constructor(gtm) {
    this._gtm = gtm;
    gtm._plugin.on('data', this._handle.bind(this));
  }

  _setup({ mapping, events, active } = {}) {
    this._mappings = normailizeMappings(mapping);
    this._accept = buildEventPredicate(events);
    this._active = (active === undefined) || !!active;
  }

  _handle({ ecommerce } = {}) {
    if (!this._active || !ecommerce) {
      return;
    }
    const payloads = this._mapEvents(ecommerce);
    for (const payload of payloads) {
      try {
        this._gtm._client.api.interactions.upload(payload);
      } catch(e) {
        // TODO: send to root component
        console.error(e);
      }
    }
  }

  _mapEvents(ecommerce) {
    const payloads = [];
    for (const eventKey in ecommerce) {
      if (!this._accept(eventKey)) {
        continue;
      }
      const payload = this._mapEvent(eventKey, ecommerce[eventKey]);
      payload && payloads.push(trimObj(payload));
    }
    return payloads;
  }

  _mapEvent(eventKey, { products, actionField }) {
    const mappings = this._mappings;
    const product_ids = products && products.map(mappings.productId);
    const product_group_ids = mappings.productGroupId && products && products.map(mappings.productGroupId);
  
    switch (eventKey) {
      case 'detail':
        return products && {
          type: 'product_detail_page_view',
          product_ids,
          product_group_ids,
        };
      case 'add':
        return products && {
          type: 'add_to_cart',
          product_ids,
          product_group_ids,
          quantities: products.map(mappings.quantity),
        };
      case 'remove':
        return products && {
          type: 'remove_from_cart',
          product_ids,
          product_group_ids,
        };
      case 'checkout':
        return products && {
          type: 'checkout',
          product_ids,
          product_group_ids,
          quantities: products.map(mappings.quantity),
          revenue: actionField.revenue,
        };
      default:
        return {
          type: 'custom',
          custom_action_name: `${eventKey}`,
        };
    }
  }

}

function normailizeMappings(mappings = {}) {
  return {
    productId: normalizeMapping(mappings.productId || mappings.product_id) || (obj => obj.id),
    productGroupId: normalizeMapping(mappings.productGroupId || mappings.product_group_id),
    quantity: normalizeMapping(mappings.quantity) || (obj => obj.quantity || 1),
  };
}

function normalizeMapping(mapping) {
  return typeof mapping === 'string' ? obj => `${obj[mapping]}` : typeof mapping === 'function' ? obj => `${mapping(obj)}` : undefined;
}

function buildEventPredicate(events) {
  if (events === undefined) {
    return () => true;
  }
  if (!Array.isArray(events)) {
    events = [events];
  }
  const inclusion = new Set();
  const exclusion = new Set();
  let inclusive = true;
  for (const eventKey of events) {
    if (eventKey === '*') {
      inclusive = false;
    } else if (eventKey.startsWith('-')) {
      exclusion.add(eventKey.substring(1));
    } else {
      inclusion.add(eventKey);
    }
  }
  return assembleEventPredicate(inclusive, inclusive ? inclusion : exclusion);
}

function assembleEventPredicate(inclusive, events) {
  return eventKey => inclusive === events.has(eventKey);
}
