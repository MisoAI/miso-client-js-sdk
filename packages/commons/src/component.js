import { defineValues, defineTypeByKey } from './objects';
import { uuidv4 } from './uuid';
import EventEmitter from './events';

function buildMeta(name, parent) {
  if (name !== undefined && typeof name !== 'string' && parent === undefined) {
    parent = name;
    name = undefined;
  }

  if (name !== undefined && (typeof name !== 'string' || !name)) {
    throw new Error(`Invalid Component name: "${name}"`);
  }

  return Object.freeze({
    name,
    parent,
    path: buildPath(name, parent),
    uuid: uuidv4(),
  });
}

function buildPath(name, parent) {
  return Object.freeze([...(parent && parent.meta && parent.meta.path || []), ...(name ? [name] : [])]);
}

export default class Component {

  constructor(name, parent) {
    const meta = buildMeta(name, parent);
    defineValues(this, { meta });
  
    const error = this._error = this._error.bind(this);
    const events = this._events = new EventEmitter({ error, replays: ['child'] });
    events._injectSubscribeInterface(this);

    this._warn =  this._warn.bind(this);

    parent = meta.parent;
    parent && parent._events && parent._events.emit('child', this);
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
