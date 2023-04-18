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

export function mergeInteractionsOptions(base = {}, overrides = {}) {
  if (overrides === false) {
    return false;
  }
  return Object.freeze({
    ...base,
    ...overrides,
    preprocess: concatFunctions(base.preprocess, overrides.preprocess),
  });
}

export function injectLogger(hub, callback) {
  const { update, trigger } = hub;
  hub.update = (name, state, options) => {
    if (!options || !options.silent) {
      callback('update', name, state, options);
    }
    return update.call(hub, name, state, options);
  }
  hub.trigger = (...args) => {
    callback('trigger', ...args);
    return trigger.apply(hub, args);
  }
  return hub;
}

function concatFunctions(fn0, fn1) {
  return fn0 ? fn1 ? (...args) => fn1(fn0(...args)) : fn0 : fn1;
}
