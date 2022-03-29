import { delegateGetters } from '@miso.ai/commons/dist/es/objects';
import { EventEmitter } from '@miso.ai/commons';

export default class Component {

  constructor(type, parent) {
    if (parent === undefined && typeof type === 'object') {
      parent = type;
      type = undefined;
    }
    this._type = type;
    this._parent = parent;
  
    const error = this._error = this._error.bind(this);
    this._events = new EventEmitter({ error });
    delegateGetters(this, this._events, ['on', 'once']);

    this.init();
  }

  init() {}

  _error(e) {
    if (this._parent) {
      this._parent._error(e);
    } else {
      console.error(e);
    }
  }

}
