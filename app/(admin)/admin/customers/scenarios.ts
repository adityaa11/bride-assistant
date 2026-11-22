import { getScenario } from "@/shared/scenarios/adapter";
import type { ScenarioResult, ScenarioState } from "@/shared/scenarios/contracts";

export type CustomerScenarioId = "admin.customers-directory" | "admin.customers-empty" | "admin.customers-error";

const states: Record<CustomerScenarioId, ScenarioState> = {
  "admin.customers-directory": { kind: "success", message: "Customer directory fixture siap ditinjau.", nextReviewAction: "Tinjau daftar, pencarian, dan riwayat booking customer." },
  "admin.customers-empty": { kind: "empty", message: "Tidak ada customer yang sesuai dengan filter.", nextReviewAction: "Tinjau empty state tanpa membuat customer." },
  "admin.customers-error": { kind: "error", message: "The customer directory fixture could not be prepared.", nextReviewAction: "Tinjau error state tanpa customer private data." },
};

export function getCustomerScenario(scenarioId: CustomerScenarioId): ScenarioResult {
  const bookingScenario = getScenario("admin.booking-workspace");
  const records = scenarioId === "admin.customers-directory" && bookingScenario.readModel.surface === "admin"
    ? bookingScenario.readModel.adminBooking?.records.map(({ id, customer, phone, packageName, date, start, end, location, status }) => ({ id, customer, phone, packageName, date, start, end, location, status })) ?? []
    : [];
  return {
    version: bookingScenario.version,
    scenarioId,
    state: states[scenarioId],
    provenance: bookingScenario.provenance,
    interaction: bookingScenario.interaction,
    readModel: { surface: "admin", title: "Your brides", description: "A simple directory of customers who have made a booking.", content: [], bookingStatuses: [], adminCustomers: { records } },
  };
}
