export function mergeApiParams(base = {}, overrides = {}) {
  return Object.freeze({
    ...base,
    ...overrides,
    payload: Object.freeze({
      ...base.payload,
      ...overrides.payload,
    })
  });
}

export function injectLogger(saga, callback) {
  const { update, trigger } = saga;
  saga.update = (name, state, options) => {
    if (!options || !options.silent) {
      callback('update', name, state, options);
    }
    return update.call(saga, name, state, options);
  }
  saga.trigger = (...args) => {
    callback('trigger', ...args);
    return trigger.apply(saga, args);
  }
  return saga;
}
