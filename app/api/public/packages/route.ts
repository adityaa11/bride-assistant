import { loadPublicPackages } from "@/shared/server/public-package-read";

export async function GET() {
  const result = await loadPublicPackages();
  return Response.json(result.ok ? { packages: result.packages } : { error: result.code },
    { status: result.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
