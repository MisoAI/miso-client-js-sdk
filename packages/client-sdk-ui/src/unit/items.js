import { isElement, isInDocument } from '@miso.ai/commons';
import { ATTR_DATA_MISO_PRODUCT_ID } from '../constants';

export default class Items {

  constructor(unit) {
    this._unit = unit;
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

  refresh() {
    if (!this._unit.element) {
      return this.unbindAll();
    }
    const unbounds = this._purge();
    const elements = this._unit.element.querySelectorAll(`[${ATTR_DATA_MISO_PRODUCT_ID}]`);
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
    //this._emitChange({ bounds, unbounds });
    return { bounds, unbounds };
  }

  unbindAll() {
    const unbounds = this.list();
    this._bindings.clear();
    //this._emitChange({ unbounds });
    return { bounds: [], unbounds };
  }

  /*
  bind(productId, element) {
    const [binding, ...unbounds] = this._bind(productId, element);
    this._emitChange({ bounds: [binding], unbounds });
    return binding;
  }

  unbind(ref) {
    const binding = this.get(ref);
    if (binding) {
      this._unbind(binding);
      this._emitChange({ bounds: [binding] });
    }
    return binding;
  }
  */

  // TODO: move to trigger
  /*
  watch() {
    const observer = this._mutationObserver = new MutationObserver(() => this.refresh());
    observer.observe(this._unit.element, { childList: true, subtree: true });
    this.refresh();
  }

  unwatch() {
    this._mutationObserver && this._mutationObserver.disconnect();
  }
  */



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

  /*
  _emitChange({ bounds = [], unbounds = [] }) {
    if (bounds.length === 0 && unbounds.length === 0) {
      return;
    }
    this._unit._events.emit('items', { bounds, unbounds });
  }
  */

  _destroy() {
    //this.unwatch();
    this.unbindAll();
  }

}
