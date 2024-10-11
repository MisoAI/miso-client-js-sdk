export function dumpValue(value, { depth = 5, ...options } = {}) {
  return _dumpValue(value, depth, options);
}

function _dumpValue(value, depth, options) {
  if (depth <= 0) {
    return '(...)';
  }
  switch (typeof value) {
    case 'object':
      if (value) { // not null
        if (value.length !== undefined) {
          // array-like
          return Array.prototype.map.call(value, v => _dumpValue(v, depth - 1, options));
        } else if (value instanceof Node) {
          return dumpNode(value);
        } else {
          return dumpObj(value, depth, options);
        }
      }
    default:
      return value;
  }
}

function dumpObj(obj, depth, options) {
  const result = {};
  if (depth <= 0) {
    return result;
  }
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === 'function') {
      continue;
    }
    // this implies the property is an internal module
    if (key.startsWith('_') && typeof value === 'object' && value.constructor.name !== 'Object') {
      continue;
    }
    result[key] = _dumpValue(value, depth - 1, options);
  }
  return result;
}

function dumpNode(node) {
  if (node instanceof Element) {
    return `<${node.tagName.toLowerCase()}${node.id ? ` id="${node.id}"` : ''}${node.className ? ` class="${node.className}"` : ''}>`;
  }
  return `[TextNode](${node.length})`;
}
