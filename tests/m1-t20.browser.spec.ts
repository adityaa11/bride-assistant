import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const captureDir = process.env.M1_T20_CAPTURE_DIR;

async function capture(page: Page, name: string) {
  if (!captureDir) return;
  await mkdir(captureDir, { recursive: true });
  await page.screenshot({ fullPage: true, path: path.join(captureDir, name) });
}

async function browserStorage(page: Page) {
  return page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
  }));
}

test("local booking result creates no browser record across customer routes", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
  const page = await context.newPage();
  const fictionalName = "Mawar Uji T20";
  try {
    await page.goto(`${baseURL}/booking`, { waitUntil: "networkidle" });
    await expect(page.locator("[data-scenario-id]")).toHaveAttribute("data-scenario-id", "customer.booking-request-default");
    await expect(page.locator("[data-scenario-version]")).toHaveAttribute("data-scenario-version", "m1-fixture-v1");
    expect(await browserStorage(page)).toEqual({ local: [], session: [] });
    await page.keyboard.press("Tab");
    await expect(page.getByText("Langsung ke konten")).toBeFocused();
    await page.getByRole("button", { name: "Bulan berikutnya" }).click();
    await page.getByRole("button", { name: "12 Desember 2026" }).click();
    await expect(page.getByText("12 Desember 2026").first()).toBeVisible();
    await page.getByLabel("Nama Lengkap *").fill(fictionalName);
    await page.getByLabel("WhatsApp *").fill("081200000020");
    await page.getByLabel("Email *").fill("mawar.t20@example.test");
    await page.getByLabel("Waktu Mulai *").fill("09:00");
    await page.getByLabel("Lokasi Wedding *").fill("Aula Uji");
    await page.getByRole("button", { name: /Ajukan Booking/ }).click();
    await expect(page.getByRole("heading", { name: "Hasil pengajuan booking ♡" })).toBeVisible();
    await expect(page.locator("section[aria-live='polite']")).toContainText("tidak dikirim atau disimpan");
    await expect(page.locator("section[aria-live='polite']")).toContainText("Menunggu Konfirmasi");
    await expect(page.getByText(fictionalName)).toHaveCount(0);
    await expect(page.getByText("BR-2026-003")).toHaveCount(0);
    expect(await browserStorage(page)).toEqual({ local: [], session: [] });
    await capture(page, "booking-result-desktop.png");

    await page.goto(`${baseURL}/beranda`, { waitUntil: "networkidle" });
    await expect(page.locator("[data-scenario-id]")).toHaveAttribute("data-scenario-id", "customer.home-success");
    await expect(page.getByText("BR-2026-001")).toBeVisible();
    await expect(page.getByText("BR-2026-002")).toBeVisible();
    await expect(page.getByText(fictionalName)).toHaveCount(0);
    await expect(page.getByText("BR-2026-003")).toHaveCount(0);
    await capture(page, "home-desktop.png");
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByText("BR-2026-001")).toBeVisible();
    expect(await browserStorage(page)).toEqual({ local: [], session: [] });

    await page.goto(`${baseURL}/booking-saya`, { waitUntil: "networkidle" });
    await expect(page.locator("[data-scenario-id]")).toHaveAttribute("data-scenario-id", "customer.booking-history-success");
    await expect(page.getByRole("button", { name: /BR-2026-001/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /BR-2026-002/ })).toBeVisible();
    await expect(page.getByText("2 booking", { exact: true })).toBeVisible();
    await expect(page.getByText(fictionalName)).toHaveCount(0);
    await expect(page.getByText("BR-2026-003")).toHaveCount(0);
    await capture(page, "history-desktop.png");
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByText("2 booking", { exact: true })).toBeVisible();
    expect(await browserStorage(page)).toEqual({ local: [], session: [] });

    for (const route of ["/beranda/empty", "/booking-saya/empty"]) {
      await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
      await expect(page.getByRole("heading", { name: "Belum ada booking, dear." })).toBeVisible();
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.getByRole("heading", { name: "Belum ada booking, dear." })).toBeVisible();
      expect(await browserStorage(page)).toEqual({ local: [], session: [] });
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 640, height: 900 });
    for (const [route, name] of [["/booking/result", "booking-result-narrow.png"], ["/beranda", "home-narrow.png"], ["/booking-saya", "history-narrow.png"]] as const) {
      await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
      expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBeTruthy();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
      await capture(page, name);
    }
  } finally {
    await context.close();
  }
});
