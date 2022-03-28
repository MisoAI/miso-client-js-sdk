/**
 * Remove the specified item from array.
 */
export function removeItem(array, item) {
  const i = array.indexOf(item);
  if (i > -1) {
    array.splice(i, 1);
  }
}
