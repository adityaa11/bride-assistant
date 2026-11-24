import { sessionActor } from "@/shared/server/actor";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const actor = await sessionActor();
  if (!actor || actor.role !== "admin") redirect("/admin/masuk");
  return children;
}
