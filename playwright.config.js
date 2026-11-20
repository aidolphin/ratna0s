import { defineConfig, devices } from '@playwright/test';

// Working Chromium headless shell for this environment (revision 1255).
// Revision 1148 (the default for @playwright/test 1.49.0) crashes on this macOS.
const CHROMIUM_EXE =
  '/Users/sagarthapa/Library/Caches/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-mac-arm64/chrome-headless-shell';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:5173',
    executablePath: CHROMIUM_EXE,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    port: 5173,
    timeout: 180000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
