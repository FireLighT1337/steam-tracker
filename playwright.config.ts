import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run start',
      cwd: '.',
      url: 'http://localhost:4200',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npm run dev',
      cwd: './backend',
      url: 'http://localhost:3000/api/steam/profile/76561198127309108',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
