import { expect, test } from "@playwright/test";
import { runAdminCommand } from "../scripts/admin-command.mjs";
import { mkdir } from "node:fs/promises";
import { withDatabase } from "../shared/server/database.mjs";

const output = process.env.M3_T02_EVIDENCE;
test("admin creates durable catalogue, package and promotion with conflict feedback", async ({ page, browser }) => {
  test.setTimeout(90_000);
  const email = `m3-t02-${Date.now()}@example.test`;
  const password = "Disposable-Password-123";
  const prompts = [password, password];
  const messages: string[] = [];
  const exit = await runAdminCommand(["bootstrap", "--email", email, "--name", "M3 Admin"], {
    prompt: async () => prompts.shift() ?? "", write: (message) => messages.push(message),
  });
  expect(exit, messages.join("\n")).toBe(0);
  await page.goto("/admin/catalogue");
  await expect(page).toHaveURL(/\/admin\/masuk/);
  await page.getByLabel("Alamat email").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(password);
  await page.getByRole("button", { name: /Masuk Akun/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/catalogue");
  await expect(page.getByText("Belum ada Service / Action")).toBeVisible();
  await page.getByRole("button", { name: "New Service / Action" }).click();
  await expect(page.getByLabel("Nama", { exact: true })).toBeFocused();
  await expect(page.locator('select[name="catalogue_type_id"] option')).toHaveCount(2);
  await page.getByLabel("Nama", { exact: true }).fill("Photography");
  await page.getByLabel("Jenis").selectOption("1");
  let releaseSave!: () => void;
  let capturedAction: { body: string; headers: Record<string, string> } | undefined;
  const pendingSave = new Promise<void>((resolve) => { releaseSave = resolve; });
  await page.route("**/admin/catalogue", async (route) => {
    if (!route.request().headers()["next-action"]) return route.continue();
    capturedAction = { body: route.request().postData() ?? "", headers: route.request().headers() };
    await pendingSave;
    await route.continue();
  });
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("button", { name: "Menyimpan…" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Menyimpan…" })).toBeDisabled();
  await page.getByLabel("Nama", { exact: true }).focus();
  await expect(page.getByLabel("Nama", { exact: true })).toBeFocused();
  if (output) { await mkdir(output, { recursive: true }); await page.screenshot({ path: `${output}/catalogue-loading.png`, fullPage: true }); }
  releaseSave();
  await expect(page.getByRole("heading", { name: "Photography" })).toBeVisible();
  await page.unroute("**/admin/catalogue");
  expect(capturedAction?.body).toBeTruthy();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Photography" })).toBeVisible();
  if (output) { await mkdir(output, { recursive: true }); await page.screenshot({ path: `${output}/catalogue-desktop.png`, fullPage: true }); }
  await page.getByRole("tab", { name: "Bundles" }).click();
  await page.getByRole("button", { name: "New Bundle" }).click();
  await page.getByLabel("Nama", { exact: true }).fill("Photo set");
  await page.getByLabel("Photography").check();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Photo set" })).toBeVisible();
  await page.goto("/admin/packages");
  await expect(page.getByText("Belum ada Master Package")).toBeVisible();
  await page.getByRole("button", { name: "New Master Package" }).click();
  await page.getByLabel("Nama", { exact: true }).fill("Wedding Photo");
  await page.locator('input[name="catalogueIds"]').check();
  await page.getByLabel("Harga dasar (Rp)").fill("1000000");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Wedding Photo" })).toBeVisible();
  if (output) { await page.screenshot({ path: `${output}/packages-desktop.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${output}/packages-mobile.png`, fullPage: true });
    await page.setViewportSize({ width: 1280, height: 960 }); }
  await page.goto("/admin/promotions");
  await expect(page.getByText("Belum ada Promotion")).toBeVisible();
  await page.getByRole("button", { name: "New Promotion" }).click();
  await page.getByLabel("Judul promo").fill("Early booking");
  await page.getByLabel("Nilai diskon").fill("10");
  await page.getByLabel("Mulai berlaku").fill("2026-12-01");
  await page.getByLabel("Berakhir").fill("2026-12-05");
  await page.getByLabel("Wedding Photo").check();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Early booking" })).toBeVisible();
  await page.getByRole("button", { name: "New Promotion" }).click();
  await page.getByLabel("Judul promo").fill("Overlapping offer");
  await page.getByLabel("Nilai diskon").fill("10");
  await page.getByLabel("Mulai berlaku").fill("2026-12-05");
  await page.getByLabel("Berakhir").fill("2026-12-06");
  await page.getByLabel("Wedding Photo").check();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText(/Perubahan bertentangan/)).toBeVisible();
  if (output) await page.screenshot({ path: `${output}/promotions-error.png`, fullPage: true });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Overlapping offer" })).toHaveCount(0);
  if (output) { await page.screenshot({ path: `${output}/promotions-desktop.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${output}/promotions-mobile.png`, fullPage: true });
    await page.goto("/admin/catalogue");
    await page.screenshot({ path: `${output}/catalogue-mobile.png`, fullPage: true }); }
  const customer = await browser.newContext();
  const anonymous = await browser.newContext();
  try {
    const snapshot = async () => withDatabase(async (db) => (await db.query(`SELECT id, catalogue_type_id, name, description, active
      FROM public.catalogue ORDER BY id`)).rows);
    const before = await snapshot();
    const signedUp = await customer.request.post(`${process.env.M1_T08_BASE_URL}/api/auth/sign-up/email`, {
      data: { email: `m3-customer-${Date.now()}@example.test`, name: "Disposable Customer", password },
    });
    expect(signedUp.ok()).toBe(true);
    const action = capturedAction!;
    const actionHeaders = { "next-action": action.headers["next-action"], "content-type": action.headers["content-type"],
      "next-router-state-tree": action.headers["next-router-state-tree"], origin: process.env.M1_T08_BASE_URL! };
    const submitForged = async (context: typeof customer, body: string, code: string) => {
      const response = await context.request.post(`${process.env.M1_T08_BASE_URL}/admin/catalogue`, { data: body, headers: actionHeaders });
      const text = await response.text();
      expect(response.status()).toBe(200);
      expect(text, `action result for ${code}`).toContain(`"code":"${code}"`);
      const after = await snapshot();
      expect(after, `${code} must leave catalogue rows unchanged`).toEqual(before);
      console.log(JSON.stringify({ actionBoundary: code, status: response.status(), catalogueRowsBefore: before.length,
        catalogueRowsAfter: after.length, unchanged: true }));
    };
    await submitForged(customer, action.body, "FORBIDDEN");
    await submitForged(anonymous, action.body, "AUTHENTICATION_REQUIRED");
    const unknownType = action.body.replace('"catalogue_type_id":1', '"catalogue_type_id":999999');
    expect(unknownType).not.toBe(action.body);
    await submitForged(page.context(), unknownType, "CONFLICT");
    const malformed = action.body.replace('"name":"Photography"', '"name":""');
    expect(malformed).not.toBe(action.body);
    await submitForged(page.context(), malformed, "INVALID_INPUT");
    const customerPage = await customer.newPage();
    await customerPage.goto(`${process.env.M1_T08_BASE_URL}/admin/catalogue`);
    await expect(customerPage).toHaveURL(/\/admin\/masuk/);
  } finally { await customer.close(); await anonymous.close(); }
});
