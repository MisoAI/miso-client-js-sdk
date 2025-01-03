/**
 * Mixin source properties into target.
 */
export function mixin(target, source) {
  const sourceDescriptors = Object.getOwnPropertyDescriptors(source);
  const targetDescriptors = Object.getOwnPropertyDescriptors(target);
  for (const [key, descriptor] of Object.entries(sourceDescriptors)) {
    if (key === 'constructor') {
      continue;
    }
    if (targetDescriptors[key] === undefined) {
      Object.defineProperty(target, key, descriptor);
    }
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
