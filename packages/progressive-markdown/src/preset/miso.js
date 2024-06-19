import remarkGfm from 'remark-gfm';
import rehypeMinifyWhitespace from 'rehype-minify-whitespace';
import rehypeLinkClass from '../rehype-link-class.js';
import { mergeRendererOptions } from '../utils.js';

export default function miso({ onCitationLink, onRefChange, onDone, cursorClass, getSource, ...options } = {}) {
  validateType('onCitationLink', onCitationLink, 'function');
  validateType('onRefChange', onRefChange, 'function');
  validateType('onDone', onDone, 'function');
  validateType('cursorClass', cursorClass, 'string');
  validateType('getSource', getSource, 'function');

  getSource = runSafely(getSource);
  onRefChange = runSafely(onRefChange);
  onDone = runSafely(onDone);

  if (onCitationLink) {
    const originalOnCitationLink = onCitationLink;
    onCitationLink = (methods, index) => {
      const source = getSource(index);
      try {
        originalOnCitationLink(methods, { source, index });
      } catch (error) {
        console.error(error);
      }
    };
  }

  return mergeRendererOptions({
    parser: {
      remark: [remarkGfm],
      rehype: [rehypeMinifyWhitespace, () => rehypeLinkClass(onCitationLink)],
    },
    onCitationLink,
    onRefChange: (oldRef, newRef) => {
      if (cursorClass) {
        oldRef && oldRef.classList.remove(cursorClass);
        newRef && newRef.classList.add(cursorClass);
      }
      onRefChange(oldRef, newRef);
    }, 
    onDone: (element) => {
      element.classList.add('done');
      onDone(element);
    },
  }, options);
}

function validateType(name, value, type) {
  if (value !== undefined && typeof value !== type) {
    throw new TypeError(`${name} must be a ${type} or undefined`);
  }
}

function runSafely(fn) {
  if (!fn) {
    return () => {};
  }
  return (...args) => {
    try {
      return fn(...args);
    } catch (error) {
      console.error(error);
    }
  };
}
