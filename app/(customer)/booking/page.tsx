import { CustomerPackageSelection } from "@/shared/customer-package-selection";
import { loadPublicPackages } from "@/shared/server/public-package-read";
import { z } from "zod";

export default async function BookingPage({ searchParams }: { searchParams: Promise<{ packageId?: string }> }) {
  const { packageId } = await searchParams;
  const selected = z.uuid().safeParse(packageId);
  const result = await loadPublicPackages();
  return <CustomerPackageSelection packages={result.ok ? result.packages : []} selectedId={selected.success ? selected.data : undefined} error={!result.ok} />;
}
