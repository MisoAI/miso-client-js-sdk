import { test, expect } from '@playwright/test';

test('Standard', async ({ page }) => {
  await page.goto('/ui/hybrid-search/standard');
  // query by input
  const input = page.locator('miso-query [data-role="input"]');
  await input.fill('LLM');
  await input.press('Enter');
  // wait for data
  await page.waitForTimeout(3000);
});
