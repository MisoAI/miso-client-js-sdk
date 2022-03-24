import { delegateGetters } from './objects';
import EventEmitter from './events';

export default class Component {

  constructor(type, parent) {
    if (parent === undefined && typeof type === 'object') {
      parent = type;
      type = undefined;
    }
    this._type = type;
    this._parent = parent;
  
    this._events = new EventEmitter({
      debug: this.debug.bind(this),
      error: this._error.bind(this),
    });
    delegateGetters(this, this._events, ['on', 'once']);
  }

  debug(...args) {
    const parent = this._parent;
    if (parent) {
      if (this._type) {
        args[0] = `${this._type}:${args[0]}`;
      }
      parent && parent.debug && parent.debug.apply(parent, args);
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
