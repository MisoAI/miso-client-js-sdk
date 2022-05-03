const QUOTE_REGEXP = /("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')/g;

class ShadowString {

  // TODO: we may support custom id generator function
  constructor(original, shadowed, contents) {
    this._original = original;
    this._shadowed = shadowed;
    this._contents = contents;
  }

  map(fn) {
    return new ShadowString(undefined, fn(this._shadowed), this._contents);
  }

  apply(fn, ...args) {
    return new ShadowString(undefined, fn.apply(this._shadowed, args), this._contents);
  }

  unshadow() {
    return this._original || (this._original = this._shadowed.replaceAll(QUOTE_REGEXP, handle => this._contents[handle] || handle));
  }

}

const SHORTCUTS = ['replace', 'replaceAll'];
const prototype = ShadowString.prototype;
for (const n of SHORTCUTS) {
  prototype[n] = function(...args) {
    return this.apply(String.prototype[n], ...args);
  }
}

export default function shadow(original) {
  const contents = {};
  let i = 0;
  const shadowed = original.replaceAll(QUOTE_REGEXP, str => {
    const handle = `'${i++}'`;
    contents[handle] = str;
    return handle;
  });
  return new ShadowString(original, shadowed, contents);
}
