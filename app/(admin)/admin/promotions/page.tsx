import { AdminPromotionWorkspace } from "@/shared/admin-promotion-workspace";
import { getScenario } from "@/shared/scenarios/adapter";

export default function PromotionsPage() {
  return <AdminPromotionWorkspace scenario={getScenario("admin.promotions-default")} resultScenario={getScenario("admin.promotions-proposed-result")} />;
}
