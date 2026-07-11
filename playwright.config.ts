import { defineConfig, devices } from "@playwright/test";

const webServer = process.env.ITSVITAL_SKIP_PLAYWRIGHT_WEBSERVER
  ? undefined
  : [
      {
        command: "node apps/server/dist/index.js",
        url: "http://127.0.0.1:3001/health",
        reuseExistingServer: !process.env.CI,
      },
      {
        command: "node node_modules/vite/bin/vite.js preview --host 127.0.0.1",
        cwd: "apps/web",
        url: "http://127.0.0.1:4173",
        reuseExistingServer: !process.env.CI,
      },
    ];

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer,
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
