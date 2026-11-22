import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const reference = `${process.env.M1_T16_REFERENCE_URL || "http://127.0.0.1:3001"}/Bride_Assistant_Planner_Standalone_v3_Content_Management.html`;
const directory = process.env.M1_T16_CAPTURE_DIR;
const widths = [1440, 1251, 1250, 1151, 1150, 931, 930, 721, 720, 486, 485];
async function capture(page: Page, name: string) {
  if (!directory) return;
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: path.join(directory, name), fullPage: true });
}

test("promotion source and fixture route at every content and shell boundary", async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto(reference);
    await page.locator('[data-page="promotions"]').click();
    await expect(page.locator(".web-empty")).toBeVisible();
    await capture(page, `reference-empty-${width}.png`);
    await page.locator('[data-action="website-new-promotions"]').first().click();
    await page.locator('#promo-title').fill('Special Wedding Month');
    await page.locator('#promo-type').selectOption('percent');
    await page.locator('#promo-value').fill('10');
    await page.locator('#promo-start').fill('2026-11-01');
    await page.locator('#promo-end').fill('2026-12-31');
    await page.locator('#website-form input[name="productIds"]').first().check();
    await page.locator('#website-form button[type="submit"]').click();
    await expect(page.locator('.web-card')).toHaveCount(1);
    await capture(page, `reference-populated-${width}.png`);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${baseURL}/admin/promotions/empty`);
    await expect(page.getByText("Belum ada promotion")).toBeVisible();
    await capture(page, `implementation-empty-${width}.png`);
    await page.goto(`${baseURL}/admin/promotions`);
    await expect(page.locator('[data-scenario-id="admin.promotions-default"]')).toBeVisible();
    await expect(page.locator('article[class*="webCard"]')).toHaveCount(2);
    await capture(page, `implementation-populated-${width}.png`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}`).toBeTruthy();
  }
});

test("editor, validation, result, empty, error and non-authority", async ({ page, baseURL }) => {
  await page.goto(reference);
  await page.locator('[data-page="promotions"]').click();
  await page.locator('[data-action="website-new-promotions"]').first().click();
  await capture(page, "reference-editor.png");
  await page.goto(`${baseURL}/admin/promotions`);
  await page.getByRole("button", { name: "Tambah Promo" }).first().click();
  const dialog = page.getByRole("dialog", { name: /Tambah promotions/ });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus-visible")).toBeVisible();
  await capture(page, "implementation-editor.png");
  await dialog.getByLabel("Judul promo *").fill("Special Wedding Month");
  await dialog.getByLabel("Nilai diskon *").fill("101");
  await dialog.getByLabel("Mulai berlaku *").fill("2026-12-01");
  await dialog.getByLabel("Berakhir *").fill("2026-12-31");
  await dialog.getByRole("checkbox").first().check();
  await dialog.getByRole("button", { name: "Simpan konten" }).click();
  await expect(dialog.getByRole("alert")).toContainText("maksimal 100%");
  await capture(page, "implementation-validation.png");
  await dialog.getByLabel("Nilai diskon *").fill("10");
  await dialog.getByRole("button", { name: "Simpan konten" }).click();
  await expect(page.getByRole("status")).toContainText("tidak ada promo atau harga yang berubah");
  await capture(page, "implementation-result.png");
  await page.reload();
  await expect(page.locator('article[class*="webCard"]')).toHaveCount(2);
  await page.getByRole("button", { name: "Edit" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("tidak ada promo atau harga yang berubah");
  await page.goto(`${baseURL}/admin/promotions/empty`);
  await capture(page, "implementation-empty-state.png");
  await page.goto(`${baseURL}/admin/promotions/error`);
  await expect(page.getByText("Promotion fixture belum dapat ditampilkan.")).toBeVisible();
  await capture(page, "implementation-error-state.png");
  await page.goto(`${baseURL}/admin/promotions/long`);
  await capture(page, "implementation-long-state.png");
  await page.goto(`${baseURL}/admin/promotions/result`);
  await expect(page.getByRole("status")).toBeVisible();
  await capture(page, "implementation-proposed-state.png");
  await page.goto(`${baseURL}/`);
  await expect(page.getByText("Special Wedding Month")).toHaveCount(0);
});

test("shared admin frame works on Bookings, Availability and Promotions", async ({ page, baseURL }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 930, 720, 485]) {
    await page.setViewportSize({ width, height: 960 });
    for (const route of ["/admin", "/admin/availability", "/admin/promotions"]) {
      await page.goto(`${baseURL}${route}`);
      await expect(page.locator("main#admin-workspace")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} at ${width}`).toBeTruthy();
      await capture(page, `shared-${route.replaceAll("/", "-")}-${width}.png`);
      if (width <= 930) {
        await page.getByRole("button", { name: "Buka menu modul" }).click();
        await expect(page.getByRole("dialog", { name: "Menu modul" })).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog", { name: "Menu modul" })).toHaveCount(0);
      }
    }
  }
});
