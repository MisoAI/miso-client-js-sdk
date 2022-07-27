import { trimObj, asArray, Component } from '@miso.ai/commons';

function defaultMapping(eventKey, { products, actionField }) {
  const product_ids = products && products.map(product => product.id);
  switch (eventKey) {
    case 'detail':
      return products ? [{
        type: 'product_detail_page_view',
        product_ids,
      }] : [];
    case 'add':
      return products ? [{
        type: 'add_to_cart',
        product_ids,
        quantities: products.map(product => Number(product.quantity) || 1),
      }] : [];
    case 'remove':
      return products ? [{
        type: 'remove_from_cart',
        product_ids,
      }] : [];
    case 'checkout':
      return products ? [trimObj({
        type: 'checkout',
        product_ids,
        quantities: products.map(product => Number(product.quantity) || 1),
        revenue: actionField.revenue && Number(actionField.revenue) || undefined,
      })] : [];
    default:
      return [{
        type: 'custom',
        custom_action_name: `${eventKey}`,
      }];
  }
}

export default class Ecommerce extends Component {

  constructor(gtm) {
    super('ecommerce', gtm);
    this._gtm = gtm;
    this.mapping(defaultMapping);
    this.accept('*');
    this._handle = this._handle.bind(this);
    this._active = false;
  }

  mapping(value = defaultMapping) {
    if (typeof value !== 'function') {
      throw new Error(`Expect mapping to be a function: ${value}`);
    }
    this._mapping = value;
  }

  accept(...values) {
    this._accept = buildEventPredicate(values);
  }

  start() {
    if (this._active) {
      return;
    }
    this._active = true;
    if (!this._unsubscribe) {
      this._unsubscribe = this._gtm.stream.on('data', this._handle);
    }
  }

  stop() {
    if (!this._active) {
      return;
    }
    this._active = false;
  }

  get active() {
    return !!this._active;
  }

  _handle(data) {
    const { ecommerce } = data;
    if (!this._active || !ecommerce) {
      return;
    }
    this._events.emit('data', data);
    const payloads = this._mapEvents(ecommerce);
    this._events.emit('payloads', payloads);
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
    let payloads = [];
    for (const eventKey in ecommerce) {
      if (!this._accept(eventKey)) {
        continue;
      }
      payloads = [...payloads, ...asArray(this._mapping(eventKey, ecommerce[eventKey]))];
    }
    return payloads;
  }

}

Object.defineProperties(Ecommerce.prototype, {
  helpers: {
    value: Object.freeze({
      defaultMapping,
    }),
  },
});

function buildEventPredicate(events) {
  if (events.length === 1 && events[0] === '*') {
    return () => true;
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
