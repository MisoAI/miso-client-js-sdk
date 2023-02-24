let bootstrapPromise;

export default async function bootstrap() {
  return window.bootstrap || bootstrapPromise || (bootstrapPromise = createBootstrapPromise());
}

function createBootstrapPromise() {
  return new Promise((resolve) => {
    let resolved = false;
    let _bootstrap;
    Object.defineProperty(window, 'bootstrap', {
      get: () => _bootstrap,
      set: (bootstrap) => {
        _bootstrap = bootstrap;
        if (!resolved) {
          resolved = true;
          resolve(bootstrap);
        }
      },
    })
  });
}
