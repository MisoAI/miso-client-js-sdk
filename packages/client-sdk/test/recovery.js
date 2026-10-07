import { test } from 'uvu';
import * as assert from 'uvu/assert';

import MisoClient from '../src/detached/node.js';

/**
 * The API recovery (core ApiRecoveryPlugin, installed by default):
 * the `client.api.onError` callback intercepts a failed request, which then settles
 * with the outcome of the callback — an error thrown, a value returned as
 * the API result, or the outcome of `resend()`, whose failure is intercepted
 * again with the count in `error.resent`. `hold()` holds the requests issued from then
 * on until released.
 */

class TokenFetchPlugin {

  static get id() {
    return 'test:token-fetch';
  }

  install(MisoClient, { setCustomFetch }) {
    // a transport that accepts only the valid token, recording the token of
    // each request it receives
    MisoClient.mockTokens = valid => {
      const state = { valid, received: [] };
      setCustomFetch(async (url, { headers = {} } = {}) => {
        const token = headers.Authorization;
        state.received.push(token);
        return token === state.valid ?
          { status: 200, json: async () => ({ data: { threads: [], has_more: false } }) } :
          { status: 401, json: async () => ({ errors: true, message: 'Token expired' }) };
      });
      return state;
    };
  }

}

MisoClient.plugins.use(TokenFetchPlugin);

function createClient(auth) {
  const client = new MisoClient({ apiKey: 'test' });
  client.context.auth = auth;
  return client;
}

function getThreads(client) {
  return client.api.ask.userHistory.getThreads({ rows: 3 });
}

async function rejection(promise) {
  try {
    await promise;
  } catch (e) {
    return e;
  }
  assert.unreachable('expected a rejection');
}

test('onError: without a callback, the error is thrown as is', async () => {
  MisoClient.mockTokens('new');
  const client = createClient('old');
  assert.is((await rejection(getThreads(client))).status, 401);
});

test('onError: an error thrown by the callback is the outcome', async () => {
  MisoClient.mockTokens('new');
  const client = createClient('old');
  const errors = [];
  client.api.onError = async (error, { request }) => {
    errors.push([error.status, request.apiGroup, request.apiName]);
    throw new Error('signed out');
  };
  assert.is((await rejection(getThreads(client))).message, 'signed out');
  assert.equal(errors, [[401, 'ask/user_history', 'list']]);
});

test('onError: a value returned by the callback is the API result', async () => {
  MisoClient.mockTokens('new');
  const client = createClient('old');
  client.api.onError = async () => ({ threads: [{ id: 'q1' }], has_more: false });
  const value = await getThreads(client);
  assert.is(value.threads.length, 1);
  assert.is(value.threads[0].thread_id, 'q1');
});

test('onError: resend() sends the request again, with the context as of then', async () => {
  const state = MisoClient.mockTokens('new');
  const client = createClient('old');
  client.api.onError = async (error, { resend }) => {
    client.context.auth = 'new';
    return resend();
  };
  assert.equal((await getThreads(client)).threads, []);
  assert.equal(state.received, ['old', 'new']);
});

test('onError: a failed resend is intercepted again, with the resent count', async () => {
  const state = MisoClient.mockTokens('new');
  const client = createClient('old');
  const counts = [];
  client.api.onError = async (error, { resend }) => {
    counts.push(error.resent);
    if (error.resent >= 2) {
      throw error;
    }
    return resend();
  };
  assert.is((await rejection(getThreads(client))).status, 401);
  assert.equal(counts, [0, 1, 2]);
  assert.equal(state.received, ['old', 'old', 'old']);

  // the count is per request
  await rejection(getThreads(client));
  assert.equal(counts, [0, 1, 2, 0, 1, 2]);
});

test('onError: resends are capped, against a callback that resends unconditionally', async () => {
  const state = MisoClient.mockTokens('new');
  const client = createClient('old');
  const counts = [];
  client.api.onError = async (error, { resend }) => {
    counts.push(error.resent);
    return resend();
  };
  assert.is((await rejection(getThreads(client))).status, 401);
  assert.equal(counts, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.is(state.received.length, 11);
});

test('onError: hold() holds requests until released; errors are managed in one go', async () => {
  const state = MisoClient.mockTokens('new');
  const client = createClient('old');
  let renewals = 0;
  let renewing;
  let release;
  async function renew(hold) {
    const unhold = hold();
    renewals++;
    await new Promise(resolve => (release = resolve));
    client.context.auth = 'new';
    unhold();
    unhold(); // releasing twice is harmless
  }
  client.api.onError = async (error, { hold, resend }) => {
    if (error.resent) {
      throw error;
    }
    await (renewing || (renewing = renew(hold)));
    return resend();
  };

  // two requests in flight fail before any hold is in place
  const inFlight = [getThreads(client), getThreads(client)];
  await new Promise(resolve => setTimeout(resolve));
  assert.equal(state.received, ['old', 'old']);
  assert.is(renewals, 1);

  // a request issued during the hold is not sent
  const held = getThreads(client);
  await new Promise(resolve => setTimeout(resolve));
  assert.equal(state.received, ['old', 'old']);

  release();
  await Promise.all([...inFlight, held]);
  assert.equal(state.received, ['old', 'old', 'new', 'new', 'new']);
});

test('onError: overlapping holds release with the last one', async () => {
  const state = MisoClient.mockTokens('new');
  const client = createClient('old');
  const unholds = [];
  client.api.onError = async (error, { hold }) => {
    unholds.push(hold(), hold());
    throw error;
  };
  await rejection(getThreads(client));
  client.context.auth = 'new';
  const held = getThreads(client);
  unholds[0]();
  await new Promise(resolve => setTimeout(resolve));
  assert.is(state.received.length, 1);
  unholds[1]();
  await held;
  assert.equal(state.received, ['old', 'new']);
});

test('onError: the callback is per client and removable', async () => {
  MisoClient.mockTokens('new');
  const client = createClient('old');
  const other = createClient('old');
  const callback = async () => ({ threads: [] });
  client.api.onError = callback;
  assert.is(client.api.onError, callback);
  assert.is(other.api.onError, undefined);
  assert.is((await rejection(getThreads(other))).status, 401);
  assert.equal((await getThreads(client)).threads, []);
  client.api.onError = undefined;
  assert.is((await rejection(getThreads(client))).status, 401);
  assert.throws(() => (client.api.onError = 'nope'));
});

test.run();
