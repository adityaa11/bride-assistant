import { CustomerBooking } from "@/shared/customer-booking";
import type { ScenarioId } from "@/shared/scenarios/adapter";
import { notFound } from "next/navigation";

const routes = { invalid: "customer.booking-request-invalid", unavailable: "customer.booking-request-unavailable", "no-package": "customer.booking-request-no-package", result: "customer.booking-request-result" } as const satisfies Record<string, ScenarioId>;
export function generateStaticParams() { return Object.keys(routes).map((state) => ({ state })); }
export default async function BookingStatePage({ params }: Readonly<{ params: Promise<{ state: string }> }>) { const { state } = await params; const scenarioId = routes[state as keyof typeof routes]; if (!scenarioId) notFound(); return <CustomerBooking scenarioId={scenarioId} />; }
