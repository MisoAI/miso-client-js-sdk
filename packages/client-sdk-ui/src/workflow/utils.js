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
  saga.update = (...args) => {
    callback('update', ...args);
    return update.apply(saga, args);
  }
  saga.trigger = (...args) => {
    callback('trigger', ...args);
    return trigger.apply(saga, args);
  }
  return saga;
}
