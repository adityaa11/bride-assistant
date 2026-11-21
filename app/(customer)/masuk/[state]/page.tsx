import { CustomerAuth } from "@/shared/customer-auth";
import type { ScenarioId } from "@/shared/scenarios/adapter";

const scenarioByState = {
  validation: "customer.signin-validation",
  loading: "customer.signin-loading",
  error: "customer.signin-error",
  success: "customer.signin-success",
} as const satisfies Record<string, ScenarioId>;

export default async function SignInFixtureStatePage({ params }: Readonly<{ params: Promise<{ state: string }> }>) {
  const { state } = await params;
  return <CustomerAuth scenarioId={scenarioByState[state as keyof typeof scenarioByState] ?? "customer.signin-success"} />;
}
