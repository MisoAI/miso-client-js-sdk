function execute(fn) {
  try {
    fn();
  } catch (e) {
    // TODO: error handler
    console.error(e);
  }
}

export default function() {
  const misocmd = window.misocmd || (window.misocmd = []);
  if (misocmd._processed) {
    return;
  }
  misocmd._processed = true;
  
  // overrides push function so future commands are executed immediately
  Object.defineProperty(misocmd, 'push', { value: execute });
  
  // process existing miso commands
  for (const fn of misocmd) {
    execute(fn);
  }
}
