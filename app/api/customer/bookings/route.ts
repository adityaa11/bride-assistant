import { bookingResponse, listCustomerBookings, preparedBookingEnabled, submitCustomerBooking } from "@/shared/server/customer-booking-service";

const unavailable = () => new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
export async function GET() {
  if (!preparedBookingEnabled()) return unavailable();
  return bookingResponse(await listCustomerBookings());
}
export async function POST(request: Request) {
  if (!preparedBookingEnabled()) return unavailable();
  let payload: unknown;
  try { payload = await request.json(); } catch { payload = null; }
  return bookingResponse(await submitCustomerBooking(payload));
}
