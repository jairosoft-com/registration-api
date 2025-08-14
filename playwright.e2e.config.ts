import { defineConfig, devices } from '@playwright/test';

const ciWorkers = process.env.CI
  ? process.env.PLAYWRIGHT_WORKERS
    ? Number(process.env.PLAYWRIGHT_WORKERS)
    : 1
  : undefined;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: ciWorkers,
  reporter: 'html',
  timeout: 30_000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4010',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
