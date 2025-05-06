function execute(fn, {
  onError = e => console.error(e),
  transform = fn => fn,
} = {}) {
  try {
    transform(fn)();
  } catch (e) {
    onError(e);
  }
}

export function cmd(key, options) {
  const cmds = window[key] || (window[key] = []);
  if (cmds._processed) {
    return;
  }
  cmds._processed = true;

  const exec = fn => execute(fn, options);
  
  // overrides push function so future commands are executed immediately
  Object.defineProperty(cmds, 'push', { value: exec });
  
  // process existing miso commands
  for (const fn of cmds) {
    exec(fn);
  }
}
