import { defineValues } from './objects';

export function capture(value) {
  return new Capture(value);
}

class Capture {

  constructor(value) {
    this._value = value;
    const set = v => { this._value = v; };
    defineValues(this, {
      set,
      args: (...args) => set(args),
      t: () => set(true),
      f: () => set(false),
      merge: v => set({ ...this._value, ...v }),
    });
  }

  get value() {
    return this._value;
  }

}
