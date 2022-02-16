import { delegateGetters } from './util/objects';
import Context from './context';

(function () {
  // initialize miso object if absent
  const miso = window.miso || (window.miso = []);

  // idempotency
  if (miso.version) {
    return;
  }

  // default context
  const context = new Context();

  // inject features
  inject(miso, context);

  // process existing miso commands
  for (const fn of miso) {
    execute(context, fn);
  }
})();

function inject(miso, context) {
  Object.defineProperties(miso, {
    // overrides push function so future commands are executed immediately
    push: {
      value: execute.bind(undefined, context),
    },
  });
  delegateGetters(miso, context, ['version', 'init', 'ready', 'config', 'user', 'api']);
}

function execute(context, fn) {
  try {
    fn(context);
  } catch (e) {
    // TODO: error handler
    console.error(e);
  }
}

// this will reassign window.miso to itself by UMD, but it's ok
export default window.miso;
