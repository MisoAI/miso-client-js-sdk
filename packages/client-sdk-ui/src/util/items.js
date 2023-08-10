import { isElement, isInDocument, findInAncestors } from '@miso.ai/commons';

function fallbackGetItem(itemAttrName) {
  return element => element.hasAttribute(itemAttrName) ? element.getAttribute(itemAttrName) : undefined;
}

function fallbackFindElements(itemAttrName) {
  return element => element.querySelectorAll(`[${itemAttrName}]`);
}

export class Items {

  constructor({
    findElements,
    getItem,
    itemAttrName = 'data-item',
  } = {}) {
    this._findElements = findElements || fallbackFindElements(itemAttrName);
    this._getItem = getItem || fallbackGetItem(itemAttrName);
    this._bindings = new Map();
    this._e2b = new WeakMap();
  }

  list() {
    return [...this._bindings.values()];
  }

  get(ref) {
    if (!ref) {
      throw new Error(`Item or element is required.`);
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
    const elements = this._findElements(rootElement);
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
    this._root = undefined;
    return { bounds: [], unbounds };
  }



  _bind(item, element) {
    if (!item) {
      throw new Error(`Item is required.`);
    }
    if (element === undefined && isElement(item)) {
      element = item;
      item = this._getItem(element);
      if (item === undefined) {
        throw new Error(`Cannot get item from element: ${element}`);
      }
    }

    // check if binding already exist
    const oldBinding = this._bindings.get(item);
    if (oldBinding && oldBinding.element === element) {
      return [];
    }
    const unbound0 = this._unbind(this.get(item));
    const unbound1 = this._unbind(this.get(element));

    const binding = Object.freeze({ item, element });
    this._bindings.set(item, binding);
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
      this._bindings.delete(binding.item);
      this._e2b.delete(binding.element);
    }
    return binding;
  }

  _destroy() {
    this.unbindAll();
  }

}

export class SingleItems {

  constructor({ item }) {
    this._item = item;
    this._binding = undefined;
  }

  list() {
    return this._binding ? [this._binding] : [];
  }

  get(ref) {
    if (!ref) {
      throw new Error(`Item or element is required.`);
    }
    return ref === this._item || ref === this.element ? this._binding : undefined;
  }

  get element() {
    return this._binding && this._binding.element;
  }

  get binding() {
    return this._binding;
  }

  refresh(element) {
    if (element === this.element) {
      return { bounds: [], unbounds: [] };
    }
    if (!element) {
      return this.unbindAll();
    }
    const unbounds = this.list();
    this._binding = element ? Object.freeze({ item: this._item, element }) : undefined;
    const bounds = this.list();
    return { bounds, unbounds };
  }

  unbindAll() {
    const unbounds = this.list();
    this._binding = undefined;
    return { bounds: [], unbounds };
  }

  _destroy() {
    this.unbindAll();
  }

}
