import { test, expect } from '@playwright/test';
import { createMisoProxy } from '../../util/index.js';

test.beforeEach(async ({ page }) => {
  await page.addInitScript({ path: './client/probe.js' });
  page.miso = await createMisoProxy(page, {
    verifyEvents: true,
  });
});

test('Standard', async ({ page }) => {
  await page.goto('/ui/hybrid-search/standard');

  // query by input
  const input = page.locator('miso-query [data-role="input"]');
  await input.fill('LLM');
  await input.press('Enter');

  // wait for data
  await page.waitForTimeout(3000);

  //console.log(page.miso.workflows.get('hybrid-search/results').dataEvents);
});
