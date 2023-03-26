import { defineValues } from '@miso.ai/commons';
import ProxyElement from './proxy';

export default class ElementsBinder {

  constructor(saga) {
    this._saga = saga;
    defineValues(saga, {
      elements: new Elements(saga),
    });
  }

  get(role) {
    return this._saga.states[`element_${role}`];
  }

  bind(role, element) {
    // TODO: validate element
    const current = this.get(role);
    if (current === element) {
      return;
    }
    if (current) {
      throw new Error(`There is already an element bound to the role: '${role}'`);
    }
    this._saga.update(`element_${role}`, element);
  }

  unbind(role) {
    const element = this.get(role);
    if (!element) {
      return;
    }
    this._saga.update(`element_${role}`, undefined);
  }

  destroy() {
    this._saga.elements._destroy();
  }

}

class Elements {

  constructor(saga) {
    this._saga = saga;
    this._proxies = {};
  }

  get(role) {
    return this._saga.states[`element_${role}`];
  }

  proxy(role) {
    return this._proxies[role] || (this._proxies[role] = new ProxyElement(this._saga, role));
  }

  on(role, callback) {
    return this._saga.on(`element_${role}`, callback);
  }

  _destroy() {
    const proxies = this._proxies;
    for (const key of Object.keys(proxies)) {
      proxies[key]._destroy();
    }
    this._proxies = {};
  }

}
