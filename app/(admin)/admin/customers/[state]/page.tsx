import { AdminCustomerWorkspace } from "@/shared/admin-customer-workspace";
import { getCustomerScenario, type CustomerScenarioId } from "../scenarios";

const scenarios: Record<string, CustomerScenarioId> = { empty: "admin.customers-empty", error: "admin.customers-error" };

export default async function CustomersStatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  return <AdminCustomerWorkspace scenario={getCustomerScenario(scenarios[state] ?? "admin.customers-error")} />;
}
