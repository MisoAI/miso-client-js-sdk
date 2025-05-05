import { test, expect } from '@playwright/test';
import { createMisoProxy } from '../../util/index.js';

test.beforeEach(async ({ page }) => {
  await page.addInitScript({ path: './client/probe.js' });
});

test('Hybrid Search', async ({ page }) => {
  await page.goto('/feature/more/hybrid-search');

  const proxy = await createMisoProxy(page);

  await proxy.done();
});
