import { removeItem } from '@miso.ai/commons';

export default class ProxyElement {

  constructor(element) {
    this._get = typeof element === 'function' ? element : () => element;
    this._handlers = [];
    this._elementUpdatedHandlers = [];
    this.sync();
  }

  get current() {
    return this._element;
  }

  on(event, handler) {
    if (event === 'element') {
      return this._onElementUpdated(handler);
    }
    const element = this._get();
    if (element) {
      element.addEventListener(event, handler);
    }
    this._handlers.push({ event, handler });
    return () => this._off(event, handler);
  }

  _off(event, handler) {
    const element = this._get();
    if (element) {
      element.removeEventListener(event, handler);
    }
    removeItem(this._handlers, handler);
  }

  _onElementUpdated(handler) {
    this._elementUpdatedHandlers.push(handler);
    return () => {
      removeItem(this._elementUpdatedHandlers, handler);
    };
  }

  sync({ silent = false } = {}) {
    const element = this._get();
    if (this._element === element) {
      return;
    }
    this._offAllFromCurrentElement();
    if (element) {
      for (const { event, handler } of this._handlers) {
        element.addEventListener(event, handler);
      }
    }
    const oldElement = this._element;
    this._element = element;

    if (silent) {
      return;
    }
    for (const handler of this._elementUpdatedHandlers) {
      try {
        handler(element, oldElement);
      } catch (e) {
        console.error(e); // TODO
      }
    }
  }

  _offAllFromCurrentElement() {
    if (this._element) {
      for (const { event, handler } of this._handlers) {
        this._element.removeEventListener(event, handler);
      }
    }
  }

  destroy() {
    this._offAllFromCurrentElement();
  }

}
