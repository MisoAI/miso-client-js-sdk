export default class Config {

  constructor(parent, values) {
    Object.defineProperty(this, '_parent', {
      value: parent
    });
    Object.defineProperty(this, 'effectively', {
      value: cascade(this, parent)
    });
    Object.assign(this, values);
  }

  get values() {
    return Object.assign({}, this);
  }

}

function cascade(a, b) {
  if (typeof a !== 'object' || (b && typeof b !== 'object')) {
    throw new Error('Expect both arguments to be a object');
  }
  return new Proxy({}, {
    get: function(obj, prop) {
      return a[prop] !== undefined ? a[prop] : b && b[prop];
    },
  });
}
