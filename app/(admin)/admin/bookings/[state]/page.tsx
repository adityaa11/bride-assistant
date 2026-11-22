import { AdminBookingWorkspace } from "@/shared/admin-booking-workspace";

export default async function AdminBookingStatePage({ params, searchParams }: Readonly<{ params: Promise<{ state: string }>; searchParams: Promise<{ booking?: string }> }>) {
  const { state } = await params;
  const { booking } = await searchParams;
  return <AdminBookingWorkspace scenarioId={state === "empty" ? "admin.booking-empty" : "admin.booking-workspace"} initialSelection={state === "detail" ? booking : null} />;
}
