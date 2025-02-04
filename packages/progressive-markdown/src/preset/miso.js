import remarkGfm from 'remark-gfm';
import rehypeMinifyWhitespace from 'rehype-minify-whitespace';
import rehypeLinkClass from '../rehype-link-class.js';
import { mergeRendererOptions } from '../utils.js';
import { applyOperationWithSlot } from './slot.js';

export default function miso({ onCitationLink, onRefChange, onDone, onDebug, cursorClass, getSource, variant, ...options } = {}) {
  validateType('onCitationLink', onCitationLink, 'function');
  validateType('onRefChange', onRefChange, 'function');
  validateType('onDone', onDone, 'function');
  validateType('onDebug', onDebug, 'function');
  validateType('cursorClass', cursorClass, 'string');
  validateType('getSource', getSource, 'function');

  onRefChange = runSafely(onRefChange);
  onDone = runSafely(onDone);
  onDebug = runSafely(onDebug);
  getSource = runSafely(getSource);
  variant = normalizeVariantOptions(variant);

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

  let applyOperation = undefined;
  switch (variant[0]) {
    case 'slot':
      applyOperation = applyOperationWithSlot(variant[1] || {});
      break;
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
    onDebug,
    applyOperation,
  }, options);
}

function normalizeVariantOptions(options) {
  return typeof options === 'string' ? [options, {}] : Array.isArray(options) ? options : [];
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
