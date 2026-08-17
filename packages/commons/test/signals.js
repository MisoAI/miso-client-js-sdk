import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { race, any, never } from '../src/signals.js';

function abortable(signal) {
  return new Promise((_, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  });
}

test('race: resolves with the first settled value', async () => {
  const value = await race([
    () => Promise.resolve('fast'),
    () => new Promise(resolve => setTimeout(() => resolve('slow'), 50)),
  ]);
  assert.is(value, 'fast');
});

test('race: aborts losers after settling', async () => {
  let loserSignal;
  await race([
    () => Promise.resolve('winner'),
    (signal) => {
      loserSignal = signal;
      return abortable(signal);
    },
  ]);
  assert.ok(loserSignal.aborted);
});

test('race: aborts losers on rejection, too', async () => {
  let loserSignal;
  try {
    await race([
      () => Promise.reject(new Error('boom')),
      (signal) => {
        loserSignal = signal;
        return abortable(signal);
      },
    ]);
    assert.unreachable();
  } catch (err) {
    assert.is(err.message, 'boom');
  }
  assert.ok(loserSignal.aborted);
});

test('race: external signal aborts all participants', async () => {
  const ac = new AbortController();
  const promise = race([
    (signal) => abortable(signal),
    (signal) => abortable(signal),
  ], { signal: ac.signal });
  ac.abort();
  try {
    await promise;
    assert.unreachable();
  } catch (err) {
    assert.is(err.name, 'AbortError');
  }
});

test('race: already-aborted external signal rejects immediately', async () => {
  const ac = new AbortController();
  ac.abort();
  try {
    await race([
      (signal) => abortable(signal),
    ], { signal: ac.signal });
    assert.unreachable();
  } catch (err) {
    assert.is(err.name, 'AbortError');
  }
});

test('any: returns a never-aborting signal for no arguments', () => {
  assert.not.ok(any().aborted);
});

test('any: aborts when any input signal aborts', () => {
  const ac0 = new AbortController();
  const ac1 = new AbortController();
  const signal = any(ac0.signal, ac1.signal);
  assert.not.ok(signal.aborted);
  ac1.abort();
  assert.ok(signal.aborted);
});

test('any: skips undefined signals', () => {
  const ac = new AbortController();
  const signal = any(undefined, ac.signal);
  ac.abort();
  assert.ok(signal.aborted);
});

test('never: is not aborted', () => {
  assert.not.ok(never().aborted);
});

test.run();
