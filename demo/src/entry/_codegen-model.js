import { EventEmitter } from '@miso.ai/commons';

export default class MisoCodegenModel {

  constructor({
    spec,
    preset,
    config,
  } = {}) {
    this._events = new EventEmitter({ target: this });
    this._spec = spec;
    this._preset = preset;
    this._config = config;
  }

  get config() {
    return Object.freeze({
      preset: this._preset,
      ...this._config,
    });
  }

  set preset(value) {
    this._preset = value;
    this._events.emit('preset', { value });
  }

  clear() {
    this._config = {};
    this._events.emit('clear');
  }

  setFeature(key, value) {
    this._config = {
      ...this._config,
      [kebabToLowerCamel(key)]: value,
    };
    this._events.emit('feature', { key, value });
  }

}
