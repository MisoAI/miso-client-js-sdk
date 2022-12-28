/**
 * Convert value to string, except for undefined and null.
 */
export function asString(value) {
  return value !== undefined && value !== null ? `${value}` : value;
}

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
 * Return a new object which has the same set of properties of the given object and their values mapped by the given function.
 */
export function mapValues(obj, fn) {
  const result = {};
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      result[k] = fn(obj[k], k);
    }
  }
  return result;
}

/**
 * Delegate getters and methods from source object to target object.
 */
export function delegateGetters(target, source, propNames) {
  propNames = typeof propNames === 'string' ? [propNames] : propNames;
  Object.defineProperties(target, propNames.reduce((acc, propName) => {
    acc[propName] = typeof source[propName] === 'function' ? { value: source[propName].bind(source) } : { get: () => source[propName] };
    return acc;
  }, {}));
}

/**
 * Delegate setters from source object to target object.
 */
export function delegateSetters(target, source, propNames) {
  propNames = typeof propNames === 'string' ? [propNames] : propNames;
  Object.defineProperties(target, propNames.reduce((acc, propName) => {
    acc[propName] = { set: (value) => { source[propName] = value; } };
    return acc;
  }, {}));
}

/**
 * Delegate setters from source object to target object.
 */
export function delegateProperties(target, source, propNames) {
  propNames = typeof propNames === 'string' ? [propNames] : propNames;
  Object.defineProperties(target, propNames.reduce((acc, propName) => {
    acc[propName] = {
      get: () => source[propName],
      set: (value) => { source[propName] = value; },
    };
    return acc;
  }, {}));
}

/**
 * Assign values on target object with Object.defineProperties() from source object.
 */
export function defineValues(target, source) {
  for (const name in source) {
    if (source.hasOwnProperty(name)) {
      Object.defineProperty(target, name, { value: source[name] });
    }
  }
}

/**
 * Offer the constructor a isTypeOf() static method to determine whether an object is a instance of the type that works *across* different script sources.
 */
export function defineTypeByKey(constructor, key) {
  const sym = Symbol.for(key);
  Object.defineProperty(constructor, sym, { value: true });
  Object.defineProperty(constructor, 'isTypeOf', {
    value: (obj) => obj && (obj instanceof constructor) || (typeof obj.constructor === 'function' && obj.constructor[sym] === true)
  });
}
