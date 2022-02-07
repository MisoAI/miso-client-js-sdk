import { delegateGetters } from './util/objects';
import Context from './context';

(function(){
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
  delegateGetters(miso, context, ['version', 'config', 'api']);
}

function execute(context, fn) {
  try {
    fn(context);
  } catch(e) {
    // TODO
    console.error(e);
  }
}
