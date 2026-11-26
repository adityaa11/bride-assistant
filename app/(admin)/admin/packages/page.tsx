import { AdminCatalogueLive } from "@/shared/admin-catalogue-live";
import { loadAdminCatalogue } from "@/shared/server/admin-catalogue-loader";

export default async function PackagesPage() {
  const result = await loadAdminCatalogue();
  return <AdminCatalogueLive kind="packages" data={result.ok ? result.value : null} error={result.ok ? null : result.code} />;
}
