import { Component } from '@miso.ai/commons';
import { CartObserver } from 'shopify-store-utils';

export class Cart extends Component {

  constructor(shopify) {
    super('cart', shopify);
    this._shopify = shopify;
  }

  start(options) {
    if (this._observer) {
      return;
    }
    this._observer = new CartObserver();
    this._unsubscribe = this._observer.subscribe(this._handleCartEvent.bind(this));
  }

  _handleCartEvent(event) {
    const payloads = this._toInteractions(event);
    if (payloads.length > 0) {
      this._shopify._client.api.interactions.upload(payloads);
    }
  }

  _toInteractions(event) {
    return toInteractions(event);
  }

}

export function toInteractions({ newState, difference }) {
  if (!difference || !difference.items) {
    return [];
  }
  const cart_token = newState && newState.token;

  const addToCart = {
    type: 'add_to_cart',
    product_ids: [],
    product_group_ids: [],
    quantities: [],
    context: { custom_context: { cart_token } },
  };
  const removeFromCart = {
    type: 'remove_from_cart',
    product_ids: [],
    product_group_ids: [],
    context: { custom_context: { cart_token } },
  };

  for (const item of difference.items) {
    const quantity = item.quantity;
    if (quantity === 0) {
      continue; // just in case
    }
    const bucket = quantity > 0 ? addToCart : removeFromCart;
    bucket.product_ids.push(`${item.variant_id}`);
    bucket.product_group_ids.push(`${item.product_id}`);
    if (quantity > 0) {
      bucket.quantities.push(quantity);
    }
  }

  const interactions = [];

  if (addToCart.product_ids.length > 0) {
    interactions.push(addToCart);
  }
  if (removeFromCart.product_ids.length > 0) {
    interactions.push(removeFromCart);
  }
  return interactions;
}
