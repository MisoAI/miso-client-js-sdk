import { defineValues } from '@miso.ai/commons';
import * as fields from './fields';
import ProxyElement from './proxy';

// TODO: merge with views reactor?

export default class ElementsBinder {

  constructor(saga) {
    this._saga = saga;
    defineValues(saga, {
      elements: new Elements(saga),
    });
  }

  get(role) {
    return this._saga.states[fields.element(role)];
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
    this._emit(role, element);
  }

  unbind(role) {
    const element = this.get(role);
    if (!element) {
      return;
    }
    this._emit(role, undefined);
  }

  _emit(role, element) {
    this._saga.update(fields.element(role), element);
    this._saga.trigger(fields.element(), { role, element });
  }

  destroy() {
    this._saga.elements._destroy();
    // TODO: unbind all
  }

}

class Elements {

  constructor(saga) {
    this._saga = saga;
    this._proxies = {};
  }

  get(role) {
    return this._saga.states[fields.element(role)];
  }

  proxy(role) {
    return this._proxies[role] || (this._proxies[role] = new ProxyElement(this._saga, role));
  }

  on(role, callback) {
    return this._saga.on(fields.element(role), callback);
  }

  _destroy() {
    const proxies = this._proxies;
    // TODO: use values
    for (const key of Object.keys(proxies)) {
      proxies[key]._destroy();
    }
    this._proxies = {};
  }

}
