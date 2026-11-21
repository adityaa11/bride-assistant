import { CustomerAuth } from "@/shared/customer-auth";
import type { ScenarioId } from "@/shared/scenarios/adapter";

const scenarioByState = {
  validation: "customer.register-validation",
  loading: "customer.register-loading",
  error: "customer.register-error",
  success: "customer.register-success",
} as const satisfies Record<string, ScenarioId>;

export default async function RegistrationFixtureStatePage({ params }: Readonly<{ params: Promise<{ state: string }> }>) {
  const { state } = await params;
  return <CustomerAuth scenarioId={scenarioByState[state as keyof typeof scenarioByState] ?? "customer.register-success"} />;
}
