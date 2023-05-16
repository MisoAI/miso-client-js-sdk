import Component from './component';
import Resolution from './resolution';

export default class Registry extends Component {

  constructor(name, parent, { libName, keyName } = {}) {
    super(name, parent);
    this._events._replays.add('register'); // hacky but least tedious
    this._libraries = {}; // TODO: use Map so key can be any type
    this._libResolutions = {};
    this._libName = libName;
    switch (typeof keyName) {
      case 'string':
        this._keyFn = (lib => lib[keyName]);
        break;
      case 'function':
        this._keyFn = keyName;
        break;
      default:
        throw new Error(`Expect keyName to be a string or a function: ${keyName}`);
    }
  }

  isRegistered(key) {
    this._checkKey(key);
    return !!this._libraries[key];
  }

  get registered() {
    return Object.values(this._libraries);
  }

  async whenRegistered(key) {
    if (this.isRegistered(key)) {
      return this._libraries[key];
    }
    const { promise } = this._libResolutions[key] || (this._libResolutions[key] = new Resolution());
    return promise;
  }

  register(...libs) {
    for (const lib of libs) {
      this._register(lib);
    }
  }

  _checkKey(key) {
    if (typeof key !== 'string' || !key) {
      throw new Error(`Expect key to be a non-empty string: ${key}`);
    }
  }

  _checkLib(lib) {
    if (typeof lib !== 'function') {
      throw new Error(`Expect lib to be a class or function: ${lib}`);
    }
  }
  
  _register(lib) {
    this._checkLib(lib);
    const key = this._keyFn(lib);
    this._checkKey(key);
    const libs = this._libraries || (this._libraries = {});
    if (libs[key]) {
      // TODO: warn and overwrite?
    }
    libs[key] = lib;
    this._libResolutions[key] && this._libResolutions[key].resolve(lib);
    this._events.emit('register', lib);
  }

}
