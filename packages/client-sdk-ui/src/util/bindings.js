function tuple(keys, values, elements) {
  const k2b = new Map();
  const e2b = new Map();
  const entries = [];
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const element = elements[index];
    const value = values[index];
    const entry = Object.freeze({ index, key, value, element });
    k2b.set(key, entry);
    e2b.set(element, entry);
    entries.push(entry);
  }
  return { k2b, e2b, entries };
}

function diff(from, to) {
  const entries = [];
  for (const entry of to.entries) {
    const f = from.e2b.get(entry.element);
    if (!f || f.key !== entry.key) {
      entries.push(entry);
    }
  }
  return entries;
}

export default class Bindings {

  constructor() {
    this._k2b = new Map();
    this._e2b = new Map();
    this._entries = [];
  }

  get entries() {
    return [...this._entries];
  }

  get(element) {
    return this._e2b.get(element) || undefined;
  }

  update(keys, values, elements) {
    const newTuple = tuple(keys, values, elements);
    const oldTuple = { k2b: this._k2b, e2b: this._e2b, entries: this._entries };

    const bounds = diff(oldTuple, newTuple);
    const unbounds = diff(newTuple, oldTuple);

    this._k2b = newTuple.k2b;
    this._e2b = newTuple.e2b;
    this._entries = newTuple.entries;

    return { bounds, unbounds };
  }

  clear() {
    const unbounds = this._entries;
    this._k2b = new Map();
    this._e2b = new Map();
    this._entries = [];
    return { bounds: [], unbounds };
  }

}
