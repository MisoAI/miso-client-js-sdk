import EventEmitter from './events';

function normalize(name, parent, options) {
  const throwException = () => {
    throw new Error(`Invalid Component parameters: ${name}, ${parent}, ${options}`);
  };
  // settle name
  let n = name, p = parent, o = options;
  if (typeof n !== 'string') {
    if (o === undefined) {
      o = p;
      p = n;
      n = undefined;
    } else {
      throwException();
    }
  }
  // settle parent
  if (!(p instanceof Component)) {
    if (o === undefined) {
      o = p;
      p = undefined;
    } else {
      throwException();
    }
  }
  return [n, p, o || {}];
}

const staticEvents = new EventEmitter({ replay: ['create'] });

export default class Component {

  constructor(name, parent, options) {
    [name, parent, options] = normalize(name, parent, options);
    this._name = name;
    this._parent = parent;
    this._options = options;
  
    const error = this._error = this._error.bind(this);
    const events = this._events = new EventEmitter({ ...options.events, error });
    events._injectSubscribeInterface(this);
    staticEvents.emit('create', this);
  }

  _error(e) {
    if (this._parent) {
      this._parent._error(e);
    } else {
      console.error(e);
    }
  }

}

staticEvents._injectSubscribeInterface(Component);
