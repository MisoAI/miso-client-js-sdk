import ValueBuffer from './value-buffer.js';

export function polling(fetch, { interval = 1000, errorLimit = 10, onError, onResponse, signal } = {}) {
  if (signal && signal.aborted) {
    return [];
  }
  let consecutiveErrorCount = 0, currReqIndex = -1, currResIndex = -1, done = false, intervalId;
  function clear() {
    intervalId && clearInterval(intervalId);
    done = true;
  }
  const buffer = new ValueBuffer();
  intervalId = setInterval(async () => {
    const index = ++currReqIndex;
    let response, finished;
    try {
      [response, finished] = await fetch(signal ? { signal } : {});
      if (done || index < currResIndex) {
        return; // discard outdated response
      }
      currResIndex = index;
      onResponse && onResponse(response, finished);
      consecutiveErrorCount = 0;
    } catch(error) {
      onError && onError(error);
      consecutiveErrorCount++;
      if (consecutiveErrorCount > errorLimit) {
        clear();
        buffer.error(error);
      }
      return;
    }
    buffer.update(response, finished);
    if (finished) {
      clear();
    }
  }, interval);

  if (signal && signal.addEventListener) {
    signal.addEventListener('abort', () => {
      clear();
      buffer.abort(signal.reason);
    });
  }

  return buffer;
}
