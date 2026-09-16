import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { STATUS } from '../src/index.js';
import { createClient, tick } from './dummy.js';

/**
 * The search-based more flow's failure handling, against the dummy client
 * with a scriptable search API: 5 products in stock, served page by page
 * with the exclusion-based paging of the real API.
 */

const STOCK = ['p1', 'p2', 'p3', 'p4', 'p5'];

function withSearchApi(client, calls, state = {}) {
  let seq = 0;
  client.api.search = {
    async _run(name, payload) {
      const i = ++seq;
      calls.push(`POST search/${name} ${JSON.stringify(payload)}`);
      if (state.failFrom !== undefined && i >= state.failFrom) {
        throw new Error('boom');
      }
      const exclude = payload.exclude || [];
      const products = STOCK.filter(id => !exclude.includes(id))
        .slice(0, payload.rows)
        .map(product_id => ({ product_id }));
      return { products, total: STOCK.length };
    },
  };
  return state;
}

const productIds = workflow => (workflow.states.data.value.products || []).map(p => p.product_id);

test('search: more pages append; a failed page parks the results instead of sticking erroneous', async () => {
  const { client, calls } = createClient();
  const state = withSearchApi(client, calls);
  const search = client.workflows.search;
  search.useApi('search', { rows: 2 });

  search.query({ q: 'miso' });
  await tick();
  assert.is(search.status, STATUS.READY);
  assert.equal(productIds(search), ['p1', 'p2']);

  search._more();
  await tick();
  assert.equal(productIds(search), ['p1', 'p2', 'p3', 'p4']);

  // the next page fails for good (past the fetch-layer retries)
  state.failFrom = 3;
  search._more();
  await tick();
  // the results — and their ready status — stay on display, parked as
  // exhausted: without the parking, the erroneous status would stick for
  // the session, the container flipped into its error state
  assert.equal(productIds(search), ['p1', 'p2', 'p3', 'p4']);
  assert.is(search.status, STATUS.READY);
  assert.is(search.exhausted, true);
  search._more(); // a no-op, not a throw — the status stayed ready
  await tick();
  assert.is(calls.filter(c => c.startsWith('POST search/')).length, 3);

  // a new query starts a fresh session, clearing the parking
  delete state.failFrom;
  search.query({ q: 'soup' });
  await tick();
  assert.is(search.exhausted, false);
  assert.equal(productIds(search), ['p1', 'p2']);
});

test.run();
