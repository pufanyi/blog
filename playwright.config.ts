import { defineConfig, devices } from '@playwright/test';

function port(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > 65535) throw new Error(`Invalid ${name}`);
  return value;
}
const previewPort = port('BLOG_PREVIEW_PORT', 4173);
const cloudflarePort = port('BLOG_CLOUDFLARE_PORT', 8787);
const previewUrl = `http://127.0.0.1:${previewPort}`;
const cloudflareUrl = `http://127.0.0.1:${cloudflarePort}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: 2,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: previewUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    {
      name: 'mobile',
      testIgnore: 'performance.spec.ts',
      use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium' },
    },
    {
      name: 'cloudflare',
      testMatch: 'agent-content.spec.ts',
      use: { baseURL: cloudflareUrl },
    },
  ],
  webServer: [
    {
      command: `PORT=${previewPort} pnpm preview`,
      url: previewUrl,
      reuseExistingServer: false,
    },
    {
      command: `pnpm exec wrangler dev --local --ip 127.0.0.1 --port ${cloudflarePort}`,
      url: cloudflareUrl,
      reuseExistingServer: false,
    },
  ],
});
