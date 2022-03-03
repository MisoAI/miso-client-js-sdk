import { BUILD } from './constants';

class Admin {

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
  if (window.misoadm) {
    return;
  }
  const adm = window.misoadm || (window.misoadm = new Admin());
})();

window.setTimeout(function () {
  const misocmd = window.misocmd || (window.misocmd = []);
  if (misocmd._processed) {
    return;
  }
  // overrides push function so future commands are executed immediately
  Object.defineProperty(misocmd, 'push', {
    value: execute.bind(undefined, window.misoadm),
  });
  // process existing miso commands
  for (const fn of misocmd) {
    execute(window.misoadm, fn);
  }
}, 0);

export default function getContext(client) {
  if (client) {
    window.misoadm.register(client);
  }
  return window.misoadm;
}
