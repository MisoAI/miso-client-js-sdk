/**
 * Remove the specified item from array.
 */
export function removeItem(array, item) {
  if (!array) {
    return;
  }
  const i = array.indexOf(item);
  if (i > -1) {
    array.splice(i, 1);
  }
}

export function findAndRemoveItem(array, test) {
  if (!array) {
    return;
  }
  const i = array.findIndex(test);
  if (i > -1) {
    array.splice(i, 1);
  }
}

/**
 * Wrap a value into an array:
 * 1. If it's already an array, return itself
 * 2. If it's undefined, return an empty array
 * 3. Otherwise, return a single-item array
 */
export function asArray(value) {
  return Array.isArray(value) ? value : (value === undefined) ? [] : [value];
}
