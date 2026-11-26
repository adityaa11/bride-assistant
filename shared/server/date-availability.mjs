const conflict = { ok: false, code: "CONFLICT" };
const failed = (error) => ({ ok: false, code: ["23503", "23505", "23514", "22007"].includes(error?.code) ? "CONFLICT" : "STORAGE_FAILURE" });

// All writers for a date acquire this transaction lock before checking either table.
export async function lockDate(client, date) {
  await client.query("SELECT pg_advisory_xact_lock(hashtext('m3-booking-date'), hashtext($1::text))", [date]);
}

export async function dateIsAvailable(client, date) {
  const result = await client.query(`SELECT NOT EXISTS (
    SELECT 1 FROM public.admin_closed_date WHERE date = $1::date
    UNION ALL SELECT 1 FROM public.booking_date_reservation WHERE wedding_date = $1::date
  ) AS available`, [date]);
  return result.rows[0].available === true;
}

export async function reserveSuccessfulDate(client, booking) {
  const date = String(booking.wedding_date).slice(0, 10);
  await lockDate(client, date);
  if (!await dateIsAvailable(client, date)) return false;
  await client.query(`INSERT INTO public.booking_date_reservation (booking_id, wedding_date)
    VALUES ($1, $2)`, [booking.id, date]);
  return true;
}

export async function listUnavailableDates(client, from, to) {
  const result = await client.query(`SELECT date::text AS date FROM public.admin_closed_date
    WHERE date BETWEEN $1::date AND $2::date
    UNION SELECT wedding_date::text AS date FROM public.booking_date_reservation
    WHERE wedding_date BETWEEN $1::date AND $2::date ORDER BY date`, [from, to]);
  return { ok: true, value: result.rows.map((row) => ({ date: row.date, state: "unavailable" })) };
}

export async function listClosedDates(client, from, to) {
  const result = await client.query(`SELECT date::text AS date FROM public.admin_closed_date
    WHERE date BETWEEN $1::date AND $2::date ORDER BY date`, [from, to]);
  return { ok: true, value: result.rows.map((row) => row.date) };
}

export async function changeClosedDate(client, date, actorId, operation) {
  try {
    await client.query("BEGIN");
    await lockDate(client, date);
    if (operation === "close") {
      if (!await dateIsAvailable(client, date)) { await client.query("ROLLBACK"); return conflict; }
      await client.query("INSERT INTO public.admin_closed_date (date, closed_by) VALUES ($1,$2)", [date, actorId]);
    } else {
      await client.query("DELETE FROM public.admin_closed_date WHERE date=$1", [date]);
    }
    await client.query("COMMIT");
    return { ok: true, value: { date, closed: operation === "close" } };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return failed(error);
  }
}
