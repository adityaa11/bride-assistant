import { AdminBookingLive } from "@/shared/admin-booking-live";
import { listPreparedAdminBookings, preparedAdminBookingEnabled } from "@/shared/server/admin-booking-service";

export default async function AdminBookingsPage() {
  if (!preparedAdminBookingEnabled()) return <AdminBookingLive initial={[]} unavailable />;
  const result = await listPreparedAdminBookings();
  return <AdminBookingLive initial={result.ok ? JSON.parse(JSON.stringify(result.value)) : []}
    error={result.ok ? null : result.code} />;
}
