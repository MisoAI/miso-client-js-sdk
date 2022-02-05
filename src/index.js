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
  // TODO: extract utils
  Object.defineProperties(miso, {
    // overrides push function so future commands are executed immediately
    push: {
      value: execute.bind(undefined, context),
    },
    config: {
      get: function() {
        return context.config.bind(context);
      },
    },
    api: {
      get: function() {
        return context.api;
      },
    },
    version: {
      get: function() {
        return context.version;
      },
    },
  });
}

function execute(context, fn) {
  try {
    fn(context);
  } catch(e) {
    // TODO
    console.error(e);
  }
}
