import ContinuityObserver from './continuity';

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

/**
 * Return a promise resolved when the given element reaches viewable condition.
 */
export async function viewable(element, {
  area = 0.5,
  duration = 1000,
  signal,
} = {}) {
  element = asElement(element);
  // TODO: check element
  return new Promise((resolve) => {
    const continuity = new ContinuityObserver((value) => {
      if (value) {
        continuity.disconnect();
        intersection.disconnect();
        resolve();
      }
    }, {
      onDuration: duration,
    });
    const intersection = new IntersectionObserver((entries) => {
      continuity.value = entries[0].isIntersecting;
    }, {
      threshold: area,
    });
    intersection.observe(element);

    if (signal && signal.addEventListener) {
      signal.addEventListener('abort', () => {
        continuity.disconnect();
        intersection.disconnect();
      });
    }
  });
}
