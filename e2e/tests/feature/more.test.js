import { test, expect } from '@playwright/test';
import { createMisoProxy } from '../../util/index.js';

test.beforeEach(async ({ page }) => {
  await page.addInitScript({ path: './client/probe.js' });
  page.miso = await createMisoProxy(page, {});
});

test('[Hybrid Search] data layer', async ({ page }) => {
  // TODO: extract as utils
  await page.route('**/ask/search?*', async route => {
    const request = route.request();
    const payload = request.postDataJSON();

    const { rows = 10 } = payload;
    const { page = 0 } = payload._meta || {};

    const total = 100 + page;
    const facet_counts = {
      facet_fields: {
        categories: [['A', 90 + page], ['B', 80 + page], ['C', 70 + page]],
      },
    };
    const products = [];
    for (let i = 0; i < rows; i++) {
      products.push({
        product_id: `p_${page * rows + i}`,
      });
    }
    const json = {
      data: {
        products,
        total,
        facet_counts,
      },
      message: 'success',
    };

    await route.fulfill({ json });
  });
  await page.goto('/ui/hybrid-search/blank');

  const [data0, data1] = await page.evaluate(async () => {
    const { pw } = window;
    const workflow = await pw.hybridSearch;

    let response$ = pw.waitForEvent(workflow.results, 'data', 'ready');
    workflow.query({ q: 'LLM' });
    await response$;
    const data0 = workflow.results.states.data.value;

    response$ = pw.waitForEvent(workflow.results, 'data', 'ready');
    workflow.results._more();
    await response$;
    const data1 = workflow.results.states.data.value;

    return [data0, data1];
  });

  expect.soft(data1.products.length).toBe(data0.products.length + 10);
  expect.soft(data1.total).toBe(data0.total);
  expect.soft(data1.facet_counts).toEqual(data0.facet_counts);
});
