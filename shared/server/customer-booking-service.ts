import "server-only";
import { z } from "zod";
import { authorizeRequest } from "./authorization";
import { withDatabase } from "./database.mjs";
import { createBooking, listOwnBookings, readOwnBooking } from "./booking-repository.mjs";

const calendarDate = z.iso.date().refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, "Tanggal tidak valid");
const nonblank = (max: number) => z.string().trim().min(1).max(max);
export const bookingSubmissionSchema = z.strictObject({
  submissionKey: z.uuid(),
  packageId: z.uuid(),
  customerName: nonblank(120),
  whatsapp: z.string().regex(/^\+[1-9]\d{7,14}$/),
  email: z.email().max(254).transform((value) => value.toLowerCase()),
  weddingDate: calendarDate,
  weddingStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  weddingLocation: nonblank(500),
  note: z.string().trim().max(2000).nullable().optional(),
});
const detailSchema = z.strictObject({ bookingId: z.uuid() });

export type BookingSubmissionInput = z.input<typeof bookingSubmissionSchema>;
export type BookingServiceResult =
  | { ok: true; value: unknown }
  | { ok: false; code: "AUTHENTICATION_REQUIRED" | "FORBIDDEN" | "INVALID_INPUT" | "NOT_FOUND" | "CONFLICT" | "STORAGE_FAILURE"; fields?: string[] };

// T07 replaces this local-only gate when reservation and closure are in one transaction.
export function preparedBookingEnabled(env = process.env) {
  return env.DATABASE_MODE === "local" && env.M3_T05_PREPARED_ROUTES === "1";
}

export async function submitCustomerBooking(payload: unknown): Promise<BookingServiceResult> {
  const decision = await authorizeRequest({ requiredRole: "customer", payload, schema: bookingSubmissionSchema });
  if (!decision.ok) return decision;
  try { return await withDatabase((client) => createBooking(client, decision)); }
  catch { return { ok: false, code: "STORAGE_FAILURE" }; }
}

export async function listCustomerBookings(): Promise<BookingServiceResult> {
  const decision = await authorizeRequest({ requiredRole: "customer", payload: undefined, schema: z.undefined() });
  if (!decision.ok) return decision;
  try { return await withDatabase((client) => listOwnBookings(client, decision)); }
  catch { return { ok: false, code: "STORAGE_FAILURE" }; }
}

export async function readCustomerBooking(bookingId: string): Promise<BookingServiceResult> {
  const decision = await authorizeRequest({ requiredRole: "customer", payload: { bookingId }, schema: detailSchema });
  if (!decision.ok) return decision;
  try { return await withDatabase((client) => readOwnBooking(client, decision)); }
  catch { return { ok: false, code: "STORAGE_FAILURE" }; }
}

export function bookingResponse(result: BookingServiceResult) {
  const status = result.ok ? 200 : ({ AUTHENTICATION_REQUIRED: 401, FORBIDDEN: 403,
    INVALID_INPUT: 422, NOT_FOUND: 404, CONFLICT: 409, STORAGE_FAILURE: 503 } as const)[result.code];
  return Response.json(result.ok ? { booking: result.value } : { error: result.code, fields: result.fields },
    { status, headers: { "Cache-Control": "no-store" } });
}
