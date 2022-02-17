import { BUILD } from './constants';

class Context {

  constructor() {
    this.version = BUILD.version;
    this.clients = [];
  }

  register(client) {
    this.clients.push(client);
  }

}

function execute(context, fn) {
  try {
    fn(context);
  } catch (e) {
    // TODO: error handler
    console.error(e);
  }
}

(function () {
  // idempotency
  if (window.misoctx) {
    return;
  }
  const context = window.misoctx || (window.misoctx = new Context());
})();

window.setTimeout(function () {
  const misocmd = window.misocmd || (window.misoctx = []);
  if (misocmd._processed) {
    return;
  }
  // overrides push function so future commands are executed immediately
  Object.defineProperty(misocmd, 'push', {
    value: execute.bind(undefined, window.misoctx),
  });
  // process existing miso commands
  for (const fn of misocmd) {
    execute(window.misoctx, fn);
  }
}, 0);

export default function getContext(client) {
  if (client) {
    window.misoctx.register(client);
  }
  return window.misoctx;
}
