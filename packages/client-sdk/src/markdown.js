import * as _misomarkdown from '@miso.ai/progressive-markdown';

const misomarkdown = window.misomarkdown || (window.misomarkdown = {});

Object.assign(misomarkdown, _misomarkdown);

runAll(misomarkdown.onload);

const _onload = Object.freeze({ push: runAll });

Object.defineProperty(misomarkdown, 'onload', {
  get() {
    return _onload;
  },
  set(callback) {
    runAll(callback);
  }
});

function runAll(callback) {
  if (!callback) {
    return;
  }
  if (typeof callback === 'function') {
    runSafely(callback);
  } else if (Array.isArray(callback)) {
    for (const fn of callback) {
      runSafely(fn);
    }
  }
}

function runSafely(callback) {
  try {
    callback();
  } catch (error) {
    console.error(error);
  }
}
