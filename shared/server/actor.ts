import "server-only";
import { headers } from "next/headers";
import { getAuth } from "./auth";

export type SessionActor = { subjectId: string; role: "customer" | "admin"; sessionId: string; expiresAt: Date };

export async function sessionActor(): Promise<SessionActor | null> {
  const requestHeaders = await headers();
  const result = await getAuth().api.getSession({ headers: requestHeaders });
  if (!result) return null;
  const role = (result.user as typeof result.user & { role?: string }).role;
  if (role !== "customer" && role !== "admin") return null;
  return { subjectId: result.user.id, role, sessionId: result.session.id, expiresAt: result.session.expiresAt };
}
