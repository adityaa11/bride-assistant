import { authorizeRequest } from "@/shared/server/authorization";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { z } from "zod";

export default async function BookingHistoryLayout({ children }: { children: ReactNode }) {
  const decision = await authorizeRequest({ requiredRole: "customer", payload: undefined, schema: z.undefined() });
  if (!decision.ok) redirect("/masuk");
  return children;
}
