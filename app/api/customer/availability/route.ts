import { availabilityResponse, customerAvailability } from "@/shared/server/date-availability-service";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  return availabilityResponse(await customerAvailability({ from: params.get("from"), to: params.get("to") }));
}
