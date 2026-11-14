import { defineConfig, devices } from "@playwright/test";

import { E2E_ENV } from "./e2e/support/env";

const BASE_URL = "http://localhost:5173";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0, // flaky는 retry로 가리지 않고 원인을 찾는다
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1280, height: 800 },
    // 서비스워커가 처리한 요청은 route로 가로채지 못할 수 있어 등록 자체를 막는다
    serviceWorkers: "block",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx vite --port 5173 --strictPort",
    url: BASE_URL,
    // 기존 dev 서버를 재사용하면 실제 .env가 로드되므로 항상 새로 띄운다
    reuseExistingServer: false,
    timeout: 60_000,
    // 프로세스 env가 .env보다 우선이라 실제 키가 테스트에 섞이지 않는다
    env: { ...E2E_ENV },
  },
});
