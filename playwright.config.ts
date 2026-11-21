import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.M1_T08_BASE_URL || "http://localhost:3000",
    browserName: "chromium",
    viewport: { width: 1280, height: 960 },
    screenshot: "off",
  },
});
