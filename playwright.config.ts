import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "4173";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "en-US",
    timezoneId: "Europe/Warsaw",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: `set -a && . ./.env.local && set +a && npm run build && npm run start -- --port ${port}`,
    url: baseURL,
    timeout: 600_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "deterministic",
      testMatch: /deterministic\/.*\.spec\.ts/,
      retries: 0,
      workers: 1,
    },
    {
      name: "live-smoke",
      testMatch: /live\/.*\.spec\.ts/,
      retries: process.env.CI ? 2 : 1,
      workers: 1,
    },
  ],
});
