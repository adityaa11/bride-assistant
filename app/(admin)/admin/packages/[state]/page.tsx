import { AdminCatalogueWorkspace } from "@/shared/admin-catalogue-workspace";
import type { ScenarioId } from "@/shared/scenarios/adapter";

const scenarios: Record<string, ScenarioId> = {
  empty: "admin.catalogue-packages-empty",
  error: "admin.catalogue-packages-error",
  "proposed-result": "admin.catalogue-packages-proposed-result",
  long: "admin.catalogue-packages-long",
};

export default async function PackageStatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  return <AdminCatalogueWorkspace scenarioId={scenarios[state] ?? "admin.catalogue-packages-error"} />;
}
