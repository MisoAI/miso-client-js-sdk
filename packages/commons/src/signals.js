export function never() {
  return new AbortController().signal;
}

/**
 * Race a list of async functions, calling each with a shared AbortSignal which is aborted
 * as soon as the race settles, so losing tasks can clean up after themselves.
 * An optional external signal is chained into the shared one.
 */
export async function race(fns, { signal } = {}) {
  const ac = new AbortController();
  signal = any(signal, ac.signal);
  try {
    return await Promise.race(fns.map(fn => fn(signal)));
  } finally {
    ac.abort();
  }
}

export function any(...signals) {
  const length = signals.length;
  if (length === 0) {
    return never();
  }
  if (length === 1) {
    return signals[0];
  }
  const ac = new AbortController();
  for (const signal of signals) {
    if (!signal || !signal.addEventListener) {
      continue;
    }
    if (signal.aborted) {
      return AbortSignal.abort(signal.reason);
    }
    signal.addEventListener('abort', () => ac.abort(signal.reason));
  }
  return ac.signal;
}
