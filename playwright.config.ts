import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer:
    process.env.PLAYWRIGHT_EXTERNAL_SERVER === "true"
      ? undefined
      : {
          command: "node scripts/playwright-server.mjs",
          url: "http://127.0.0.1:5173/login",
          reuseExistingServer: true,
          timeout: 120_000,
          env: {
            DATABASE_URL: "",
            USE_DEMO_DATA: "true",
            MARKET_DATA_FETCH_ENABLED: "false",
            ALLOW_DEMO_AUTH: "true",
            SESSION_SECRET:
              "cloudsky-playwright-session-secret-not-for-production-2026",
            SESSION_TTL_HOURS: "12",
          },
        },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
});
