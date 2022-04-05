import Component from './component';

export default class Registry extends Component {

  constructor(name, parent, { libName, keyName } = {}) {
    super(name, parent);
    this._events._replays.add('register'); // hacky but least tedious
    this._libraries = {};
    this._libName = libName;
    this._keyName = keyName;
  }

  isRegistered(key) {
    this._checkKey(key);
    return !!this._libraries[key];
  }

  get registered() {
    return Object.values(this._libraries);
  }

  register(...libs) {
    for (const lib of libs) {
      this._register(lib);
    }
  }

  _checkKey(key) {
    if (typeof key !== 'string' || !key) {
      throw new Error(`Expect ${this._libName} ${this._keyName} to be a non-empty string: ${key}`);
    }
  }

  _checkLib(lib) {
    if (typeof lib !== 'function') {
      throw new Error(`Expect ${this._libName} to be a constructor or function: ${lib}`);
    }
  }
  
  _register(lib) {
    this._checkLib(lib);
    const key = lib[this._keyName];
    this._checkKey(key);
    const libs = this._libraries || (this._libraries = {});
    if (libs[key]) {
      // TODO: warn and overwrite?
    }
    libs[key] = lib;
    this._events.emit('register', lib);
  }

}
