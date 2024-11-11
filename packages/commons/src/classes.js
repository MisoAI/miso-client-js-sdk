/**
 * Mixin source properties into target.
 */
export function mixin(target, source) {
  const descriptors = Object.getOwnPropertyDescriptors(source);
  for (const key in descriptors) {
    if (key === 'constructor') {
      continue;
    }
    const { value } = descriptors[key];
    if (target[key] === undefined && typeof value === 'function') {
      target[key] = value;
    }
    // TODO: getter, setter
  }
}

/**
 * Turn an object into another object whose property functions are bound to the original object.
 */
export function externalize(object) {
  const externalized = {};
  const props = new Set();
  for (let o = object; o !== Object.prototype; o = Object.getPrototypeOf(o)) {
    const descriptors = Object.getOwnPropertyDescriptors(o);
    for (const key in descriptors) {
      if (key === 'constructor' || key.startsWith('_') || props.has(key)) {
        continue;
      }
      props.add(key);
      // TODO: getter, setter
      const { value } = descriptors[key];
      if (value) {
        externalized[key] = typeof value === 'function' ? value.bind(object) : value;
      }
    }
  }
  return Object.freeze(externalized);
}
