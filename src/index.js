import App from './app';

(function(){
  // initialize mist object is not there yet
  const miso = window.miso || (window.miso = []);

  // check for existing miso instance
  if (miso._app) {
    return;
  }

  // default app
  const app = new App();

  // inject features
  inject(miso, app);

  // process existing miso commands
  for (const fn of miso) {
    execute(app, fn);
  }
})();

function inject(miso, app) {
  miso._app = app;

  Object.defineProperties(miso, {
    // overrides push function so future commands are executed immediately
    push: {
      value: execute.bind(undefined, app),
    },
    config: {
      get: function() {
        return app.config.bind(app);
      },
    },
    api: {
      get: function() {
        return app.api;
      },
    },
  });
}

function execute(app, fn) {
  try {
    fn();
  } catch(e) {
    // TODO
    console.error(e);
  }
}
