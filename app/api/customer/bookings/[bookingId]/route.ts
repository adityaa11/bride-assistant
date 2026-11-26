import { bookingResponse, preparedBookingEnabled, readCustomerBooking } from "@/shared/server/customer-booking-service";

export async function GET(_request: Request, context: { params: Promise<{ bookingId: string }> }) {
  if (!preparedBookingEnabled()) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  const { bookingId } = await context.params;
  return bookingResponse(await readCustomerBooking(bookingId));
}
