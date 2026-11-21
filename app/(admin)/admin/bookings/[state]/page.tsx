import { AdminBookingWorkspace } from "@/shared/admin-booking-workspace";

export default async function AdminBookingStatePage({ params }: Readonly<{ params: Promise<{ state: string }> }>) {
  const { state } = await params;
  return <AdminBookingWorkspace scenarioId={state === "empty" ? "admin.booking-empty" : "admin.booking-workspace"} />;
}
