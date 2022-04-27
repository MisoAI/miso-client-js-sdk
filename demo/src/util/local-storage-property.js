export default class LocalStorageProperty {

  constructor({key, createDefaultValue}) {
    this._key = key;
    this._createDefaultValue = createDefaultValue;
    this._callbacks = [];

    try {
      const str = window.localStorage.getItem(key);
      if (str) {
        this._value = JSON.parse(str);
      } else {
        this.init();
      }
    } catch(e) {
      console.error(e);
      this.init();
    }
  }

  init() {
    this._setValue(this._createDefaultValue());
  }

  reset() {
    this.value = this._createDefaultValue();
  }

  get value() {
    return this._value;
  }

  set value(v) {
    this._setValue(v);
  }

  _setValue(newValue, init = false) {
    try {
      const str = JSON.stringify(newValue);
      const oldValue = this._value;
      this._value = newValue;
      window.localStorage.setItem(this._key, str);
      if (!init) {
        for (const callback of this._callbacks) {
          callback(newValue, oldValue);
        }
      }
    } catch(e) {
      console.error(e);
    }
  }

  onUpdate(callback) {
    this._callbacks.push((...args) => {
      try {
        callback(...args);
      } catch(e) {
        console.error(e);
      }
    });
  }

}
