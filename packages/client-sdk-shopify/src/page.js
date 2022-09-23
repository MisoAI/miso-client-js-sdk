import { Component } from '@miso.ai/commons';
import { parseUrl, api, history as _history } from 'shopify-store-utils';

export class Page extends Component {

  constructor(shopify) {
    super('page', shopify);
    this._shopify = shopify;
    this._init = false;
    this._productInfoCache = {};
    this._sync = this._sync.bind(this);
  }

  start({ history = false } = {}) {
    if (!this._init) {
      this._init = true;
      setTimeout(this._sync);
    }
    if (history && !this._history) {
      this._history = {
        unsubscribe: _history.observe(this._sync)
      };
    }
  }

  async _sync() {
    const url = window.location.href;
    if (this._url && this._url === url) {
      return; // deduplicate
    }
    this._url = url;
    try {
      const payloads = await this._toInteractions(url);
      if (payloads.length > 0) {
        this._shopify._client.api.interactions.upload(payloads);
      }
    } catch(e) {
      this._error(e);
    }
  }

  async _toInteractions(url) {
    return toInteractions(url, this._productInfoCache);
  }

}

export async function toInteractions(url, productInfoCache) {
  const info = parseUrl(url);
  if (!info) {
    return [];
  }
  switch (info.type) {
    case 'home':
      return [toHomePageView(info)];
    case 'collection':
      return [toCategoryPageView(info)];
    case 'product':
      return [await toProductDetailPageView(info, productInfoCache)];
  }
  return [];
}

export function toHomePageView() {
  return { type: 'home_page_view' };
}

export function toCategoryPageView(info) {
  const { collectionHandle } = info;
  if (!collectionHandle) {
    throw new Error(`Collection handle not found: ${JSON.stringify(info)}`);
  }
  return {
    type: 'category_page_view',
    category: [collectionHandle],
  };
}

export async function toProductDetailPageView(info, productInfoCache) {
  const { productHandle } = info;
  if (!productHandle) {
    throw new Error(`Product handle not found: ${JSON.stringify(info)}`);
  }
  let variantId = info.variantId;
  const productInfo = await getProductInfo(productHandle, productInfoCache);
  const { variants, id } = productInfo;
  if (!variantId && variants && variants.length) {
    variantId = `${variants[0].id}`;
  }
  const productId = `${id}`;

  const payload = {
    type: 'product_detail_page_view',
  };
  if (productId) {
    payload.product_group_ids = [productId];
  }
  if (variantId) {
    payload.product_ids = [variantId];
  }
  return payload;
}

export async function getProductInfo(handle, productInfoCache) {
  return productInfoCache ?
    productInfoCache[handle] || (productInfoCache[handle] = await api.product(handle)) :
    api.product(handle);
}
