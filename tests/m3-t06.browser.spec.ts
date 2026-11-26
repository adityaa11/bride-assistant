import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { withDatabase } from "../shared/server/database.mjs";
import { transitionAdminBooking } from "../shared/server/admin-booking-repository.mjs";
import { runAdminCommand } from "../scripts/admin-command.mjs";

const base = process.env.M1_T08_BASE_URL!;
const output = process.env.M3_T06_EVIDENCE!;
test("prepared admin queue and decisions use the customer booking record", async ({ browser, request }) => {
  test.setTimeout(180_000);
  const observations: Record<string, unknown> = { migrations: ["0001", "0002", "0003", "0004", "0005"] };
  expect((await request.get(`${base}/api/admin/bookings`)).status()).toBe(401);
  const customer = await browser.newContext();
  const admin = await browser.newContext();
  try {
    const signup = await customer.request.post(`${base}/api/auth/sign-up/email`, { data: {
      email: `m3-t06-customer-${randomUUID()}@example.test`, name: "Ayu Kirana", password: "Disposable-Password-123" } });
    expect(signup.ok()).toBe(true);
    const password = "Disposable-Password-123";
    const email = `m3-t06-admin-${randomUUID()}@example.test`;
    const prompts = [password, password];
    expect(await runAdminCommand(["bootstrap", "--email", email, "--name", "Administrator"], {
      prompt: async () => prompts.shift() ?? "", write: () => {},
    })).toBe(0);
    const adminPage = await admin.newPage();
    await adminPage.goto("/admin/masuk");
    await adminPage.getByLabel("Alamat email").fill(email);
    await adminPage.getByLabel("Kata sandi", { exact: true }).fill(password);
    await adminPage.getByRole("button", { name: /Masuk Akun/ }).click();
    await expect(adminPage).toHaveURL(/\/admin$/);
    const emptyResponse = await admin.request.get(`${base}/api/admin/bookings`);
    expect(emptyResponse.status()).toBe(200);
    expect((await emptyResponse.json()).result).toEqual([]);
    expect((await admin.request.get(`${base}/api/admin/bookings/${randomUUID()}`)).status()).toBe(404);
    await adminPage.goto("/admin/bookings");
    await expect(adminPage.getByText("Belum ada booking sesuai filter")).toBeVisible();
    await adminPage.screenshot({ path: `${output}/empty-desktop.png`, fullPage: true });
    await adminPage.setViewportSize({ width: 390, height: 844 });
    await adminPage.screenshot({ path: `${output}/empty-mobile.png`, fullPage: true });
    expect(await adminPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await adminPage.setViewportSize({ width: 1280, height: 800 });
    const packageId = await withDatabase(async (db) => {
      const item = (await db.query("INSERT INTO public.catalogue(catalogue_type_id,name,description,active) VALUES (1,'Bridal care','',true) RETURNING id")).rows[0].id;
      const pkg = (await db.query("INSERT INTO public.master_package(name,description,duration_minutes,base_price,published,active) VALUES ('Thoughtful Care','A considered companion',240,1000000,true,true) RETURNING id")).rows[0].id;
      await db.query("INSERT INTO public.package_catalogue(package_id,catalogue_id) VALUES ($1,$2)", [pkg, item]);
      return pkg as string;
    });
    const customerInput = { submissionKey: randomUUID(), packageId, customerName: "Ayu Kirana", whatsapp: "+628123456789",
      email: "ayu@example.test", weddingDate: "2027-02-14", weddingStartTime: "10:30", weddingLocation: "Jakarta", note: "Garden" };
    const submitted = await customer.request.post(`${base}/api/customer/bookings`, { data: customerInput });
    expect(submitted.status()).toBe(200);
    const bookingId = (await submitted.json()).booking.id as string;
    const customerDetail = (await (await customer.request.get(`${base}/api/customer/bookings/${bookingId}`)).json()).booking;
    const adminDetailResponse = await admin.request.get(`${base}/api/admin/bookings/${bookingId}`);
    expect(adminDetailResponse.status()).toBe(200);
    const adminDetail = (await adminDetailResponse.json()).result;
    expect(adminDetail.booking.id).toBe(customerDetail.booking.id);
    expect(adminDetail.booking.submission_snapshot).toEqual(customerDetail.booking.submission_snapshot);
    expect(adminDetail.booking.package_snapshot).toEqual(customerDetail.booking.package_snapshot);
    expect(adminDetail.history).toEqual(customerDetail.history);
    expect(adminDetail.booking.submission_payload_hash).toBeUndefined();
    expect(adminDetail.booking.submission_key).toBeUndefined();
    await adminPage.goto("/admin/bookings");
    await expect(adminPage.getByText("Ayu Kirana").first()).toBeVisible();
    const queueButton = adminPage.getByRole("region", { name: "Antrean booking" }).getByRole("button").first();
    await queueButton.focus(); await expect(queueButton).toBeFocused();
    const detailUrl = `**/api/admin/bookings/${bookingId}`;
    const cdp = await admin.newCDPSession(adminPage);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 600,
      downloadThroughput: -1, uploadThroughput: -1 });
    const loadingClick = queueButton.press("Enter");
    await expect(adminPage.getByRole("status").filter({ hasText: "Memuat detail" })).toBeVisible();
    await adminPage.screenshot({ path: `${output}/loading-desktop.png`, fullPage: true });
    await loadingClick;
    await expect(adminPage.getByText(`No. Booking: ${bookingId}`)).toBeVisible();
    await adminPage.screenshot({ path: `${output}/initial-detail-desktop.png`, fullPage: true });
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 0,
      downloadThroughput: -1, uploadThroughput: -1 });
    const failedDetail = (route: import("@playwright/test").Route) => route.abort();
    await adminPage.route(detailUrl, failedDetail);
    await queueButton.click();
    await expect(adminPage.getByRole("alert").filter({ hasText: "Detail gagal" })).toBeVisible();
    await adminPage.screenshot({ path: `${output}/error-desktop.png`, fullPage: true });
    await adminPage.unroute(detailUrl, failedDetail);
    await queueButton.click();
    await expect(adminPage.getByText(`No. Booking: ${bookingId}`)).toBeVisible();
    expect((await customer.request.get(`${base}/api/admin/bookings`)).status()).toBe(403);
    const command = (expectedStatus: string, targetStatus: string, paymentReviewed?: boolean) => ({ expectedStatus, targetStatus, paymentReviewed });
    const patch = (data: Record<string, unknown>) => admin.request.patch(`${base}/api/admin/bookings/${bookingId}`, { data });
    expect((await customer.request.patch(`${base}/api/admin/bookings/${bookingId}`, { data: command("Menunggu Konfirmasi", "Menunggu Pembayaran") })).status()).toBe(403);
    expect((await patch(command("Menunggu Pembayaran", "Booking Berhasil", true))).status()).toBe(409);
    expect((await patch({ ...command("Menunggu Konfirmasi", "Menunggu Pembayaran"), currentStatus: "Menunggu Konfirmasi" })).status()).toBe(422);
    expect((await patch(command("Menunggu Konfirmasi", "Booking Berhasil", true))).status()).toBe(409);
    const [first, stale] = await Promise.all([patch(command("Menunggu Konfirmasi", "Menunggu Pembayaran")), patch(command("Menunggu Konfirmasi", "Menunggu Pembayaran"))]);
    expect([first.status(), stale.status()].sort()).toEqual([200, 409]);
    expect((await patch(command("Menunggu Konfirmasi", "Menunggu Pembayaran"))).status()).toBe(409);
    expect((await patch(command("Menunggu Pembayaran", "Booking Berhasil"))).status()).toBe(409);
    expect((await patch(command("Menunggu Pembayaran", "Booking Berhasil", false))).status()).toBe(409);
    expect((await patch(command("Menunggu Pembayaran", "Booking Berhasil", true))).status()).toBe(409);
    const countsBefore = (await withDatabase(async (db) => (await db.query("SELECT status, (SELECT count(*)::int FROM public.booking_status_history WHERE booking_id=$1) AS events FROM public.booking WHERE id=$1", [bookingId])).rows[0])) as { status: string; events: number };
    expect(countsBefore).toEqual({ status: "Menunggu Pembayaran", events: 2 });
    await adminPage.reload();
    await adminPage.getByRole("region", { name: "Antrean booking" }).getByRole("button").first().click();
    await expect(adminPage.getByText("Booking Berhasil belum aktif")).toBeVisible();
    await adminPage.getByRole("checkbox", { name: /bukti pembayaran/ }).check();
    await expect(adminPage.getByRole("button", { name: "Booking Berhasil belum aktif" })).toBeDisabled();
    await adminPage.evaluate(() => scrollTo(0, 0));
    await adminPage.screenshot({ path: `${output}/payment-pending-desktop.png`, fullPage: true });
    // T07's integration contract is a callback in the same transaction. A failed
    // reservation leaves the successful status and history absent.
    const adminId = (await withDatabase(async (db) => (await db.query('SELECT id FROM auth."user" WHERE email=$1', [email])).rows[0].id)) as string;
    const decision = { ok: true as const, actor: { role: "admin" as const, subjectId: adminId,
      sessionId: "disposable-integration", expiresAt: new Date(Date.now() + 60_000) }, record: "unscoped" as const,
      parsedData: { bookingId, expectedStatus: "Menunggu Pembayaran" as const,
        targetStatus: "Booking Berhasil" as const, paymentReviewed: true } };
    const failedIntegration = await withDatabase((db) => transitionAdminBooking(db, decision, async () => false));
    expect(failedIntegration).toEqual({ ok: false, code: "CONFLICT" });
    const integrated = await withDatabase((db) => transitionAdminBooking(db, decision, async () => true));
    expect(integrated.ok).toBe(true);
    const countsAfter = (await withDatabase(async (db) => (await db.query("SELECT status, (SELECT count(*)::int FROM public.booking_status_history WHERE booking_id=$1) AS events FROM public.booking WHERE id=$1", [bookingId])).rows[0])) as { status: string; events: number };
    expect(countsAfter).toEqual({ status: "Booking Berhasil", events: 3 });
    if (integrated.ok) expect(integrated.value.event.actor_id).toBe(adminId);
    const ordered = await withDatabase(async (db) => (await db.query(
      "SELECT from_status, to_status, actor_id, occurred_at FROM public.booking_status_history WHERE booking_id=$1 ORDER BY occurred_at, id", [bookingId])).rows);
    expect(ordered.map((event) => event.to_status)).toEqual([
      "Menunggu Konfirmasi", "Menunggu Pembayaran", "Booking Berhasil"]);
    expect(ordered[1].actor_id).toBe(adminId);
    expect(ordered[2].actor_id).toBe(adminId);
    observations.sameRecord = { bookingId, sharedSnapshot: true, customerHistory: customerDetail.history.length };
    observations.transitions = { first: [first.status(), stale.status()], before: countsBefore, failedIntegration, after: countsAfter,
      actorId: adminId, orderedHistory: ordered, integratedEvent: integrated.ok ? integrated.value.event : null };
    await adminPage.goto("/admin/bookings");
    await expect(adminPage.getByText("Ayu Kirana").first()).toBeVisible();
    const choose = adminPage.getByRole("region", { name: "Antrean booking" }).getByRole("button").first();
    await choose.focus(); await expect(choose).toBeFocused(); await choose.press("Enter");
    await expect(adminPage.getByRole("heading", { name: "Detail Booking" })).toBeVisible();
    await expect(adminPage.getByText(`No. Booking: ${bookingId}`)).toBeVisible();
    await adminPage.screenshot({ path: `${output}/detail-desktop.png`, fullPage: true });
    await adminPage.setViewportSize({ width: 390, height: 844 });
    await adminPage.screenshot({ path: `${output}/detail-mobile.png`, fullPage: true });
    expect(await adminPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const secondResponse = await customer.request.post(`${base}/api/customer/bookings`, {
      data: { ...customerInput, submissionKey: randomUUID(), note: "Second request" } });
    expect(secondResponse.status()).toBe(200);
    const secondId = (await secondResponse.json()).booking.id as string;
    await adminPage.reload();
    await adminPage.getByRole("region", { name: "Antrean booking" }).getByRole("button").filter({ hasText: secondId }).click();
    await expect(adminPage.getByText(`No. Booking: ${secondId}`)).toBeVisible();
    await adminPage.getByRole("button", { name: "Pindah ke Menunggu Pembayaran" }).click();
    await expect(adminPage.getByRole("status").filter({ hasText: "Keputusan tersimpan" })).toBeVisible();
    const secondState = await withDatabase(async (db) => (await db.query(
      "SELECT status, (SELECT count(*)::int FROM public.booking_status_history WHERE booking_id=$1) AS events FROM public.booking WHERE id=$1", [secondId])).rows[0]);
    expect(secondState).toEqual({ status: "Menunggu Pembayaran", events: 2 });
    observations.uiDecision = { id: secondId, ...secondState };
    await writeFile(`${output}/observations.json`, JSON.stringify(observations, null, 2));
  } finally { await customer.close(); await admin.close(); }
});
