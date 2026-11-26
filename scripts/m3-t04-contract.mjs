import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";
import { createBooking, listOwnBookings, readOwnBooking } from "../shared/server/booking-repository.mjs";

const root = resolve(import.meta.dirname, "..");
const project = `bride-m3-t04-${randomBytes(5).toString("hex")}`;
const password = randomBytes(24).toString("hex");
const env = { ...process.env, M2_LOCAL_DB_PASSWORD: password, M2_LOCAL_PG_PORT: "0" };
const output = process.argv[2] && resolve(process.argv[2]);
function docker(...args) {
  return execFileSync("docker", ["compose", "-p", project, "-f", "compose.m2-local.yaml", ...args],
    { cwd: root, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function actor(id, parsedData) { return { ok: true, actor: { subjectId: id, role: "customer" }, parsedData, record: "unscoped" }; }
function ok(result) { assert.equal(result.ok, true, JSON.stringify(result)); return result.value; }
function count(rows) { return Number(rows[0].count); }
const input = (packageId, submissionKey = randomUUID()) => ({ submissionKey, packageId,
  customerName: "Ayu", whatsapp: "+628123456789", email: "ayu@example.test",
  weddingDate: "2027-02-14", weddingStartTime: "10:30", weddingLocation: "Jakarta", note: "Garden" });

let started = false;
try {
  docker("up", "-d", "--wait"); started = true;
  const port = Number(docker("port", "postgres", "5432").split(":").at(-1));
  const databaseUrl = `postgresql://bride_local:${password}@127.0.0.1:${port}/bride_local`;
  const migration = JSON.parse(execFileSync(process.execPath, ["scripts/m2-migrate.mjs"],
    { cwd: root, env: { ...env, DATABASE_MODE: "local", DATABASE_URL: databaseUrl,
      DATABASE_EXPECTED_NAME: "bride_local" }, encoding: "utf8" }));
  assert.deepEqual(migration.migrations, ["0001", "0002", "0003", "0004", "0005"]);
  const client = new pg.Client({ connectionString: databaseUrl }); await client.connect();
  try {
    const schema = (await client.query(`SELECT c.conrelid::regclass::text AS source, c.conname,
      c.contype, CASE WHEN c.contype='f' THEN c.confrelid::regclass::text END AS target,
      array(SELECT a.attname FROM unnest(c.conkey) WITH ORDINALITY k(num,ord)
        JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=k.num ORDER BY k.ord) AS columns
      FROM pg_constraint c WHERE c.conrelid IN ('public.booking'::regclass,
        'public.booking_status_history'::regclass) ORDER BY source, c.conname`)).rows;
    for (const table of ["booking", "booking_status_history"])
      assert.ok(schema.some((row) => row.source === table && row.contype === "p"));
    for (const [source, target] of [["booking", "user"], ["booking", "master_package"],
      ["booking", "promotion"], ["booking_status_history", "booking"],
      ["booking_status_history", "user"]])
      assert.ok(schema.some((row) => row.source === source &&
        (target === "user" ? row.target === 'auth."user"' : row.target === target) && row.contype === "f"), `${source} → ${target}`);
    assert.ok(schema.some((row) => row.conname === "booking_customer_submission_key_unique"));
    const empty = ok(await listOwnBookings(client, actor("customer-1", undefined)));
    assert.deepEqual(empty, []);
    assert.equal((await readOwnBooking(client, actor("customer-1", { bookingId: randomUUID() }))).code, "NOT_FOUND");
    for (const id of ["customer-1", "customer-2"])
      await client.query(`INSERT INTO auth."user" (id,name,email) VALUES ($1,$2,$3)`, [id, id, `${id}@example.test`]);
    const packageId = (await client.query(`INSERT INTO public.master_package
      (name,description,duration_minutes,base_price,published) VALUES ('Wedding','Two hours',120,1000000,true) RETURNING id`)).rows[0].id;
    const itemId = (await client.query(`INSERT INTO public.catalogue
      (catalogue_type_id,name,description) VALUES (1,'Photography','Full ceremony') RETURNING id`)).rows[0].id;
    await client.query(`INSERT INTO public.package_catalogue (package_id,catalogue_id) VALUES ($1,$2)`, [packageId, itemId]);
    const promotedId = (await client.query(`INSERT INTO public.promotion
      (title,description,discount_type,discount_value,starts_on,ends_on,published)
      VALUES ('Launch','Ten percent','percentage',10,current_date - 1,current_date + 1,true) RETURNING id`)).rows[0].id;
    await client.query(`INSERT INTO public.promotion_package VALUES ($1,$2)`, [promotedId, packageId]);
    const interrupted = input(packageId);
    const faultClient = { query(sql, values) {
      if (sql.startsWith("INSERT INTO public.booking_status_history")) throw new Error("injected history failure");
      return client.query(sql, values);
    } };
    assert.equal((await createBooking(faultClient, actor("customer-1", interrupted))).code, "STORAGE_FAILURE");
    assert.equal(count((await client.query(`SELECT count(*) FROM public.booking`)).rows), 0);
    assert.equal(count((await client.query(`SELECT count(*) FROM public.booking_status_history`)).rows), 0);
    const request = input(packageId);
    const first = ok(await createBooking(client, actor("customer-1", request)));
    assert.equal(first.status, "Menunggu Konfirmasi");
    assert.equal(first.promotion_id, promotedId);
    assert.equal(first.package_snapshot.basePrice, "1000000.00");
    assert.equal(first.package_snapshot.items[0].name, "Photography");
    assert.equal(first.final_price, "900000.00");
    assert.equal(first.submission_snapshot.note, "Garden");
    const initial = ok(await readOwnBooking(client, actor("customer-1", { bookingId: first.id })));
    assert.equal(initial.history.length, 1);
    assert.equal(initial.history[0].actor_id, "customer-1");
    assert.equal(initial.history[0].to_status, "Menunggu Konfirmasi");
    assert.equal(initial.history[0].from_status, null);
    assert.equal((await readOwnBooking(client, actor("customer-2", { bookingId: first.id }))).code, "NOT_FOUND");
    assert.equal(ok(await createBooking(client, actor("customer-1", request))).id, first.id);
    assert.equal((await createBooking(client, actor("customer-1", { ...request, note: "Changed" }))).code, "CONFLICT");
    const otherCustomer = ok(await createBooking(client, actor("customer-2", request)));
    assert.notEqual(otherCustomer.id, first.id);
    await client.query(`UPDATE public.booking SET wedding_date='2027-02-15', wedding_location='Bandung', updated_at=now()
      WHERE id=$1`, [first.id]);
    assert.equal(ok(await createBooking(client, actor("customer-1", request))).id, first.id);
    await client.query(`UPDATE public.master_package SET name='Changed',description='Changed',base_price=2000000 WHERE id=$1`, [packageId]);
    await client.query(`UPDATE public.catalogue SET name='Changed item' WHERE id=$1`, [itemId]);
    await client.query(`UPDATE public.promotion SET title='Changed',discount_value=20 WHERE id=$1`, [promotedId]);
    const afterEdit = ok(await readOwnBooking(client, actor("customer-1", { bookingId: first.id })));
    assert.equal(afterEdit.booking.package_snapshot.name, "Wedding");
    assert.equal(afterEdit.booking.package_snapshot.description, "Two hours");
    assert.equal(afterEdit.booking.package_snapshot.items[0].name, "Photography");
    assert.equal(afterEdit.booking.promotion_snapshot.title, "Launch");
    assert.equal(afterEdit.booking.final_price, "900000.00");
    assert.equal(afterEdit.booking.submission_snapshot.weddingDate, "2027-02-14");
    for (const sql of [
      `UPDATE public.booking SET package_snapshot='{}' WHERE id=$1`,
      `UPDATE public.booking SET submission_payload_hash=repeat('0',64) WHERE id=$1`,
      `UPDATE public.booking_status_history SET to_status='Dibatalkan' WHERE booking_id=$1`,
      `DELETE FROM public.booking_status_history WHERE booking_id=$1`,
    ]) await assert.rejects(client.query(sql, [first.id]), { code: "23514" });
    assert.equal((await createBooking(client, actor("missing-user", input(packageId)))).code, "CONFLICT");
    assert.equal((await createBooking(client, actor("customer-1", input(randomUUID())))).code, "NOT_FOUND");
    await client.query(`UPDATE public.promotion SET active=false WHERE id=$1`, [promotedId]);
    const noPromotion = ok(await createBooking(client, actor("customer-1", input(packageId))));
    assert.equal(noPromotion.promotion_id, null);
    assert.equal(noPromotion.promotion_snapshot, null);
    assert.equal(noPromotion.final_price, "2000000.00");
    const race = input(packageId);
    const raceClients = await Promise.all([0, 1].map(async () => {
      const c = new pg.Client({ connectionString: databaseUrl }); await c.connect(); return c;
    }));
    try {
      const results = await Promise.all(raceClients.map((c) => createBooking(c, actor("customer-1", race))));
      assert.equal(ok(results[0]).id, ok(results[1]).id);
    } finally { await Promise.all(raceClients.map((c) => c.end())); }
    const counts = (await client.query(`SELECT (SELECT count(*) FROM public.booking) AS bookings,
      (SELECT count(*) FROM public.booking_status_history) AS events`)).rows[0];
    assert.equal(Number(counts.bookings), 4);
    assert.equal(Number(counts.events), 4);
    assert.equal(count((await client.query(`SELECT count(*) FROM public.booking_status_history
      WHERE booking_id=$1`, [first.id])).rows), 1);
    await client.query(`INSERT INTO public.booking_status_history
      (booking_id,actor_id,from_status,to_status,occurred_at)
      VALUES ($1,'customer-2','Menunggu Konfirmasi','Menunggu Pembayaran',now()+interval '1 second'),
             ($1,'customer-2','Menunggu Pembayaran','Booking Berhasil',now()+interval '2 seconds')`, [first.id]);
    assert.deepEqual(ok(await readOwnBooking(client, actor("customer-1", { bookingId: first.id })))
      .history.map((event) => event.to_status),
    ["Menunggu Konfirmasi", "Menunggu Pembayaran", "Booking Berhasil"]);
    assert.equal(ok(await listOwnBookings(client, actor("customer-1", undefined))).length, 3);
    const observations = { migration: migration.migrations, emptyCount: empty.length,
      promoted: { id: first.id, packageId, promotionId: promotedId, basePrice: "1000000.00", finalPrice: first.final_price },
      noPromotion: { id: noPromotion.id, finalPrice: noPromotion.final_price },
      replay: { originalId: first.id, afterEditId: afterEdit.booking.id, bookings: Number(counts.bookings),
        events: Number(counts.events) }, schema };
    if (output) { await mkdir(output, { recursive: true });
      await writeFile(resolve(output, "observations.json"), JSON.stringify(observations, null, 2)); }
    console.log(`PASS: ${migration.migrations.join(",")}; schema 2 PK/5 FK; empty/missing; snapshots; retry/concurrency; immutable history; ${counts.bookings} bookings/${counts.events} events`);
  } finally { await client.end(); }
} finally { if (started) docker("down", "--volumes", "--remove-orphans"); }
