import "server-only";
import { z } from "zod";
import { authorizeRequest } from "./authorization";
import { withDatabase } from "./database.mjs";
import { listAdminBookings, readAdminBooking, transitionAdminBooking } from "./admin-booking-repository.mjs";

const uuid = z.uuid();
const detailSchema = z.strictObject({ bookingId: uuid });
const transitionSchema = z.strictObject({ bookingId: uuid,
  expectedStatus: z.enum(["Menunggu Konfirmasi", "Menunggu Pembayaran"]),
  targetStatus: z.enum(["Menunggu Pembayaran", "Booking Berhasil"]),
  paymentReviewed: z.boolean().optional(),
});
type Result = { ok: true; value: unknown } | { ok: false; code: "AUTHENTICATION_REQUIRED" | "FORBIDDEN" | "INVALID_INPUT" | "NOT_FOUND" | "CONFLICT" | "STORAGE_FAILURE"; fields?: string[] };

export function preparedAdminBookingEnabled(env = process.env) {
  return env.DATABASE_MODE === "local" && env.M3_T06_PREPARED_ROUTES === "1";
}
export async function listPreparedAdminBookings(): Promise<Result> {
  const decision = await authorizeRequest({ requiredRole: "admin", payload: undefined, schema: z.undefined() });
  if (!decision.ok) return decision;
  try { return await withDatabase((client) => listAdminBookings(client, decision)); }
  catch { return { ok: false, code: "STORAGE_FAILURE" }; }
}
export async function readPreparedAdminBooking(bookingId: string): Promise<Result> {
  const decision = await authorizeRequest({ requiredRole: "admin", payload: { bookingId }, schema: detailSchema });
  if (!decision.ok) return decision;
  try { return await withDatabase((client) => readAdminBooking(client, decision)); }
  catch { return { ok: false, code: "STORAGE_FAILURE" }; }
}
export async function decidePreparedAdminBooking(payload: unknown): Promise<Result> {
  const decision = await authorizeRequest({ requiredRole: "admin", payload, schema: transitionSchema });
  if (!decision.ok) return decision;
  // T07 installs the transactional reservation callback and activates success.
  try { return await withDatabase((client) => transitionAdminBooking(client, decision)); }
  catch { return { ok: false, code: "STORAGE_FAILURE" }; }
}
export function adminBookingResponse(result: Result) {
  const status = result.ok ? 200 : ({ AUTHENTICATION_REQUIRED: 401, FORBIDDEN: 403,
    INVALID_INPUT: 422, NOT_FOUND: 404, CONFLICT: 409, STORAGE_FAILURE: 503 } as const)[result.code];
  return Response.json(result.ok ? { result: result.value } : { error: result.code, fields: result.fields },
    { status, headers: { "Cache-Control": "no-store" } });
}
