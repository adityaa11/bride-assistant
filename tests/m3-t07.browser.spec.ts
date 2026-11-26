import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { withDatabase } from "../shared/server/database.mjs";
import { runAdminCommand } from "../scripts/admin-command.mjs";
import { transitionAdminBooking } from "../shared/server/admin-booking-repository.mjs";

const base = process.env.M1_T08_BASE_URL!;
const output = process.env.M3_T07_EVIDENCE!;
const range = (date: string) => `${base}/api/customer/availability?from=${date}&to=${date}`;
test("live closure, booking reservation and date-only calendar share one transaction decision", async ({ browser, request }) => {
  test.setTimeout(240_000);
  const observations: Record<string, unknown> = {};
  const customer = await browser.newContext();
  const admin = await browser.newContext();
  try {
    const emptyDate = "2027-02-10";
    expect((await (await request.get(range(emptyDate))).json()).dates).toEqual([]);
    expect((await request.get(`${base}/api/customer/availability?from=bad&to=2027-02-10`)).status()).toBe(422);
    expect((await request.get(`${base}/api/admin/availability?from=${emptyDate}&to=${emptyDate}`)).status()).toBe(401);
    const signup = await customer.request.post(`${base}/api/auth/sign-up/email`, { data: {
      email: `m3-t07-customer-${randomUUID()}@example.test`, name: "Ayu Kirana", password: "Disposable-Password-123" } });
    expect(signup.ok()).toBe(true);
    const email = `m3-t07-admin-${randomUUID()}@example.test`;
    const prompts = ["Disposable-Password-123", "Disposable-Password-123"];
    expect(await runAdminCommand(["bootstrap", "--email", email, "--name", "Administrator"], {
      prompt: async () => prompts.shift() ?? "", write: () => {},
    })).toBe(0);
    const adminPage = await admin.newPage();
    await adminPage.goto("/admin/masuk");
    await adminPage.getByLabel("Alamat email").fill(email);
    await adminPage.getByLabel("Kata sandi", { exact: true }).fill("Disposable-Password-123");
    await adminPage.getByRole("button", { name: /Masuk Akun/ }).click();
    await expect(adminPage).toHaveURL(/\/admin$/);
    await expect(adminPage.locator('[data-scenario-id="admin.booking-live"]')).toBeVisible();
    await adminPage.goto("/admin/availability");
    await expect(adminPage.getByRole("status", { name: "" }).filter({ hasText: "Belum ada tanggal ditutup" })).toBeVisible();
    await adminPage.screenshot({ path: `${output}/admin-empty-desktop.png`, fullPage: true });
    const closure = (date: string, operation: "close" | "open") => admin.request.post(`${base}/api/admin/availability`, { data: { date, operation } });
    const dateState = async (date: string) => (await (await customer.request.get(range(date))).json()).dates;
    expect((await customer.request.post(`${base}/api/admin/availability`, { data: { date: emptyDate, operation: "close" } })).status()).toBe(403);
    expect((await closure(emptyDate, "open")).status()).toBe(200); // Absent open is idempotent.
    expect((await closure(emptyDate, "close")).status()).toBe(200);
    expect((await closure(emptyDate, "close")).status()).toBe(409);
    expect(await dateState(emptyDate)).toEqual([{ date: emptyDate, state: "unavailable" }]);
    const closedBy = await withDatabase(async (db) => (await db.query('SELECT u.email FROM public.admin_closed_date c JOIN auth."user" u ON u.id=c.closed_by WHERE c.date=$1', [emptyDate])).rows[0]?.email);
    expect(closedBy).toBe(email);
    expect((await closure(emptyDate, "open")).status()).toBe(200);
    expect((await closure(emptyDate, "open")).status()).toBe(200);
    expect(await dateState(emptyDate)).toEqual([]);
    const packageId = await withDatabase(async (db) => {
      const item = (await db.query("INSERT INTO public.catalogue(catalogue_type_id,name,description,active) VALUES (1,'Bridal care','',true) RETURNING id")).rows[0].id;
      const pkg = (await db.query("INSERT INTO public.master_package(name,description,duration_minutes,base_price,published,active) VALUES ('Thoughtful Care','A considered companion',240,1000000,true,true) RETURNING id")).rows[0].id;
      await db.query("INSERT INTO public.package_catalogue(package_id,catalogue_id) VALUES ($1,$2)", [pkg, item]);
      return pkg as string;
    });
    const input = (date: string) => ({ submissionKey: randomUUID(), packageId, customerName: "Ayu Kirana", whatsapp: "+628123456789",
      email: "ayu@example.test", weddingDate: date, weddingStartTime: "10:30", weddingLocation: "Jakarta", note: "Garden" });
    const submit = async (data: ReturnType<typeof input>) => {
      const response = await customer.request.post(`${base}/api/customer/bookings`, { data });
      expect(response.status()).toBe(200);
      return (await response.json()).booking.id as string;
    };
    const advance = async (id: string) => {
      const response = await admin.request.patch(`${base}/api/admin/bookings/${id}`, { data: {
        expectedStatus: "Menunggu Konfirmasi", targetStatus: "Menunggu Pembayaran" } });
      expect(response.status()).toBe(200);
    };
    const success = (id: string) => admin.request.patch(`${base}/api/admin/bookings/${id}`, { data: {
      expectedStatus: "Menunggu Pembayaran", targetStatus: "Booking Berhasil", paymentReviewed: true } });
    const date = "2027-02-14";
    const first = await submit(input(date));
    const second = await submit(input(date));
    expect(await dateState(date)).toEqual([]); // Initial pending requests do not hold the day.
    await advance(first); await advance(second);
    const [firstSuccess, secondSuccess] = await Promise.all([success(first), success(second)]);
    expect([firstSuccess.status(), secondSuccess.status()].sort()).toEqual([200, 409]);
    const privateProjection = await dateState(date);
    expect(privateProjection).toEqual([{ date, state: "unavailable" }]);
    const rawProjection = JSON.stringify(privateProjection);
    expect(rawProjection).not.toContain(first); expect(rawProjection).not.toContain("Ayu");
    const winner = firstSuccess.status() === 200 ? first : second;
    const loser = winner === first ? second : first;
    expect((await success(loser)).status()).toBe(409);
    expect((await closure(date, "close")).status()).toBe(409);
    const successState = await withDatabase(async (db) => (await db.query(`SELECT b.id,b.status,
      (SELECT count(*)::int FROM public.booking_status_history h WHERE h.booking_id=b.id) AS events,
      (SELECT count(*)::int FROM public.booking_date_reservation r WHERE r.booking_id=b.id) AS reservations
      FROM public.booking b WHERE b.id=ANY($1::uuid[]) ORDER BY b.id`, [[first, second]])).rows);
    expect(successState.find((row: { id: string }) => row.id === winner)).toMatchObject({ status: "Booking Berhasil", events: 3, reservations: 1 });
    expect(successState.find((row: { id: string }) => row.id === loser)).toMatchObject({ status: "Menunggu Pembayaran", events: 2, reservations: 0 });
    observations.twoSuccesses = { statuses: [firstSuccess.status(), secondSuccess.status()], rows: successState, projection: privateProjection };
    const raceDate = "2027-02-15";
    const racing = await submit(input(raceDate)); await advance(racing);
    const [closedRace, successfulRace] = await Promise.all([closure(raceDate, "close"), success(racing)]);
    expect([closedRace.status(), successfulRace.status()].sort()).toEqual([200, 409]);
    expect(await dateState(raceDate)).toEqual([{ date: raceDate, state: "unavailable" }]);
    const raceState = await withDatabase(async (db) => (await db.query(`SELECT
      (SELECT count(*)::int FROM public.admin_closed_date WHERE date=$1) AS closures,
      (SELECT count(*)::int FROM public.booking_date_reservation WHERE wedding_date=$1) AS reservations`, [raceDate])).rows[0]);
    expect(raceState.closures + raceState.reservations).toBe(1);
    observations.closureRace = { statuses: [closedRace.status(), successfulRace.status()], ...raceState };
    const pendingDate = "2027-02-16";
    const pending = await submit(input(pendingDate));
    expect(await dateState(pendingDate)).toEqual([]);
    observations.pendingInitial = { bookingId: pending, availableBeforeClosure: true };
    expect((await closure(pendingDate, "close")).status()).toBe(200);
    expect((await customer.request.post(`${base}/api/customer/bookings`, { data: input(pendingDate) })).status()).toBe(409);
    const retryInput = input("2027-02-17");
    const retried = await submit(retryInput); await advance(retried);
    const adminId = await withDatabase(async (db) => (await db.query('SELECT id FROM auth."user" WHERE email=$1', [email])).rows[0].id as string);
    const decision = { ok: true as const, actor: { role: "admin" as const, subjectId: adminId,
      sessionId: "disposable-integration", expiresAt: new Date(Date.now() + 60_000) }, record: "unscoped" as const,
      parsedData: { bookingId: retried, expectedStatus: "Menunggu Pembayaran" as const,
        targetStatus: "Booking Berhasil" as const, paymentReviewed: true } };
    const rolledBack = await withDatabase((db) => transitionAdminBooking(db, decision, async (client, row) => {
      await client.query("INSERT INTO public.booking_date_reservation(booking_id,wedding_date) VALUES ($1,$2)", [row.id, row.wedding_date]);
      return false;
    }));
    expect(rolledBack).toEqual({ ok: false, code: "CONFLICT" });
    expect((await success(retried)).status()).toBe(200);
    expect((await success(retried)).status()).toBe(409);
    const retryRows = await withDatabase(async (db) => (await db.query(`SELECT
      (SELECT count(*)::int FROM public.booking_date_reservation WHERE booking_id=$1) AS reservations,
      (SELECT count(*)::int FROM public.booking_status_history WHERE booking_id=$1) AS events`, [retried])).rows[0]);
    expect(retryRows).toEqual({ reservations: 1, events: 3 });
    await withDatabase(async (db) => { // M4 exception-state fixture: no M4 command is activated in T07.
      await db.query("BEGIN");
      await db.query("UPDATE public.booking SET status='Menunggu Pembatalan Booking' WHERE id=$1", [retried]);
      await db.query(`INSERT INTO public.booking_status_history
        (booking_id,actor_id,from_status,to_status) VALUES ($1,$2,'Booking Berhasil','Menunggu Pembatalan Booking')`, [retried, adminId]);
      await db.query("COMMIT");
    });
    expect(await dateState(retryInput.weddingDate)).toEqual([{ date: retryInput.weddingDate, state: "unavailable" }]);
    const exceptionRows = await withDatabase(async (db) => (await db.query(`SELECT b.status,
      (SELECT count(*)::int FROM public.booking_date_reservation WHERE booking_id=b.id) AS reservations,
      (SELECT count(*)::int FROM public.booking_status_history WHERE booking_id=b.id) AS events
      FROM public.booking b WHERE b.id=$1`, [retried])).rows[0]);
    expect(exceptionRows).toEqual({ status: "Menunggu Pembatalan Booking", reservations: 1, events: 4 });
    observations.pendingException = { date: retryInput.weddingDate, rows: exceptionRows };
    observations.rollbackRetry = { rolledBack, rows: retryRows };
    await adminPage.goto("/admin/availability");
    await expect(adminPage.getByRole("heading", { name: "Tutup tanggal" })).toBeVisible();
    await expect(adminPage.getByRole("heading", { name: "Tanggal ditutup" })).toBeVisible();
    for (let step = 0; step < 3; step++) await adminPage.getByRole("button", { name: "Bulan berikutnya" }).click();
    await expect(adminPage.getByRole("button", { name: /2027-02-14, tidak tersedia/ })).toBeDisabled();
    await adminPage.screenshot({ path: `${output}/admin-availability-desktop.png`, fullPage: true });
    await adminPage.setViewportSize({ width: 390, height: 844 });
    await adminPage.screenshot({ path: `${output}/admin-availability-mobile.png`, fullPage: true });
    expect(await adminPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await adminPage.getByLabel("Pilih tanggal").fill("2027-03-01");
    await adminPage.getByRole("button", { name: "Tutup tanggal" }).click();
    await expect(adminPage.getByRole("status").filter({ hasText: "Tanggal ditutup." })).toBeVisible();
    expect(await dateState("2027-03-01")).toEqual([{ date: "2027-03-01", state: "unavailable" }]);
    await adminPage.getByRole("listitem").filter({ hasText: "2027-03-01" }).getByRole("button", { name: "Buka tanggal" }).click();
    await expect.poll(() => dateState("2027-03-01")).toEqual([]);
    await adminPage.route("**/api/admin/availability?*", (route) => route.abort());
    await adminPage.reload();
    await expect(adminPage.getByRole("alert").filter({ hasText: "belum dapat dimuat" })).toBeVisible();
    await adminPage.screenshot({ path: `${output}/admin-error-mobile.png`, fullPage: true });
    await adminPage.unroute("**/api/admin/availability?*");
    await adminPage.goto("/admin/bookings");
    await adminPage.getByRole("region", { name: "Antrean booking" }).getByRole("button").filter({ hasText: loser }).click();
    await adminPage.getByRole("checkbox", { name: /bukti pembayaran/ }).check();
    await expect(adminPage.getByRole("button", { name: "Tetapkan Booking Berhasil" })).toBeEnabled();
    await adminPage.screenshot({ path: `${output}/admin-decision-desktop.png`, fullPage: true });
    const customerPage = await customer.newPage();
    await customerPage.goto(`/booking?packageId=${packageId}`);
    await expect(customerPage.getByRole("heading", { name: "Tanggal wedding" })).toBeVisible();
    await expect(customerPage.getByRole("status").filter({ hasText: /tanggal/ }).first()).toBeVisible();
    for (let step = 0; step < 3; step++) await customerPage.getByRole("button", { name: "Bulan berikutnya" }).click();
    await expect(customerPage.getByRole("button", { name: /2027-02-14, tidak tersedia/ })).toBeDisabled();
    const freeDay = customerPage.getByRole("button", { name: /2027-02-18, tersedia/ });
    await freeDay.focus(); await expect(freeDay).toBeFocused(); await freeDay.press("Enter");
    await expect(customerPage.getByText("Tanggal dipilih dari ketersediaan server.")).toBeVisible();
    await customerPage.evaluate(() => scrollTo(0, 0));
    await customerPage.screenshot({ path: `${output}/customer-calendar-desktop.png`, fullPage: true });
    await customerPage.setViewportSize({ width: 390, height: 844 });
    await customerPage.screenshot({ path: `${output}/customer-calendar-mobile.png`, fullPage: true });
    expect(await customerPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await customerPage.route("**/api/customer/availability?*", (route) => route.abort());
    await customerPage.reload();
    await expect(customerPage.getByRole("alert").filter({ hasText: "Ketersediaan belum dapat dimuat" })).toBeVisible();
    await customerPage.screenshot({ path: `${output}/customer-error-mobile.png`, fullPage: true });
    await customerPage.unroute("**/api/customer/availability?*");
    observations.emptyAndClosure = { firstAvailable: true, firstClosureProjected: true, absentOpenIdempotent: true };
    await writeFile(`${output}/observations.json`, JSON.stringify(observations, null, 2));
  } finally { await customer.close(); await admin.close(); }
});
