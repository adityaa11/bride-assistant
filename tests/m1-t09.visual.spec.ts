import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const referenceBaseUrl = process.env.M1_T09_REFERENCE_URL || "http://127.0.0.1:3001";
const captureDir = process.env.M1_T09_CAPTURE_DIR;
const viewports = [
  { name: "desktop", width: 1258, height: 966 },
  { name: "1051", width: 1051, height: 900 },
  { name: "1050", width: 1050, height: 900 },
  { name: "821", width: 821, height: 900 },
  { name: "820", width: 820, height: 900 },
  { name: "641", width: 641, height: 900 },
  { name: "640", width: 640, height: 900 },
] as const;

async function capture(page: Page, filename: string) {
  if (!captureDir) return;
  await mkdir(captureDir, { recursive: true });
  await page.screenshot({ fullPage: true, path: path.join(captureDir, filename) });
}

test.describe("M1-T09 source-reference and fixture evidence", () => {
  for (const [referencePage, implementationRoute, name] of [["home.html", "/beranda", "home"], ["bantuan.html", "/bantuan", "help"]] as const) {
    test(`${name} captures the mapped source and implementation at every required breakpoint edge`, async ({ page, baseURL }) => {
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`${referenceBaseUrl}/${referencePage}`, { waitUntil: "networkidle" });
        await expect(page.locator("main#main")).toBeVisible();
        await capture(page, `source-${name}-${viewport.name}.png`);

        await page.goto(`${baseURL}${implementationRoute}`, { waitUntil: "networkidle" });
        await expect(page.locator("main#main")).toBeVisible();
        await expect(page.locator("[data-scenario-id]")).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
        await capture(page, `implementation-${name}-${viewport.name}.png`);
      }
    });
  }

  test("renders the named empty and WhatsApp-unavailable fixture states without authority", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/beranda/empty`, { waitUntil: "networkidle" });
    await expect(page.locator("[data-scenario-id]")).toHaveAttribute("data-scenario-id", "customer.home-empty");
    await expect(page.getByText("Belum ada booking, dear.")).toBeVisible();
    await capture(page, "implementation-home-empty.png");

    await page.goto(`${baseURL}/bantuan`, { waitUntil: "networkidle" });
    await expect(page.locator("[data-scenario-id]")).toHaveAttribute("data-scenario-id", "customer.whatsapp-unavailable");
    await page.getByRole("button", { name: "Hubungi via WhatsApp" }).click();
    await expect(page.getByRole("status")).toHaveText("Kontak WhatsApp belum tersedia. Silakan coba kembali nanti.");
    const hrefs = await page.locator("a").evaluateAll((links) => links.map((link) => link.getAttribute("href") || ""));
    expect(hrefs.every((href) => href.startsWith("/") || href.startsWith("#"))).toBeTruthy();
    await capture(page, "implementation-help-unavailable.png");
  });

  test("keeps keyboard focus and mobile navigation within the local fixture boundary", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/bantuan`, { waitUntil: "networkidle" });
    await page.keyboard.press("Tab");
    await expect(page.getByText("Langsung ke konten")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Butuh bantuan? ♡" })).toBeVisible();

    await page.getByRole("button", { name: "Notifikasi" }).click();
    await expect(page.getByRole("region", { name: "Notifikasi" })).toContainText("Belum ada kabar terbaru");
    await page.getByRole("button", { name: "Menu akun" }).click();
    await expect(page.getByRole("menu", { name: "Menu akun" })).toContainText("Bride-to-be");

    await page.setViewportSize({ width: 820, height: 900 });
    await page.reload({ waitUntil: "networkidle" });
    const menu = page.getByRole("button", { name: "Buka menu" });
    await expect(menu).toBeVisible();
    await menu.click();
    await expect(page.getByRole("button", { name: "Tutup menu" })).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("navigation", { name: "Navigasi mobile" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("navigation", { name: "Navigasi mobile" })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await capture(page, "implementation-help-keyboard-mobile-menu.png");
  });
});
