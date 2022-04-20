function execute(onError, fn) {
  try {
    fn();
  } catch (e) {
    onError(e);
  }
}

export default function(key, onError = e => console.error(e)) {
  const cmds = window[key] || (window[key] = []);
  if (cmds._processed) {
    return;
  }
  cmds._processed = true;

  const exec = fn => execute(onError, fn);
  
  // overrides push function so future commands are executed immediately
  Object.defineProperty(cmds, 'push', { value: exec });
  
  // process existing miso commands
  for (const fn of cmds) {
    exec(fn);
  }
}
