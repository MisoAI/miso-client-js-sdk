import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    actionTimeout: 5 * 1000,
    baseURL: 'http://localhost:10100'
  },
  reporter: [['list'], ['html', { outputFolder: 'dist', open: 'never' }]]
});
