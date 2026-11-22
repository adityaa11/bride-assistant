import { AdminContentWorkspace } from "@/shared/admin-content-workspace";
import { getScenario } from "@/shared/scenarios/adapter";

export default function ContentPage() {
  return <AdminContentWorkspace scenario={getScenario("admin.content-draft-success")} resultScenario={getScenario("admin.content-proposed-result")} />;
}
