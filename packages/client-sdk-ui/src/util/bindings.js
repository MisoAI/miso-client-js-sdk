import { isElement, isInDocument, findInAncestors } from '@miso.ai/commons';

export function fallbackListFunction(keyAttrName) {
  return element => Array.from(element.querySelectorAll(`[${keyAttrName}]`)).map(element => ({
    element,
    value: {
      product_id: element.getAttribute(keyAttrName), // TODO: product_id is ad-hoc
    },
  }));
}

export class Bindings {

  constructor({
    keyAttrName = 'data-key',
    list,
  } = {}) {
    this._list = list || fallbackListFunction(keyAttrName);
    this._bindings = new Map();
    this._e2b = new WeakMap();
  }

  list() {
    return [...this._bindings.values()];
  }

  get(ref) {
    if (!ref) {
      throw new Error(`Value or element is required.`);
    }
    if (!this._root) {
      return undefined;
    }
    if (!isElement(ref)) {
      return this._bindings.get(ref);
    }
    return findInAncestors(ref, element => this._e2b.get(element) || undefined, { root: this._root });
  }

  refresh(rootElement) {
    if (!rootElement) {
      return this.unbindAll();
    }
    this._root = rootElement;
    const unbounds = this._purge();
    const bounds = [];
    // warn for conflict productIds
    // TODO
    for (const pair of this._list(rootElement)) {
      const [binding, ...ubs] = this._bind(pair);
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
    this._root = undefined;
    return { bounds: [], unbounds };
  }



  _bind({ element, key, value }) {
    key = key || value;
    if (!key) {
      throw new Error(`Key or value is required.`);
    }
    if (!element) {
      throw new Error(`Element is required.`);
    }

    // check if binding already exist
    const oldBinding = this._bindings.get(key);
    if (oldBinding && oldBinding.element === element) {
      return [];
    }
    const unbound0 = this._unbind(this.get(key));
    const unbound1 = this._unbind(this.get(element));

    const binding = Object.freeze({ key, value, element });
    this._bindings.set(key, binding);
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
      this._bindings.delete(binding.key);
      this._e2b.delete(binding.element);
    }
    return binding;
  }

  _destroy() {
    this.unbindAll();
  }

}
