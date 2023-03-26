export default class ProxyElement {

  constructor(saga, role) {
    this._saga = saga;
    this._role = role;
    this._handlers = [];
    this._unsubscribes = [
      saga.elements.on(role, () => this._sync()),
    ];
    this._sync();
  }

  _get() {
    return this._saga.elements.get(this._role);
  }

  on(event, handler) {
    const element = this._get();
    if (element) {
      element.addEventListener(event, handler);
    }
    this._handlers.push({ event, handler });
    return () => this._off(event, handler);
  }

  _off(event, handler) {
    const { element } = this._get();
    if (element) {
      element.removeEventListener(event, handler);
    }
    for (let i = 0; i < this._handlers.length; i++) {
      if (this._handlers[i].event === event && this._handlers[i].handler === handler) {
        this._handlers.splice(i, 1);
        break;
      }
    }
  }

  _sync() {
    const element = this._get();
    if (this._element === element) {
      return;
    }
    if (this._element) {
      for (const { event, handler } of this._handlers) {
        this._element.removeEventListener(event, handler);
      }
    }
    if (element) {
      for (const { event, handler } of this._handlers) {
        element.addEventListener(event, handler);
      }
    }
    this._element = element;
  }

  _destroy() {
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

}