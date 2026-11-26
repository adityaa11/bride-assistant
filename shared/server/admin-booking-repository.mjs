const conflict = { ok: false, code: "CONFLICT" };
const absent = { ok: false, code: "NOT_FOUND" };
const sqlConflict = new Set(["23502", "23503", "23505", "23514", "22P02", "22007"]);
const failure = (error) => ({ ok: false, code: sqlConflict.has(error?.code) ? "CONFLICT" : "STORAGE_FAILURE" });
const admin = (decision) => decision?.ok === true && decision.actor?.role === "admin" && !!decision.actor.subjectId;

const bookingFields = `id, customer_id, package_id, promotion_id, submission_snapshot,
  wedding_date, wedding_start_time, wedding_location, status, package_snapshot,
  promotion_snapshot, final_price, created_at, updated_at`;

export async function listAdminBookings(client, decision) {
  if (!admin(decision)) return conflict;
  try {
    const result = await client.query(`SELECT ${bookingFields} FROM public.booking ORDER BY created_at DESC, id DESC`);
    return { ok: true, value: result.rows };
  } catch (error) { return failure(error); }
}

export async function readAdminBooking(client, decision) {
  if (!admin(decision)) return conflict;
  try {
    const booking = (await client.query(`SELECT ${bookingFields} FROM public.booking WHERE id = $1`,
      [decision.parsedData.bookingId])).rows[0];
    if (!booking) return absent;
    const history = (await client.query(`SELECT id, booking_id, actor_id, from_status, to_status, occurred_at
      FROM public.booking_status_history WHERE booking_id = $1 ORDER BY occurred_at, id`, [booking.id])).rows;
    return { ok: true, value: { booking, history } };
  } catch (error) { return failure(error); }
}

// T07 supplies the date-reservation operation inside this transaction. Without it,
// even a confirmed payment decision cannot publish Booking Berhasil.
export async function transitionAdminBooking(client, decision, reserveSuccessfulDate) {
  if (!admin(decision)) return conflict;
  const { bookingId, expectedStatus, targetStatus, paymentReviewed } = decision.parsedData;
  if (targetStatus === "Booking Berhasil" && (paymentReviewed !== true || !reserveSuccessfulDate)) return conflict;
  try {
    await client.query("BEGIN");
    const row = (await client.query(`SELECT id, status, wedding_date FROM public.booking
      WHERE id = $1 FOR UPDATE`, [bookingId])).rows[0];
    if (!row) { await client.query("ROLLBACK"); return absent; }
    const allowed = row.status === "Menunggu Konfirmasi" && targetStatus === "Menunggu Pembayaran" ||
      row.status === "Menunggu Pembayaran" && targetStatus === "Booking Berhasil";
    if (row.status !== expectedStatus || !allowed) { await client.query("ROLLBACK"); return conflict; }
    if (targetStatus === "Booking Berhasil") {
      const reserved = await reserveSuccessfulDate(client, row);
      if (reserved !== true) { await client.query("ROLLBACK"); return conflict; }
    }
    // Capture after the row lock; transaction-start time could predate a prior decision.
    const time = (await client.query("SELECT clock_timestamp() AS occurred_at")).rows[0].occurred_at;
    const booking = (await client.query(`UPDATE public.booking SET status = $2, updated_at = $3
      WHERE id = $1 RETURNING id, status, updated_at`, [bookingId, targetStatus, time])).rows[0];
    const event = (await client.query(`INSERT INTO public.booking_status_history
      (booking_id, actor_id, from_status, to_status, occurred_at)
      VALUES ($1,$2,$3,$4,$5) RETURNING id, booking_id, actor_id, from_status, to_status, occurred_at`,
    [bookingId, decision.actor.subjectId, row.status, targetStatus, time])).rows[0];
    await client.query("COMMIT");
    return { ok: true, value: { booking, event } };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return failure(error);
  }
}
