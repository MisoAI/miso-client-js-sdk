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
