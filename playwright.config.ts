import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright 구성 (artbridge 하네스 STAGE 5 E2E 게이트).
 * - dev 서버(:3000)가 이미 떠 있으면 재사용, 없으면 직접 기동.
 * - CI에서는 매번 새 서버를 띄운다.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    locale: "ko-KR",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
