import { adminBookingResponse, decidePreparedAdminBooking, preparedAdminBookingEnabled, readPreparedAdminBooking } from "@/shared/server/admin-booking-service";
const unavailable = () => new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
export async function GET(_request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  if (!preparedAdminBookingEnabled()) return unavailable();
  const { bookingId } = await params;
  return adminBookingResponse(await readPreparedAdminBooking(bookingId));
}
export async function PATCH(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  if (!preparedAdminBookingEnabled()) return unavailable();
  const { bookingId } = await params;
  let payload: unknown;
  try { payload = await request.json(); } catch { payload = null; }
  return adminBookingResponse(await decidePreparedAdminBooking(
    typeof payload === "object" && payload !== null && !Array.isArray(payload)
      ? { ...payload, bookingId } : payload));
}
