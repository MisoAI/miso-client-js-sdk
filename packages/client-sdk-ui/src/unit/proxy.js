export default class ProxyElement {

  constructor(unit) {
    this._unit = unit;
    this._handlers = [];
    this._unsubscribes = [
      unit.on('bind', element => this._onBind(element)),
      unit.on('unbind', element => this._onUnbind(element)),
    ];
  }

  on(event, handler) {
    const { element } = this._unit;
    if (element) {
      element.addEventListener(event, handler);
    }
    this._handlers.push({ event, handler });
    return () => this._off(event, handler);
  }

  _off(event, handler) {
    const { element } = this._unit;
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

  _onBind(element) {
    for (const { event, handler } of this._handlers) {
      element.addEventListener(event, handler);
    }
  }

  _onUnbind(element) {
    for (const { event, handler } of this._handlers) {
      element.removeEventListener(event, handler);
    }
  }

  _destroy() {
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

}