import { isElement, isInDocument } from '@miso.ai/commons';
import { ATTR_DATA_MISO_PRODUCT_ID } from '../constants';

export default class Items {

  constructor() {
    this._bindings = new Map();
    this._e2b = new WeakMap();
  }

  list() {
    return [...this._bindings.values()];
  }

  get(ref) {
    if (!ref) {
      throw new Error(`Product ID or element is required.`);
    }
    return isElement(ref) ? this._e2b.get(ref) : this._bindings.get(ref);
  }

  refresh(rootElement) {
    if (!rootElement) {
      return this.unbindAll();
    }
    const unbounds = this._purge();
    const elements = rootElement.querySelectorAll(`[${ATTR_DATA_MISO_PRODUCT_ID}]`);
    const bounds = [];
    // warn for conflict productIds
    // TODO
    for (const element of elements) {
      const [binding, ...ubs] = this._bind(element);
      if (binding) {
        bounds.push(binding);
      }
      for (const u of ubs) {
        unbounds.push(u);
      }
    }
    return { bounds, unbounds };
  }

  unbindAll() {
    const unbounds = this.list();
    this._bindings.clear();
    return { bounds: [], unbounds };
  }



  _bind(productId, element) {
    if (!productId) {
      throw new Error(`Product ID or element is required.`);
    }
    if (element === undefined && isElement(productId)) {
      element = productId;
      if (!element.hasAttribute(ATTR_DATA_MISO_PRODUCT_ID)) {
        throw new Error(`No attribute "${ATTR_DATA_MISO_PRODUCT_ID} found on element ${element}"`);
      }
      productId = element.getAttribute(ATTR_DATA_MISO_PRODUCT_ID);
    }

    // check if binding already exist
    const oldBinding = this._bindings.get(productId);
    if (oldBinding && oldBinding.element === element) {
      return [];
    }
    const unbound0 = this._unbind(this.get(productId));
    const unbound1 = this._unbind(this.get(element));

    const binding = Object.freeze({ productId, element });
    this._bindings.set(productId, binding);
    this._e2b.set(element, binding);

    const results = [binding];
    unbound0 && results.push(unbound0);
    unbound1 && results.push(unbound1);

    return results;
  }

  _purge() {
    const purged = [];
    for (const binding of this._bindings.values()) {
      const { element } = binding;
      if (isInDocument(element)) {
        continue;
      }
      purged.push(this._unbind(binding));
    }
    return purged;
  }

  _unbind(binding) {
    if (binding) {
      this._bindings.delete(binding.productId);
      this._e2b.delete(binding.element);
    }
    return binding;
  }

  _destroy() {
    this.unbindAll();
  }

}
