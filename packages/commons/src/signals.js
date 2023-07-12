export function never() {
  return new AbortController().signal;
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
