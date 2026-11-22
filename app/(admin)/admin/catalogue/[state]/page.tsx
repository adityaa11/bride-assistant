import { AdminCatalogueWorkspace } from "@/shared/admin-catalogue-workspace";
import type { ScenarioId } from "@/shared/scenarios/adapter";

const scenarios: Record<string, ScenarioId> = {
  empty: "admin.catalogue-empty",
  error: "admin.catalogue-error",
  "proposed-result": "admin.catalogue-proposed-result",
};

export default async function CatalogueStatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  return <AdminCatalogueWorkspace scenarioId={scenarios[state] ?? "admin.catalogue-error"} />;
}
