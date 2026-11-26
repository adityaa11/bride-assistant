import { expect, test } from "@playwright/test";
import { withDatabase } from "../shared/server/database.mjs";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";

const base = process.env.M1_T08_BASE_URL!;
const output = process.env.M3_T05_EVIDENCE!;
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const offset = (days: number) => new Date(Date.parse(`${today}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
const input = (packageId: string, submissionKey = randomUUID()) => ({ submissionKey, packageId,
  customerName: "Ayu Kirana", whatsapp: "+628123456789", email: "ayu@example.test", weddingDate: "2027-02-14",
  weddingStartTime: "10:30", weddingLocation: "Jakarta", note: "Garden" });

test("prepared customer route: promotion, retry, privacy, empty state and UI", async ({ browser, request }) => {
  test.setTimeout(180_000);
  const observations: Record<string, unknown> = { migrations: ["0001", "0002", "0003", "0004", "0005"] };
  const anonymous = await request.get(`${base}/api/customer/bookings`);
  expect(anonymous.status()).toBe(401);
  const anonymousPost = await request.post(`${base}/api/customer/bookings`, { data: input(randomUUID()) });
  expect(anonymousPost.status()).toBe(401);
  const customer = await browser.newContext();
  const other = await browser.newContext();
  try {
    for (const [context, label] of [[customer, "owner"], [other, "other"]] as const) {
      const response = await context.request.post(`${base}/api/auth/sign-up/email`, { data: {
        email: `m3-t05-${label}-${randomUUID()}@example.test`, name: label, password: "Disposable-Password-123" } });
      expect(response.ok()).toBe(true);
    }
    const ownerPage = await customer.newPage();
    await ownerPage.goto("/booking-saya");
    await expect(ownerPage.getByRole("heading", { name: /Belum ada booking/ })).toBeVisible();
    await ownerPage.screenshot({ path: `${output}/empty-desktop.png`, fullPage: true });
    await ownerPage.setViewportSize({ width: 390, height: 844 });
    await ownerPage.screenshot({ path: `${output}/empty-mobile.png`, fullPage: true });
    await ownerPage.setViewportSize({ width: 1280, height: 800 });
    const empty = await customer.request.get(`${base}/api/customer/bookings`);
    expect((await empty.json()).booking).toEqual([]);
    const packageId = await withDatabase(async (db) => {
      const item = (await db.query("INSERT INTO public.catalogue(catalogue_type_id,name,description,active) VALUES (1,'Bridal care','',true) RETURNING id")).rows[0].id;
      const pkg = (await db.query("INSERT INTO public.master_package(name,description,duration_minutes,base_price,published,active) VALUES ('Thoughtful Care','A considered companion',240,1000000,true,true) RETURNING id")).rows[0].id;
      await db.query("INSERT INTO public.package_catalogue(package_id,catalogue_id) VALUES ($1,$2)", [pkg, item]);
      return pkg as string;
    });
    const post = async (data: Record<string, unknown>) => customer.request.post(`${base}/api/customer/bookings`, { data });
    const invalid = [
      { packageId: "bad" }, { weddingDate: "2027-02-30" }, { whatsapp: "123" },
      { weddingStartTime: "25:70" }, { customerName: " " }, { weddingLocation: " " },
      { finalPrice: "1.00" }, { promotionId: randomUUID() }, { status: "Booking Berhasil" },
    ];
    for (const change of invalid) expect((await post({ ...input(packageId), ...change })).status()).toBe(422);
    expect((await post(input(randomUUID()))).status()).toBe(404);
    expect(Number(((await withDatabase((db) => db.query("SELECT count(*)::int AS n FROM public.booking"))) as { rows: { n: number }[] }).rows[0].n)).toBe(0);
    const promo = await withDatabase(async (db) => {
      const id = (await db.query("INSERT INTO public.promotion(title,description,discount_type,discount_value,starts_on,ends_on,published,active) VALUES ('Care offer','Ten percent','percentage',10,$1,$2,true,true) RETURNING id", [offset(1), offset(2)])).rows[0].id;
      await db.query("INSERT INTO public.promotion_package(promotion_id,package_id) VALUES ($1,$2)", [id, packageId]);
      return id as string;
    });
    const create = async () => { const response = await post(input(packageId)); expect(response.status()).toBe(200); return (await response.json()).booking; };
    const before = await create(); expect(before.promotion_id).toBeNull();
    await withDatabase((db) => db.query("UPDATE public.promotion SET starts_on=$1,ends_on=$2 WHERE id=$3", [today, offset(2), promo]));
    const onStart = await create(); expect(onStart.promotion_id).toBe(promo); expect(onStart.final_price).toBe("900000.00");
    await withDatabase((db) => db.query("UPDATE public.promotion SET starts_on=$1,ends_on=$2 WHERE id=$3", [offset(-2), today, promo]));
    const onEnd = await create(); expect(onEnd.promotion_id).toBe(promo);
    await withDatabase((db) => db.query("UPDATE public.promotion SET starts_on=$1,ends_on=$2 WHERE id=$3", [offset(-2), offset(-1), promo]));
    const after = await create(); expect(after.promotion_id).toBeNull();
    await withDatabase((db) => db.query("UPDATE public.promotion SET starts_on=$1,ends_on=$2,published=false WHERE id=$3", [today, today, promo]));
    expect((await create()).promotion_id).toBeNull();
    await withDatabase((db) => db.query("UPDATE public.promotion SET published=true,active=false WHERE id=$1", [promo]));
    expect((await create()).promotion_id).toBeNull();
    await withDatabase((db) => db.query("UPDATE public.promotion SET active=true WHERE id=$1", [promo]));
    const wrong = await withDatabase(async (db) => {
      const id = (await db.query("INSERT INTO public.master_package(name,description,duration_minutes,base_price,published,active) VALUES ('Other','',60,300000,true,true) RETURNING id")).rows[0].id;
      return id as string;
    });
    expect((await post(input(wrong))).status()).toBe(200);
    const retryInput = input(packageId);
    const [a, b] = await Promise.all([post(retryInput), post(retryInput)]);
    expect(a.status()).toBe(200); expect(b.status()).toBe(200);
    const id = (await a.json()).booking.id;
    expect((await b.json()).booking.id).toBe(id);
    expect((await post({ ...retryInput, note: "Changed" })).status()).toBe(409);
    await withDatabase((db) => db.query("UPDATE public.booking SET wedding_date='2027-02-15',wedding_location='Bandung',updated_at=now() WHERE id=$1", [id]));
    expect((await (await post(retryInput)).json()).booking.id).toBe(id);
    const otherRead = await other.request.get(`${base}/api/customer/bookings/${id}`);
    expect(otherRead.status()).toBe(404);
    expect((await (await other.request.get(`${base}/api/customer/bookings`)).json()).booking).toEqual([]);
    expect((await request.get(`${base}/api/customer/bookings/${id}`)).status()).toBe(401);
    const detail = await customer.request.get(`${base}/api/customer/bookings/${id}`);
    expect(detail.status()).toBe(200);
    const body = (await detail.json()).booking;
    expect(body.history).toHaveLength(1); expect(body.booking.submission_snapshot.weddingDate).toBe("2027-02-14");
    expect(body.booking.package_snapshot.basePrice).toBe("1000000.00");
    const counts = ((await withDatabase((db) => db.query("SELECT (SELECT count(*)::int FROM public.booking WHERE submission_key=$1) AS bookings,(SELECT count(*)::int FROM public.booking_status_history WHERE booking_id=$2) AS events", [retryInput.submissionKey, id]))) as { rows: { bookings: number; events: number }[] }).rows[0];
    expect(counts.bookings).toBe(1); expect(counts.events).toBe(1);
    await ownerPage.goto(`/booking?packageId=${packageId}`);
    await expect(ownerPage.getByRole("heading", { name: "Lengkapi pengajuan booking" })).toBeVisible();
    await ownerPage.screenshot({ path: `${output}/form-desktop.png`, fullPage: true });
    await ownerPage.setViewportSize({ width: 390, height: 844 });
    await ownerPage.screenshot({ path: `${output}/form-mobile.png`, fullPage: true });
    expect(await ownerPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await ownerPage.setViewportSize({ width: 1280, height: 800 });
    await ownerPage.getByLabel("Nama lengkap").fill("Rani");
    await ownerPage.getByLabel("WhatsApp").fill("+628123456789");
    await ownerPage.getByLabel("Email").fill("rani@example.test");
    await ownerPage.getByLabel("Tanggal wedding").fill("2027-03-14");
    await ownerPage.getByLabel("Waktu mulai").fill("10:30");
    await ownerPage.getByLabel("Lokasi wedding").fill("Jakarta");
    await ownerPage.getByRole("button", { name: "Ajukan Booking" }).focus();
    await expect(ownerPage.getByRole("button", { name: "Ajukan Booking" })).toBeFocused();
    await withDatabase((db) => db.query("UPDATE public.master_package SET published=false WHERE id=$1", [packageId]));
    await ownerPage.getByRole("button", { name: "Ajukan Booking" }).click();
    await expect(ownerPage.getByRole("alert").filter({ hasText: "Paket ini tidak tersedia" })).toBeVisible();
    await ownerPage.screenshot({ path: `${output}/error-desktop.png`, fullPage: true });
    await withDatabase((db) => db.query("UPDATE public.master_package SET published=true WHERE id=$1", [packageId]));
    await ownerPage.route("**/api/customer/bookings", async (route) => {
      await new Promise((done) => setTimeout(done, 500));
      await route.continue();
    });
    const submitClick = ownerPage.getByRole("button", { name: "Ajukan Booking" }).click();
    await expect(ownerPage.getByRole("button", { name: "Menyimpan…" })).toBeVisible();
    await ownerPage.screenshot({ path: `${output}/loading-desktop.png`, fullPage: true });
    await submitClick;
    await expect(ownerPage.getByRole("status")).toContainText("Menunggu Konfirmasi");
    expect(await ownerPage.locator('a[href^="https://wa.me/"]').count()).toBe(0);
    await ownerPage.screenshot({ path: `${output}/success-desktop.png`, fullPage: true });
    await ownerPage.goto("/booking-saya");
    await expect(ownerPage.getByRole("heading", { name: "Daftar Booking" })).toBeVisible();
    await ownerPage.reload();
    await expect(ownerPage.getByText("Rani", { exact: true })).toBeVisible();
    const firstBooking = ownerPage.getByRole("region", { name: "Daftar booking" }).getByRole("button").first();
    await firstBooking.focus();
    await expect(firstBooking).toBeFocused();
    await firstBooking.press("Enter");
    await expect(ownerPage.getByRole("heading", { name: "Perkembangan Booking" })).toBeVisible();
    await expect(ownerPage.getByText("14 Maret 2027").first()).toBeVisible();
    await expect(ownerPage.getByRole("heading", { name: "Perkembangan Booking" })).toBeVisible();
    await expect(ownerPage.getByRole("listitem").filter({ hasText: "Menunggu Konfirmasi" }).last()).toBeVisible();
    await ownerPage.screenshot({ path: `${output}/records-desktop.png`, fullPage: true });
    await ownerPage.setViewportSize({ width: 390, height: 844 });
    await ownerPage.screenshot({ path: `${output}/records-mobile.png`, fullPage: true });
    expect(await ownerPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    observations.retry = { id, counts }; observations.promotion = { before: before.promotion_id, onStart: onStart.promotion_id, onEnd: onEnd.promotion_id, after: after.promotion_id };
    observations.privacy = { anonymous: anonymous.status(), other: otherRead.status(), owner: detail.status() };
    await writeFile(`${output}/observations.json`, JSON.stringify(observations, null, 2));
  } finally { await customer.close(); await other.close(); }
});
