import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const referenceBaseUrl = process.env.M1_T11_REFERENCE_URL || "http://127.0.0.1:3001";
const captureDir = process.env.M1_T11_CAPTURE_DIR;
const viewports = [{ name: "desktop", width: 1280, height: 960 }, { name: "1051", width: 1051, height: 900 }, { name: "1050", width: 1050, height: 900 }, { name: "821", width: 821, height: 900 }, { name: "820", width: 820, height: 900 }, { name: "641", width: 641, height: 900 }, { name: "640", width: 640, height: 900 }] as const;

async function capture(page: Page, name: string) { if (captureDir) { await mkdir(captureDir, { recursive: true }); await page.screenshot({ fullPage: true, path: path.join(captureDir, name) }); } }

test.describe("M1-T11 Booking Saya reference and fixture evidence", () => {
  test("captures the mapped empty source and fixture at desktop and every source breakpoint edge", async ({ page, baseURL }) => {
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${referenceBaseUrl}/booking_saya.html`, { waitUntil: "networkidle" });
      await expect(page.getByRole("heading", { name: "Belum ada booking, dear." })).toBeVisible();
      await capture(page, `reference-booking-saya-empty-${viewport.name}.png`);
      await page.goto(`${baseURL}/booking-saya/empty`, { waitUntil: "networkidle" });
      await expect(page.locator("[data-scenario-id]")).toHaveAttribute("data-scenario-id", "customer.bookings-empty");
      await expect(page.getByRole("heading", { name: "Belum ada booking, dear." })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
      await capture(page, `implementation-booking-saya-empty-${viewport.name}.png`);
    }
  });

  test("renders list, selected detail, canonical lifecycle, filter, and non-authoritative result through T02", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/booking-saya`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Daftar Booking" })).toBeVisible();
    await expect(page.getByRole("button", { name: /BR-2026-001/ })).toBeVisible();
    await page.getByRole("button", { name: /BR-2026-002/ }).click();
    await expect(page.getByRole("region", { name: "Detail booking" }).getByRole("heading", { level: 2, name: "The Intimate Care" })).toBeVisible();
    await page.getByLabel("Filter status booking").selectOption("Booking Berhasil");
    await expect(page.getByText("1 booking", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Salin Ringkasan Booking" }).click();
    await expect(page.getByRole("status")).toContainText("Tidak ada data yang disalin atau diubah");
    expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
    const hrefs = await page.locator("a").evaluateAll((links) => links.map((link) => link.getAttribute("href") || ""));
    expect(hrefs.every((href) => href.startsWith("/") || href.startsWith("#"))).toBeTruthy();
    await capture(page, "implementation-booking-saya-selected-result.png");
  });

  for (const [route, text] of [["/booking-saya/loading", "Menyiapkan booking, dear."], ["/booking-saya/error", "Booking belum dapat ditampilkan."], ["/booking-saya/payment", "Menunggu pembayaran"], ["/booking-saya/cancellation", "Booking dalam peninjauan"], ["/booking-saya/cancelled", "Booking dibatalkan"], ["/booking-saya/reschedule", "Booking dalam peninjauan"]] as const) {
    test(`renders the named fixture state ${route}`, async ({ page, baseURL }) => { await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" }); await expect(page.getByText(text, { exact: true })).toBeVisible(); await expect(page.locator("[data-scenario-id]")).toBeVisible(); await capture(page, `state-${route.slice(1).replaceAll("/", "-")}.png`); });
  }

  test("keeps keyboard navigation and the mobile menu inside the fixture boundary", async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await page.goto(`${baseURL}/booking-saya`, { waitUntil: "networkidle" });
    await page.keyboard.press("Tab");
    await expect(page.getByText("Langsung ke konten")).toBeFocused();
    await page.getByRole("button", { name: "Buka menu" }).click();
    await expect(page.getByRole("navigation", { name: "Navigasi mobile" })).toBeVisible();
  });
});
