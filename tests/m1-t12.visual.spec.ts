import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const referenceUrl = `${process.env.M1_T12_REFERENCE_URL || "http://127.0.0.1:3001"}/Bride_Assistant_Planner_Standalone_v3_Content_Management.html`;
const captureDir = process.env.M1_T12_CAPTURE_DIR;
const widths = [1440, 1251, 1250, 931, 930, 721, 720, 486, 485, 420];
async function capture(page: Page, name: string) {
  if (!captureDir) return;
  await mkdir(captureDir, { recursive: true });
  await page.screenshot({ path: path.join(captureDir, name), fullPage: true });
}
async function rect(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((element) => {
    const { x, y, width, height } = element.getBoundingClientRect();
    return { x, y, width, height };
  });
}
function sameGeometry(source: Awaited<ReturnType<typeof rect>>, implementation: Awaited<ReturnType<typeof rect>>, fields: ("x" | "y" | "width" | "height")[]) {
  for (const field of fields) expect(Math.abs(source[field] - implementation[field]), `${field} differs`).toBeLessThan(2);
}

test("admin Bookings and Availability preserve reference shell and responsive geometry", async ({ page, baseURL }) => {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 960 });
    for (const surface of ["bookings", "availability"] as const) {
      await page.goto(referenceUrl, { waitUntil: "networkidle" });
      if (surface === "availability") await page.locator('[data-page="availability"]').click();
      const source = {
        topbar: await rect(page, ".topbar"),
        title: await rect(page, ".section-title"),
        content: await rect(page, ".content"),
        filters: surface === "bookings" ? await rect(page, ".filters") : undefined,
        main: await rect(page, surface === "bookings" ? ".main-grid" : ".availability-grid"),
        calendar: surface === "bookings" ? await rect(page, ".calendar-grid") : undefined,
      };
      await capture(page, `reference-${surface}-${width}.png`);
      await page.goto(`${baseURL}/admin${surface === "availability" ? "/availability" : ""}`, { waitUntil: "networkidle" });
      await expect(page.locator("[data-scenario-id]")).toHaveAttribute("data-scenario-id", surface === "bookings" ? "admin.booking-workspace" : "admin.availability-workspace");
      sameGeometry(source.topbar, await rect(page, '[class*="topbar"]'), ["x", "y", "width", "height"]);
      sameGeometry(source.title, await rect(page, '[class*="sectionTitle"]'), ["x", "y", "width", "height"]);
      sameGeometry(source.content, await rect(page, '[class*="content"]'), ["x", "y", "width"]);
      sameGeometry(source.main, await rect(page, surface === "bookings" ? '[class*="mainGrid"]' : '[class*="availabilityGrid"]'), ["x", "y", "width"]);
      if (surface === "bookings" && source.filters && source.calendar) {
        sameGeometry(source.filters, await rect(page, '[class*="filters"]'), ["x", "y", "width", "height"]);
        sameGeometry(source.calendar, await rect(page, '[class*="calendarGrid"]'), ["x", "y", "width"]);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
      await capture(page, `implementation-${surface}-${width}.png`);
    }
  }
});

test("admin controls show fixture states without mutating them", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/admin`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "List", exact: true }).click();
  await expect(page.getByText("All Bookings")).toBeVisible();
  await capture(page, "implementation-list.png");
  await page.getByRole("button", { name: /Dinda Prameswari/ }).first().click();
  await expect(page.getByText("0812-0000-1112")).toBeVisible();
  await capture(page, "implementation-detail.png");
  await page.getByRole("button", { name: /Back to bookings/ }).click();
  await page.getByRole("searchbox", { name: "Cari customer" }).fill("zzzz-no-match");
  await expect(page.getByText("Tidak ada booking yang sesuai dengan filter.")).toBeVisible();
  await capture(page, "implementation-empty-filter.png");
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.getByRole("searchbox", { name: "Cari customer" })).toHaveValue("");
  await page.getByRole("combobox", { name: "Filter status" }).selectOption("Booking Berhasil");
  await expect(page.locator('aside [class*="bookingItem"]')).toHaveCount(3);
  await capture(page, "implementation-status-filter.png");
  await page.getByRole("button", { name: "Calendar", exact: true }).click();
  await page.getByRole("button", { name: "Bulan selanjutnya" }).click();
  await expect(page.getByRole("heading", { name: "Desember 2026", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "New Booking" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await capture(page, "implementation-non-authoritative-result.png");
  await page.goto(`${baseURL}/admin/bookings/empty`);
  await expect(page.getByText("Belum ada booking sesuai filter pada pilihan ini.")).toBeVisible();
  await capture(page, "implementation-empty-scenario.png");
  await page.goto(`${baseURL}/admin/availability`);
  await page.getByRole("button", { name: "Save availability" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await capture(page, "implementation-availability-result.png");
});
