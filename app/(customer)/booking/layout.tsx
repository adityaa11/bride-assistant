import { sessionActor } from "@/shared/server/actor";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function BookingLayout({ children }: { children: ReactNode }) {
  const actor = await sessionActor();
  if (!actor || actor.role !== "customer") redirect("/masuk");
  return children;
}
