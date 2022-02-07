/**
 * Remove object properties with undefined values and return the object itself.
 */
 export function trimObj(obj) {
  if (typeof obj !== 'object') {
    return obj;
  }
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] === undefined) {
      delete obj[k];
    }
  }
  return obj;
}

/**
 * Return undefined on emtpy object, or original input otherwise.
 */
export function emptyObjectToUndefined(obj) {
  return typeof obj === 'object' && Object.keys(obj).length === 0 ? undefined : obj;
}
