/**
 * Convert value to element by querying selector, if value is a string. Return value otherwise.
 */
 export function asElement(value) {
  if (typeof value === 'string') {
    return document.querySelector(value);
  }
  return value;
}

/**
 * Return true of the value is an Element.
 */
export function isElement(value) {
  return typeof value === 'object' && value.nodeType === Node.ELEMENT_NODE;
}

/**
 * Compute a function along the ancestors of an element until it returns a non-undefined value;
 */
export function findInAncestors(element, fn) {
  for (; element && element !== element.ownerDocument; element = element.parentElement) {
    const value = fn(element);
    if (value !== undefined) {
      return value;
    }
  }
  return undefined;
}

/**
 * Return true if an element is attached in a document.
 */
export function isInDocument(element) {
  return element && element.ownerDocument && element.ownerDocument.contains(element);
}
