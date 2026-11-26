import { adminBookingResponse, listPreparedAdminBookings, preparedAdminBookingEnabled } from "@/shared/server/admin-booking-service";
export async function GET() {
  if (!preparedAdminBookingEnabled()) return new Response(null, { status: 404 });
  return adminBookingResponse(await listPreparedAdminBookings());
}
