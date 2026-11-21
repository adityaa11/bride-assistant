import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const referenceBaseUrl = process.env.M1_T08_REFERENCE_URL || "http://127.0.0.1:3001";
const captureDir = process.env.M1_T08_CAPTURE_DIR;

const desktopAndBreakpoints = [
  { name: "desktop", width: 1280, height: 960 },
  { name: "1001", width: 1001, height: 960 },
  { name: "1000", width: 1000, height: 960 },
  { name: "701", width: 701, height: 960 },
  { name: "700", width: 700, height: 960 },
  { name: "381", width: 381, height: 844 },
  { name: "380", width: 380, height: 844 },
] as const;

async function capture(page: Page, filename: string) {
  if (!captureDir) return;
  await mkdir(captureDir, { recursive: true });
  await page.screenshot({ fullPage: true, path: path.join(captureDir, filename) });
}

test.describe("M1-T08 customer-auth visual and boundary evidence", () => {
  for (const pageName of ["masuk", "daftar"] as const) {
    test(`${pageName} matches the extracted reference at desktop and all breakpoint edges`, async ({ page, baseURL }) => {
      for (const viewport of desktopAndBreakpoints) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`${referenceBaseUrl}/${pageName}.html`, { waitUntil: "networkidle" });
        await expect(page.locator("main.auth-shell")).toBeVisible();
        await capture(page, `reference-${pageName}-${viewport.name}.png`);

        await page.goto(`${baseURL}/${pageName}`, { waitUntil: "networkidle" });
        await expect(page.getByRole("main")).toBeVisible();
        await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
        await expect(page.locator("[data-scenario-id]")).toHaveAttribute("data-scenario-id", `customer.${pageName === "masuk" ? "signin" : "register"}-default`);
        await expect(page.locator("body")).not.toContainText("fixture state");
        await expect(page.locator("body")).not.toContainText("Scenario:");
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
        await capture(page, `implementation-${pageName}-${viewport.name}.png`);
      }
    });
  }

  for (const [route, expectedText] of [
    ["/masuk/validation", "error fixture state"],
    ["/masuk/loading", "loading fixture state"],
    ["/masuk/error", "error fixture state"],
    ["/masuk/success", "Hasil fixture"],
    ["/daftar/validation", "error fixture state"],
    ["/daftar/loading", "loading fixture state"],
    ["/daftar/error", "error fixture state"],
    ["/daftar/success", "Hasil fixture"],
  ] as const) {
    test(`renders the named fixture state ${route}`, async ({ page, baseURL }) => {
      await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
      await expect(page.getByText(expectedText, { exact: false }).first()).toBeVisible();
      await expect(page.locator("[data-scenario-id]")).toBeVisible();
      if (route.endsWith("/loading")) await expect(page.getByRole("button", { name: /menyiapkan fixture/i })).toBeDisabled();
      await capture(page, `state-${route.slice(1).replace("/", "-")}.png`);
    });
  }

  test("exposes visible keyboard focus and preserves the no-authority fixture boundary", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/masuk`, { waitUntil: "networkidle" });
    await page.keyboard.press("Tab");
    await expect(page.getByText("Langsung ke formulir")).toBeFocused();
    await capture(page, "keyboard-masuk-skip-link.png");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Masuk Akun" })).toBeVisible();
    expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
    const hrefs = await page.locator("a").evaluateAll((links) => links.map((link) => link.getAttribute("href") || ""));
    expect(hrefs.every((href) => href.startsWith("/") || href.startsWith("#"))).toBeTruthy();
  });
});
