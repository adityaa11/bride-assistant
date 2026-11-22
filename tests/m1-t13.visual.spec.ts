import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const referenceUrl = `${process.env.M1_T13_REFERENCE_URL || "http://127.0.0.1:3001"}/Bride_Assistant_Planner_Standalone_v3_Content_Management.html`;
const captureDir = process.env.M1_T13_CAPTURE_DIR;
const widths = [1440, 1251, 1250, 931, 930, 721, 720, 486, 485, 420];
async function capture(page: Page, name: string) {
  if (!captureDir) return;
  await mkdir(captureDir, { recursive: true });
  await page.screenshot({ path: path.join(captureDir, name), fullPage: true });
}

test("catalogue and package panels render at reference breakpoints", async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 960 });
    for (const surface of ["catalogue", "packages"] as const) {
      await page.goto(referenceUrl, { waitUntil: "networkidle" });
      await page.locator(`[data-page="${surface === "catalogue" ? "catalog" : "packages"}"]`).click();
      const sourceWidth = await page.locator(surface === "catalogue" ? ".catalog-grid" : ".package-grid").evaluate((element) => element.getBoundingClientRect().width);
      await capture(page, `reference-${surface}-${width}.png`);
      await page.goto(`${baseURL}/admin/${surface}`, { waitUntil: "networkidle" });
      await expect(page.locator("[data-scenario-id]")).toHaveAttribute("data-scenario-id", surface === "catalogue" ? "admin.catalogue-services" : "admin.catalogue-packages");
      await expect(page.getByRole("heading", { name: surface === "catalogue" ? "Services & Actions." : "Your lovely packages." })).toBeVisible();
      const actualWidth = await page.locator(surface === "catalogue" ? '[class*="catalogGrid"]' : '[class*="packageGrid"]').evaluate((element) => element.getBoundingClientRect().width);
      expect(Math.abs(sourceWidth - actualWidth), `${surface} grid width at ${width}px`).toBeLessThan(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
      await capture(page, `implementation-${surface}-${width}.png`);
    }
  }
});

test("catalogue fixture interactions and negative authority", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/admin/catalogue`);
  await expect(page.locator('[class*="catalogCard"]')).toHaveCount(8);
  await page.getByRole("searchbox", { name: "Search name / description" }).fill("no matching item");
  await expect(page.getByText("No matching items. Create one using the button above.")).toBeVisible();
  await capture(page, "implementation-no-match.png");
  await page.getByRole("searchbox", { name: "Search name / description" }).fill("");
  await page.getByRole("combobox", { name: "Filter type" }).selectOption("Service");
  await expect(page.locator('[class*="catalogCard"]')).toHaveCount(2);
  await capture(page, "implementation-service-filter.png");
  await page.getByRole("button", { name: "Edit", exact: true }).first().click();
  await page.getByRole("dialog").getByRole("textbox", { name: "Nama service / action *" }).fill("");
  await page.getByRole("button", { name: "Save item" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await capture(page, "implementation-item-validation.png");
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Bundles" }).click();
  await expect(page.locator('[class*="catalogCard"]')).toHaveCount(2);
  await capture(page, "implementation-bundles.png");
  await page.getByRole("button", { name: "Edit", exact: true }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await capture(page, "implementation-bundle-editor.png");
  await page.getByRole("button", { name: "Save bundle" }).click();
  await expect(page.getByRole("status")).toContainText("performs no account, data, WhatsApp, or service operation");
  await capture(page, "implementation-proposed-result.png");
  await page.reload();
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.locator('[class*="catalogCard"]')).toHaveCount(8);
  await page.goto(`${baseURL}/admin/catalogue/empty`);
  await expect(page.getByText("No catalogue entries are available in this fixture.")).toBeVisible();
  await capture(page, "implementation-empty.png");
  await page.goto(`${baseURL}/admin/catalogue/error`);
  await expect(page.getByText("The catalogue fixture could not be prepared.")).toBeVisible();
  await capture(page, "implementation-error.png");
  await page.goto(`${baseURL}/admin/catalogue/proposed-result`);
  await expect(page.getByRole("status")).toBeVisible();
  await capture(page, "implementation-proposed-state.png");
  await page.goto(`${baseURL}/admin/packages`);
  await expect(page.locator('[class*="packageCard"]')).toHaveCount(3);
  await page.getByRole("button", { name: "Edit package" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await capture(page, "implementation-package-editor.png");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus-visible")).toBeVisible();
  await capture(page, "implementation-focus.png");
  for (const state of ["empty", "error", "proposed-result", "long"]) {
    await page.goto(`${baseURL}/admin/packages/${state}`);
    await expect(page.locator("[data-scenario-id]")).toHaveAttribute("data-scenario-id", `admin.catalogue-packages-${state === "long" ? "long" : state}`);
    await capture(page, `implementation-packages-${state}.png`);
  }
  await expect(page.getByRole("heading", { name: /The Full Day Care — Pendampingan lebih lengkap/ })).toBeVisible();
});

test("shared admin frame remains usable on existing routes", async ({ page, baseURL }) => {
  for (const width of [1440, 930, 720, 485]) {
    await page.setViewportSize({ width, height: 960 });
    for (const route of ["/admin", "/admin/availability", "/admin/catalogue"]) {
      await page.goto(`${baseURL}${route}`);
      await expect(page.locator("main#admin-workspace")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} at ${width}px`).toBeTruthy();
      await capture(page, `shared-${route.replaceAll("/", "-")}-${width}.png`);
    }
  }
});

test("mapped reference tabs and editor states are captured", async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto(referenceUrl);
  await page.locator('[data-page="catalog"]').click();
  await page.locator('[data-edit-catalog]').first().click();
  await capture(page, "reference-item-editor.png");
  await page.locator('[data-action="close-modal"]').first().click();
  await page.locator('[data-action="catalog-bundles"]').click();
  await capture(page, "reference-bundles.png");
  await page.locator('[data-edit-bundle]').first().click();
  await capture(page, "reference-bundle-editor.png");
  await page.locator('[data-action="close-modal"]').first().click();
  await page.locator('[data-page="packages"]').click();
  await page.locator('[data-edit-package]').first().click();
  await capture(page, "reference-package-editor.png");
  await page.goto(`${baseURL}/admin/catalogue`);
  await page.getByRole("button", { name: "Edit", exact: true }).first().click();
  await capture(page, "implementation-item-editor.png");
  await page.getByRole("button", { name: "Close" }).click();
  await page.getByRole("tab", { name: "Bundles" }).click();
  await page.getByRole("button", { name: "Edit", exact: true }).first().click();
  await capture(page, "implementation-bundle-editor-desktop.png");
  await page.goto(`${baseURL}/admin/packages`);
  await page.getByRole("button", { name: "Edit package" }).first().click();
  await capture(page, "implementation-package-editor-desktop.png");
});
