import { AdminPromotionWorkspace } from "@/shared/admin-promotion-workspace";
import { getScenario } from "@/shared/scenarios/adapter";

const stateIds = { empty: "admin.promotions-empty", error: "admin.promotions-error", long: "admin.promotions-long", result: "admin.promotions-proposed-result" } as const;
export default async function PromotionsStatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  return <AdminPromotionWorkspace scenario={getScenario(stateIds[state as keyof typeof stateIds] ?? stateIds.error)} resultScenario={getScenario("admin.promotions-proposed-result")} />;
}
