import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const referenceBaseUrl =
  process.env.M1_T10_REFERENCE_URL || "http://127.0.0.1:3001";
const captureDir = process.env.M1_T10_CAPTURE_DIR;
const viewports = [
  { name: "desktop", width: 1280, height: 960 },
  { name: "1051", width: 1051, height: 900 },
  { name: "1050", width: 1050, height: 900 },
  { name: "1001", width: 1001, height: 900 },
  { name: "1000", width: 1000, height: 900 },
  { name: "821", width: 821, height: 900 },
  { name: "820", width: 820, height: 900 },
  { name: "641", width: 641, height: 900 },
  { name: "640", width: 640, height: 900 },
] as const;

async function capture(page: Page, filename: string) {
  if (captureDir) {
    await mkdir(captureDir, { recursive: true });
    await page.screenshot({
      fullPage: true,
      path: path.join(captureDir, filename),
    });
  }
}

test.describe("M1-T10 booking-request reference and fixture evidence", () => {
  test("captures booking source and implementation at desktop and every named breakpoint edge", async ({
    page,
    baseURL,
  }) => {
    for (const viewport of viewports) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto(`${referenceBaseUrl}/booking.html`, {
        waitUntil: "networkidle",
      });
      await expect(page.locator("main.wrap")).toBeVisible();
      await capture(page, `reference-booking-${viewport.name}.png`);
      await page.goto(`${baseURL}/booking`, { waitUntil: "networkidle" });
      await expect(page.locator("[data-scenario-id]")).toHaveAttribute(
        "data-scenario-id",
        "customer.booking-request-default",
      );
      await expect(
        page.getByRole("heading", { name: "Detail pendampingan" }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBeTruthy();
      await capture(page, `implementation-booking-${viewport.name}.png`);
    }
  });

  for (const [route, text] of [
    ["/booking/invalid", "Pilih paket dan lengkapi detail"],
    ["/booking/unavailable", "Tanggal yang dipilih tidak dapat diajukan"],
    ["/booking/no-package", "Belum ada paket pendampingan"],
    ["/booking/result", "Hasil pengajuan booking"],
  ] as const) {
    test(`renders the named fixture state ${route}`, async ({
      page,
      baseURL,
    }) => {
      await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
      await expect(
        route === "/booking/no-package"
          ? page.getByRole("alert").first()
          : page.getByText(text, { exact: false }).first(),
      ).toContainText(text);
      await expect(page.locator("[data-scenario-id]")).toBeVisible();
      await capture(page, `state-${route.slice(1).replace("/", "-")}.png`);
    });
  }

  test("keeps date selection, focus, and submission within the non-authoritative fixture boundary", async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/booking`, { waitUntil: "networkidle" });
    await page.keyboard.press("Tab");
    await expect(page.getByText("Langsung ke konten")).toBeFocused();
    await page.getByRole("button", { name: "Bulan berikutnya" }).click();
    await page.getByRole("button", { name: "12 Desember 2026" }).click();
    await expect(
      page.getByRole("button", { name: "12 Desember 2026" }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: /Ajukan Booking/ }).click();
    await expect(page.getByText("Booking berhasil diajukan ♡")).toBeVisible();
    expect(
      await page.evaluate(() => ({
        local: localStorage.length,
        session: sessionStorage.length,
      })),
    ).toEqual({ local: 0, session: 0 });
    const hrefs = await page
      .locator("a")
      .evaluateAll((links) =>
        links.map((link) => link.getAttribute("href") || ""),
      );
    expect(
      hrefs.every((href) => href.startsWith("/") || href.startsWith("#")),
    ).toBeTruthy();
    await capture(page, "implementation-booking-selected-result.png");
  });
});
