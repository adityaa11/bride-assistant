import { AdminCustomerWorkspace } from "@/shared/admin-customer-workspace";
import { getCustomerScenario } from "./scenarios";

export default function CustomersPage() {
  return <AdminCustomerWorkspace scenario={getCustomerScenario("admin.customers-directory")} />;
}
