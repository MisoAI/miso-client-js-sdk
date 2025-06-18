import { trimObj } from '@miso.ai/commons';

export function trimAndFreeze(obj) {
  return Object.freeze(trimObj(obj));
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function deepEquals(a, b) {
  if (typeof a !== typeof b) {
    return false;
  }
  if (typeof a !== 'object') {
    return a === b;
  }
  return Array.isArray(a) ? deepEqualsArray(a, b) : deepEqualsObjects(a, b);
}

function deepEqualsArray(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (!deepEquals(a[i], b[i])) {
      return false;
    }
  }
  return true;
}

function deepEqualsObjects(a, b) {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) {
    return false;
  }
  keysA.sort();
  keysB.sort();
  for (let i = 0; i < keysA.length; i++) {
    if (keysA[i] !== keysB[i]) {
      return false;
    }
  }
  for (const key of keysA) {
    if (!deepEquals(a[key], b[key])) {
      return false;
    }
  }
  return true;
}
