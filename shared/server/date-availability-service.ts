import "server-only";
import { z } from "zod";
import { authorizeRequest } from "./authorization";
import { withDatabase } from "./database.mjs";
import { changeClosedDate, listClosedDates, listUnavailableDates } from "./date-availability.mjs";

const date = z.iso.date().refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
});
const range = z.strictObject({ from: date, to: date }).refine(({ from, to }) => from <= to &&
  (new Date(`${to}T00:00:00Z`).valueOf() - new Date(`${from}T00:00:00Z`).valueOf()) <= 366 * 86400000);
const command = z.strictObject({ date, operation: z.enum(["close", "open"]) });
type Result = { ok: true; value: unknown } | { ok: false; code: "AUTHENTICATION_REQUIRED" | "FORBIDDEN" | "INVALID_INPUT" | "NOT_FOUND" | "CONFLICT" | "STORAGE_FAILURE"; fields?: string[] };
export async function customerAvailability(input: unknown): Promise<Result> {
  const parsed = range.safeParse(input);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };
  try { return await withDatabase((client) => listUnavailableDates(client, parsed.data.from, parsed.data.to)); }
  catch { return { ok: false, code: "STORAGE_FAILURE" }; }
}
export async function adminAvailability(input: unknown): Promise<Result> {
  const decision = await authorizeRequest({ requiredRole: "admin", payload: input, schema: range });
  if (!decision.ok) return decision;
  try { return await withDatabase((client) => listClosedDates(client, decision.parsedData.from, decision.parsedData.to)); }
  catch { return { ok: false, code: "STORAGE_FAILURE" }; }
}
export async function adminClosure(input: unknown): Promise<Result> {
  const decision = await authorizeRequest({ requiredRole: "admin", payload: input, schema: command });
  if (!decision.ok) return decision;
  try { return await withDatabase((client) => changeClosedDate(client, decision.parsedData.date, decision.actor.subjectId, decision.parsedData.operation)); }
  catch { return { ok: false, code: "STORAGE_FAILURE" }; }
}
export function availabilityResponse(result: Result) {
  const status = result.ok ? 200 : ({ AUTHENTICATION_REQUIRED: 401, FORBIDDEN: 403, INVALID_INPUT: 422, NOT_FOUND: 404,
    CONFLICT: 409, STORAGE_FAILURE: 503 } as const)[result.code];
  return Response.json(result.ok ? { dates: result.value } : { error: result.code, fields: result.fields },
    { status, headers: { "Cache-Control": "no-store" } });
}
