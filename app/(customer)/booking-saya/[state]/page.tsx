import { CustomerBookingHistory } from "@/shared/customer-booking-history";
import type { ScenarioId } from "@/shared/scenarios/adapter";

const states: Record<string, ScenarioId> = {
  loading: "customer.booking-loading",
  empty: "customer.bookings-empty",
  error: "customer.booking-history-error",
  payment: "customer.booking-history-payment",
  cancellation: "customer.booking-history-cancellation",
  cancelled: "customer.booking-history-cancelled",
  reschedule: "customer.booking-history-reschedule",
};

export default async function BookingHistoryStatePage({
  params,
}: Readonly<{ params: Promise<{ state: string }> }>) {
  const { state } = await params;
  return (
    <CustomerBookingHistory
      scenarioId={states[state] ?? "customer.booking-history-success"}
    />
  );
}
