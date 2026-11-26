import { PublicHome } from "@/shared/public-home";
import { loadPublicPackages } from "@/shared/server/public-package-read";
import { connection } from "next/server";

export default async function PublicHomePage() {
  await connection();
  const result = await loadPublicPackages();
  return <PublicHome scenarioId="public.discovery-success" livePackages={result.ok ? result.packages : []} liveError={!result.ok} />;
}
