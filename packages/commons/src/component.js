import { defineValues, defineTypeByKey } from './objects.js';
import { uuidv4 } from './uuid.js';
import EventEmitter from './events.js';

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

  _warn(...args) {
    const parent = this.meta.parent;
    ((parent && parent._warn) || console.warn)(...args);
  }

  _error(...args) {
    const parent = this.meta.parent;
    ((parent && parent._error) || console.error)(...args);
  }

}

defineTypeByKey(Component, 'miso:component');
