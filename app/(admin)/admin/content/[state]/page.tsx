import { AdminContentWorkspace } from "@/shared/admin-content-workspace";
import { getScenario } from "@/shared/scenarios/adapter";

const stateIds = { empty: "admin.content-empty", error: "admin.content-error" } as const;
export default async function ContentStatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  return <AdminContentWorkspace scenario={getScenario(stateIds[state as keyof typeof stateIds] ?? stateIds.error)} resultScenario={getScenario("admin.content-proposed-result")} />;
}
