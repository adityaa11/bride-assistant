import { adminAvailability, adminClosure, availabilityResponse } from "@/shared/server/date-availability-service";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  return availabilityResponse(await adminAvailability({ from: params.get("from"), to: params.get("to") }));
}
export async function POST(request: Request) {
  let payload: unknown;
  try { payload = await request.json(); } catch { payload = null; }
  return availabilityResponse(await adminClosure(payload));
}
