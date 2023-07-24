import Resolution from './resolution';

const symbol = Symbol.for('miso:resources');

class Resources {

  constructor() {
    this._resources = new Map();
    const pushed = window[symbol] || [];
    for (const args of pushed) {
      try {
        const [name, resource] = args;
        this.push([name, resource]);
      } catch (_) {
        // TODO
      }
    }
  }

  push([name, resource]) {
    getOrCreate(this._resources, name).resolve(resource);
  }

  async get(name) {
    return getOrCreate(this._resources, name).promise;
  }

  /*
  *[Symbol.iterator]() {
    for (const [name, resource] of this._resources) {
      yield [name, resource.promise];
    }
  }
  */

}

function getOrCreate(map, key) {
  if (map.has(key)) {
    return map.get(key);
  }
  const value = new Resolution();
  map.set(key, value);
  return value;
}

export default function get() {
  return window[symbol] || (window[symbol] = new Resources());
}
