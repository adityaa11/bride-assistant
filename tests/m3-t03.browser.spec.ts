import { expect, test } from "@playwright/test";
import { withDatabase } from "../shared/server/database.mjs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const output = process.env.M3_T03_EVIDENCE!;

test("published package selection is live, responsive, accessible, empty and error aware", async ({ page, browser }) => {
  test.setTimeout(90_000);
  const packageId = await withDatabase(async (db) => {
    const item = (await db.query("INSERT INTO public.catalogue(catalogue_type_id,name,description,active) VALUES (1,'Bridal care service','',true) RETURNING id")).rows[0].id;
    const pkg = (await db.query("INSERT INTO public.master_package(name,description,duration_minutes,base_price,published,active) VALUES ('Thoughtful Care','A considered companion for your day',240,1250000,true,true) RETURNING id")).rows[0].id;
    await db.query("INSERT INTO public.package_catalogue(package_id,catalogue_id) VALUES ($1,$2)", [pkg, item]);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const promo = (await db.query("INSERT INTO public.promotion(title,description,discount_type,discount_value,starts_on,ends_on,published,active) VALUES ('Care offer','A little more care','percentage',10,$1,$1,true,true) RETURNING id", [today])).rows[0].id;
    await db.query("INSERT INTO public.promotion_package(promotion_id,package_id) VALUES ($1,$2)", [promo, pkg]);
    return pkg;
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Thoughtful Care", exact: true })).toBeVisible();
  await expect(page.getByText("Harga dasar")).toContainText(/Rp\s*1\.250\.000/);
  await expect(page.getByText("Care offer")).toBeVisible();
  await page.screenshot({ path: `${output}/public-desktop.png`, fullPage: true });
  const select = page.getByRole("link", { name: /PILIH PAKET/ });
  await select.focus(); await expect(select).toBeFocused();
  await expect(select).toHaveAttribute("href", `/booking?packageId=${packageId}`);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Thoughtful Care", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${output}/public-mobile.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const customer = await browser.newContext();
  try {
    const signedUp = await customer.request.post(`${process.env.M1_T08_BASE_URL}/api/auth/sign-up/email`, {
      data: { email: `m3-t03-${randomUUID()}@example.test`, name: "Disposable Customer", password: "Disposable-Password-123" },
    });
    expect(signedUp.ok()).toBe(true);
    const customerPage = await customer.newPage();
    await customerPage.goto(`/booking?packageId=${packageId}`);
    await expect(customerPage.getByRole("heading", { name: "Thoughtful Care", exact: true }).first()).toBeVisible();
    await expect(customerPage.getByText("Paket dipilih")).toBeVisible();
    await expect(customerPage.getByText("Care offer")).toBeVisible();
    await customerPage.screenshot({ path: `${output}/customer-desktop.png`, fullPage: true });
    await customerPage.reload();
    await expect(customerPage.getByText("Paket dipilih")).toBeVisible();
    await customerPage.getByRole("link", { name: /Paket dipilih/ }).focus();
    await expect(customerPage.getByRole("link", { name: /Paket dipilih/ })).toBeFocused();
    await customerPage.setViewportSize({ width: 390, height: 844 });
    await customerPage.screenshot({ path: `${output}/customer-mobile.png`, fullPage: true });
    expect(await customerPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await withDatabase((db) => db.query("UPDATE public.master_package SET published = false WHERE id = $1", [packageId]));
    await customerPage.reload();
    await expect(customerPage.getByText("Booking belum dapat dimulai")).toBeVisible();
    await customerPage.screenshot({ path: `${output}/customer-empty.png`, fullPage: true });
    await page.reload();
    await expect(page.getByText("Belum ada paket yang dipublikasikan")).toBeVisible();
    await page.screenshot({ path: `${output}/public-empty.png`, fullPage: true });
  } finally { await customer.close(); }
  execFileSync("docker", ["compose", "-p", process.env.M3_T03_DOCKER_PROJECT!, "-f", "compose.m2-local.yaml", "stop", "postgres"],
    { env: { ...process.env, M2_LOCAL_DB_PASSWORD: process.env.M3_T03_DOCKER_PASSWORD! }, stdio: "ignore" });
  await page.reload();
  await expect(page.getByText("Paket belum dapat dimuat")).toBeVisible();
  await page.screenshot({ path: `${output}/public-error.png`, fullPage: true });
});
