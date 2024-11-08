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
