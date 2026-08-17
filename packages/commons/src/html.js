// [browser only]

import ContinuityObserver from './continuity.js';

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
export function findInAncestors(element, fn, { root = element.ownerDocument } = {}) {
  for (; element && element !== root; element = element.parentElement) {
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
 * Define a custom element class and update all currently present ones in DOM.
 */
export function defineAndUpgrade(elementClass) {
  const { tagName } = elementClass;
  customElements.define(tagName, elementClass);
  for (const element of document.querySelectorAll(tagName)) {
    customElements.upgrade(element);
  }
}

/**
 * Same as window.requestAnimationFrame(), but as an async function.
 */
export async function requestAnimationFrame(callback) {
  return new Promise((resolve, reject) => {
    window.requestAnimationFrame(async (timestamp) => {
      try {
        await callback(timestamp);
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  });
}

/**
 * Observe an element with an IntersectionObserver and resolve when its intersection state
 * holds true continuously for the given duration. Reject on signal abort.
 */
async function sustainedIntersection(element, {
  duration = 1000,
  signal,
  ...observerOptions
} = {}) {
  element = asElement(element);
  // TODO: check element
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const disconnect = () => {
      continuity.disconnect();
      intersection.disconnect();
    };
    const continuity = new ContinuityObserver((value) => {
      if (value) {
        disconnect();
        resolve();
      }
    }, {
      onDuration: duration,
    });
    const intersection = new IntersectionObserver((entries) => {
      // entries are in chronological order; the last one reflects the current state
      continuity.value = entries[entries.length - 1].isIntersecting;
    }, observerOptions);
    intersection.observe(element);

    if (signal && signal.addEventListener) {
      signal.addEventListener('abort', () => {
        disconnect();
        reject(new DOMException('Aborted', 'AbortError'));
      });
    }
  });
}

/**
 * Return a promise resolved when the given element reaches viewable condition.
 */
export async function viewable(element, {
  area = 0.5,
  duration = 1000,
  signal,
} = {}) {
  return sustainedIntersection(element, {
    duration,
    signal,
    threshold: area,
  });
}

/**
 * Return a promise resolved when the given element overlaps the vertical center of the viewport
 * continuously for the given duration. Unlike viewable(), this works for elements much taller
 * than the viewport, which can never satisfy an area threshold.
 *
 * Note: rootMargin is not honored in cross-origin iframes, where this degrades to "any overlap
 * with the viewport", a much looser condition. Avoid relying on it in embedded contexts.
 */
export async function centered(element, {
  duration = 1000,
  signal,
} = {}) {
  return sustainedIntersection(element, {
    duration,
    signal,
    // collapse the root to a zero-height line at the viewport's vertical center;
    // isIntersecting still reports zero-area (edge-adjacent) contact
    rootMargin: '-50% 0px -50% 0px',
    threshold: 0,
  });
}

export async function waitForDomContentLoaded() {
  if (document.readyState !== 'loading') {
    return;
  }
  await new Promise(resolve => {
    document.addEventListener('DOMContentLoaded', resolve, { once: true });
  });
}

export function escapeHtml(text) {
  text = `${text}`;
  return text && text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// HTML void elements (self-closing, no closing tag)
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/**
 * Split HTML at the nth top-level close tag (or open tag for void elements) of the specified type.
 * Returns [beforeHtml, afterHtml, count] where count is the number of top-level tags found.
 */
export function splitHtmlAtNthOfType(html, tag, index) {
  tag = tag.toLowerCase();
  // split at the nth close tag (or open tag for void elements) at the top level
  // also return the count of such tags
  if (index <= 0) {
    return ['', html, 0];
  }
  // match all open and close tags (for any tag type)
  const tagPattern = /<(\/?)([\w-]+)(?:\s[^>]*)?>/gi;
  const tokens = [];
  let match;
  while ((match = tagPattern.exec(html)) !== null) {
    const isClose = match[1] === '/';
    const tagName = match[2].toLowerCase();
    const isVoid = VOID_ELEMENTS.has(tagName);
    tokens.push({
      type: isClose ? 'close' : 'open',
      tagName,
      isVoid,
      index: match.index,
      length: match[0].length,
    });
  }
  // find nth top-level tag of the specified type
  let depth = 0, count = 0, splitIndex = -1;
  for (const token of tokens) {
    if (token.type === 'open') {
      // for void elements, check if it's the target at top level before moving on
      if (token.isVoid) {
        if (depth === 0 && token.tagName === tag) {
          count++;
          if (count === index) {
            splitIndex = token.index + token.length;
            break;
          }
        }
        // void elements don't affect depth
      } else {
        depth++;
      }
    } else {
      depth--;
      if (depth === 0 && token.tagName === tag) {
        // top-level close tag of the specified type
        count++;
        if (count === index) {
          splitIndex = token.index + token.length;
          break;
        }
      }
    }
  }
  if (splitIndex < 0) {
    return [html, '', count];
  }
  return [html.slice(0, splitIndex), html.slice(splitIndex), count];
}
