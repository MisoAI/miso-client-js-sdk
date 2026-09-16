import { test } from 'uvu';
import * as assert from 'uvu/assert';

import MisoClient from '../src/detached/node.js';

/**
 * The fetch-layer retry (core ApiHelpers.fetch): transient failures —
 * network errors, timeouts, 5xx — are retried when asked, per request via
 * the request options' `retry` or client-wide via `options.request.retry`;
 * 4xx and application errors are deterministic and never retried. Off by
 * default: a retried POST is not safe for non-idempotent calls.
 */

class ScriptedFetchPlugin {

  static get id() {
    return 'test:scripted-fetch';
  }

  install(MisoClient, { setCustomFetch }) {
    // script the transport: one entry per attempt (the last one repeats) —
    // an Error to reject with, or { status, body } to respond with
    MisoClient.scriptFetch = script => {
      const state = { attempts: 0 };
      setCustomFetch(async () => {
        const step = script[Math.min(state.attempts++, script.length - 1)];
        if (step instanceof Error) {
          throw step;
        }
        const { status = 200, body = {} } = step;
        return { status, json: async () => body };
      });
      return state;
    };
  }

}

MisoClient.plugins.use(ScriptedFetchPlugin);

const OK = { status: 200, body: { data: { threads: [], has_more: false } } };

test('api: retry recovers from transient failures — network errors and 5xx', async () => {
  const state = MisoClient.scriptFetch([
    new TypeError('network down'),
    { status: 502, body: { message: 'bad gateway' } },
    OK,
  ]);
  const client = new MisoClient({ apiKey: 'test' });
  const value = await client.api.ask.userHistory.getThreads({ rows: 3 }, { retry: 2 });
  assert.is(state.attempts, 3);
  assert.equal(value.threads, []);
});

test('api: retries spent — the last failure is thrown', async () => {
  const state = MisoClient.scriptFetch([new TypeError('network down')]);
  const client = new MisoClient({ apiKey: 'test' });
  try {
    await client.api.ask.userHistory.getThreads({ rows: 3 }, { retry: 2 });
    assert.unreachable('expected a rejection');
  } catch (e) {
    assert.instance(e, TypeError);
  }
  assert.is(state.attempts, 3);
});

test('api: a 4xx is deterministic — never retried', async () => {
  const state = MisoClient.scriptFetch([{ status: 400, body: { message: 'bad request' } }, OK]);
  const client = new MisoClient({ apiKey: 'test' });
  try {
    await client.api.ask.userHistory.getThreads({ rows: 3 }, { retry: 2 });
    assert.unreachable('expected a rejection');
  } catch (e) {
    assert.is(e.status, 400);
  }
  assert.is(state.attempts, 1);
});

test('api: off by default; client-wide via options.request.retry', async () => {
  let state = MisoClient.scriptFetch([new TypeError('network down'), OK]);
  let client = new MisoClient({ apiKey: 'test' });
  try {
    await client.api.ask.userHistory.getThreads({ rows: 3 });
    assert.unreachable('expected a rejection');
  } catch (e) {
    assert.instance(e, TypeError);
  }
  assert.is(state.attempts, 1);

  state = MisoClient.scriptFetch([new TypeError('network down'), OK]);
  client = new MisoClient({ apiKey: 'test', request: { retry: 1 } });
  const value = await client.api.ask.userHistory.getThreads({ rows: 3 });
  assert.is(state.attempts, 2);
  assert.equal(value.threads, []);
});

test.run();
