import { CustomerBookingRecords } from "@/shared/customer-booking-records";
import { listCustomerBookings, preparedBookingEnabled, readCustomerBooking } from "@/shared/server/customer-booking-service";

export default async function BookingHistoryPage() {
  if (!preparedBookingEnabled()) return <CustomerBookingRecords records={[]} unavailable />;
  const result = await listCustomerBookings();
  if (!result.ok) return <CustomerBookingRecords records={[]} error />;
  const records = JSON.parse(JSON.stringify(result.value));
  const detail = records[0] ? await readCustomerBooking(records[0].id) : null;
  const initialHistory = detail?.ok ? JSON.parse(JSON.stringify((detail.value as { history: unknown[] }).history)) : [];
  return <CustomerBookingRecords records={records} initialHistory={initialHistory} />;
}
