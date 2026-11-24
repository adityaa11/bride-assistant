import { authorizeRequest } from "@/shared/server/authorization";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { z } from "zod";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const decision = await authorizeRequest({ requiredRole: "admin", payload: undefined, schema: z.undefined() });
  if (!decision.ok) redirect("/admin/masuk");
  return children;
}
