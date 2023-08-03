import ValueBuffer from './value-buffer.js';

export function polling(fetch, { interval = 1000, errorLimit = 10, onError, onResponse, signal } = {}) {
  if (signal && signal.aborted) {
    return [];
  }
  let errorCount = 0;
  const buffer = new ValueBuffer();
  const intervalId = setInterval(async () => {
    let response, finished;
    try {
      [response, finished] = await fetch(signal ? { signal } : {});
      onResponse && onResponse(response, finished);
    } catch(error) {
      onError && onError(error);
      errorCount++;
      if (errorCount > errorLimit) {
        clearInterval(intervalId);
        buffer.error(error);
      }
      return;
    }
    buffer.update(response, finished);
    if (finished) {
      clearInterval(intervalId);
    }
  }, interval);

  if (signal && signal.addEventListener) {
    signal.addEventListener('abort', () => {
      clearInterval(intervalId);
      buffer.abort(signal.reason);
    });
  }

  return buffer;
}
