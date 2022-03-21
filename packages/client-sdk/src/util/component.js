import EventEmitter from './events';

export default class Component {

  constructor(type, parent) {
    if (parent === undefined && typeof type === 'object') {
      parent = type;
      type = undefined;
    }
    this._type = type;
    this._parent = parent;
  
    const events = this._events = new EventEmitter({
      debug: this._debug.bind(this),
      error: this._error.bind(this),
    });
    this.on = events.on.bind(events);
    this.once = events.once.bind(events);
  }

  _debug() {
    if (this._parent) {
      const args = Array.prototype.slice.call(arguments);
      if (this._type) {
        args[0] = `${this._type}:${args[0]}`;
      }
      this._parent && this._parent._debug.apply(this._parent, args);
    }
  }

  _error(e) {
    if (this._parent) {
      this._parent._error(e);
    } else {
      console.error(e);
    }
  }

}
