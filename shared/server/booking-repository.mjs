import { createHash } from "node:crypto";
import { resolvePackage } from "./catalogue-repository.mjs";

const conflict = { ok: false, code: "CONFLICT" };
const absent = { ok: false, code: "NOT_FOUND" };
const sqlConflict = new Set(["23502", "23503", "23505", "23514", "22P02", "22007", "22003"]);

function failed(error) {
  return { ok: false, code: sqlConflict.has(error?.code) ? "CONFLICT" : "STORAGE_FAILURE" };
}
function customer(decision) {
  return decision?.ok === true && decision.actor?.role === "customer" &&
    typeof decision.actor.subjectId === "string" && decision.actor.subjectId.length > 0;
}
function cents(value) {
  const match = String(value).match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) throw Object.assign(new Error("INVALID_PRICE"), { code: "23514" });
  return BigInt(match[1]) * 100n + BigInt((match[2] ?? "").padEnd(2, "0"));
}
function money(value) {
  return `${value / 100n}.${String(value % 100n).padStart(2, "0")}`;
}
function finalPrice(base, promotion) {
  const baseCents = cents(base);
  if (!promotion) return money(baseCents);
  const discount = promotion.discount_type === "percentage"
    ? (baseCents * cents(promotion.discount_value) + 5000n) / 10000n
    : cents(promotion.discount_value);
  return money(baseCents > discount ? baseCents - discount : 0n);
}
function submitted(data) {
  const fields = {
    customerName: data.customerName, whatsapp: data.whatsapp, email: data.email,
    weddingDate: data.weddingDate, weddingStartTime: data.weddingStartTime,
    weddingLocation: data.weddingLocation, note: data.note ?? null, packageId: data.packageId,
  };
  if (Object.values(fields).some((value) => value === undefined || typeof value === "object" && value !== null))
    throw Object.assign(new Error("INVALID_SUBMISSION"), { code: "23514" });
  return fields;
}
function hash(snapshot) {
  return createHash("sha256").update(JSON.stringify(Object.values(snapshot))).digest("hex");
}

export async function createBooking(client, decision) {
  if (!customer(decision)) return conflict;
  const data = decision.parsedData;
  let snapshot, payloadHash;
  try { snapshot = submitted(data); payloadHash = hash(snapshot); }
  catch (error) { return failed(error); }
  try {
    await client.query("BEGIN");
    // Same customer/key serializes before catalogue reads, so a replay survives later edits.
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))",
      [decision.actor.subjectId, data.submissionKey]);
    const old = (await client.query(`SELECT * FROM public.booking
      WHERE customer_id = $1 AND submission_key = $2`,
    [decision.actor.subjectId, data.submissionKey])).rows[0];
    if (old) {
      await client.query("COMMIT");
      return old.submission_payload_hash === payloadHash ? { ok: true, value: old } : conflict;
    }
    // T02 promotion writes lock the same package, preserving the terms resolved here.
    const locked = (await client.query(`SELECT id FROM public.master_package WHERE id = $1
      AND published AND active FOR SHARE`, [data.packageId])).rows[0];
    if (!locked) { await client.query("ROLLBACK"); return absent; }
    const time = (await client.query("SELECT now() AS created_at")).rows[0].created_at;
    const resolved = await resolvePackage(client, { ...decision,
      parsedData: { packageId: data.packageId, createdAt: time.toISOString() } });
    if (!resolved.ok) { await client.query("ROLLBACK"); return resolved; }
    const { package: pkg, items, promotion } = resolved.value;
    const packageSnapshot = { id: pkg.id, name: pkg.name, description: pkg.description,
      durationMinutes: pkg.duration_minutes, basePrice: pkg.base_price, items };
    const promotionSnapshot = promotion && { id: promotion.id, title: promotion.title,
      description: promotion.description, discountType: promotion.discount_type,
      discountValue: promotion.discount_value, startsOn: promotion.starts_on,
      endsOn: promotion.ends_on };
    const price = finalPrice(pkg.base_price, promotion);
    const booking = (await client.query(`INSERT INTO public.booking
      (customer_id, package_id, promotion_id, submission_key, submission_snapshot,
       submission_payload_hash, wedding_date, wedding_start_time, wedding_location,
       package_snapshot, promotion_snapshot, final_price, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13) RETURNING *`,
    [decision.actor.subjectId, data.packageId, promotion?.id ?? null, data.submissionKey,
      snapshot, payloadHash, data.weddingDate, data.weddingStartTime, data.weddingLocation,
      packageSnapshot, promotionSnapshot, price, time])).rows[0];
    await client.query(`INSERT INTO public.booking_status_history
      (booking_id, actor_id, from_status, to_status, occurred_at)
      VALUES ($1,$2,NULL,'Menunggu Konfirmasi',$3)`,
    [booking.id, decision.actor.subjectId, time]);
    await client.query("COMMIT");
    return { ok: true, value: booking };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return failed(error);
  }
}

export async function listOwnBookings(client, decision) {
  if (!customer(decision)) return conflict;
  try {
    const rows = await client.query(`SELECT * FROM public.booking WHERE customer_id = $1
      ORDER BY created_at DESC, id DESC`, [decision.actor.subjectId]);
    return { ok: true, value: rows.rows };
  } catch (error) { return failed(error); }
}

export async function readOwnBooking(client, decision) {
  if (!customer(decision)) return conflict;
  try {
    const booking = (await client.query(`SELECT * FROM public.booking
      WHERE id = $1 AND customer_id = $2`,
    [decision.parsedData.bookingId, decision.actor.subjectId])).rows[0];
    if (!booking) return absent;
    const history = (await client.query(`SELECT id, booking_id, actor_id, from_status, to_status, occurred_at
      FROM public.booking_status_history WHERE booking_id = $1 ORDER BY occurred_at, id`,
    [booking.id])).rows;
    return { ok: true, value: { booking, history } };
  } catch (error) { return failed(error); }
}
