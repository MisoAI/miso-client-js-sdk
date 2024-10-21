import { isNullLike } from './objects.js';
import ValueBuffer from './value-buffer.js';

export function polling(fetch, { interval = 1000, errorLimit = 10, onError, onResponse, signal } = {}) {
  if (signal && signal.aborted) {
    return [];
  }
  let consecutiveErrorCount = 0, intervalId, done = false, currResRevision;
  function clear() {
    intervalId && clearInterval(intervalId);
    done = true;
  }
  const buffer = new ValueBuffer();
  intervalId = setInterval(async () => {
    let response, finished, revision;
    try {
      [response, finished, revision] = await fetch(signal ? { signal } : {});
      if (done || (!isNullLike(currResRevision) && revision <= currResRevision)) {
        return; // discard outdated response
      }
      if (!isNullLike(revision)) {
        currResRevision = revision;
      }
      onResponse && onResponse(response, finished, revision);
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
