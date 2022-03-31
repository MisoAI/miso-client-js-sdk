import { defineValues, defineTypeByKey } from './objects';
import EventEmitter from './events';

function computeMetaInfo(name, parent, options) {
  const throwException = () => {
    throw new Error(`Invalid Component parameters: ${name}, ${parent}, ${options}`);
  };

  // settle name
  let n = name, p = parent, o = options;
  if (n !== undefined && typeof n !== 'string') {
    if (o === undefined) {
      o = p;
      p = n;
      n = undefined;
    } else {
      throwException();
    }
  }

  // settle parent
  if (p !== undefined && !Component.isTypeOf(p)) {
    if (o === undefined) {
      o = p;
      p = undefined;
    } else {
      throwException();
    }
  }

  const path = Object.freeze([...(p ? p.meta.path : []), ...(n ? [n] : [])]);
  // TODO: uuid

  return Object.freeze({
    name: n,
    parent: p,
    options: o || {},
    path,
  });
}

function mergeEventOptions(options = {}, error) {
  return {
    ...options,
    replay: [...(options.replay || []), 'child'],
    error,
  };
}

export default class Component {

  constructor(name, parent, options) {
    const meta = computeMetaInfo(name, parent, options);
    defineValues(this, { meta });
  
    const error = this._error = this._error.bind(this);
    const events = this._events = new EventEmitter(mergeEventOptions(meta.options.event, error));
    events._injectSubscribeInterface(this);

    meta.parent && meta.parent._events.emit('child', this);
  }

  _warn() {
    const parent = this.meta.parent;
    parent && parent._warn ? parent._warn.apply(parent, arguments) : console.warn.apply(console, arguments);
  }

  _error() {
    const parent = this.meta.parent;
    parent && parent._error ? parent._error.apply(parent, arguments) : console.error.apply(console, arguments);
  }

}

defineTypeByKey(Component, 'miso:component');
