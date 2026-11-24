import type { z } from "zod";
import type { SessionActor } from "./actor";

export type RequiredRole = SessionActor["role"];
export type AuthorizationFailure =
  | { ok: false; code: "AUTHENTICATION_REQUIRED" | "FORBIDDEN" }
  | { ok: false; code: "INVALID_INPUT"; fields: string[] };

export type AuthorizationResult<T> =
  | { ok: true; actor: SessionActor; parsedData: T; record: "unscoped" | "found" | "missing" }
  | AuthorizationFailure;

export type DecisionInput<S extends z.ZodType> = {
  actor: SessionActor | null;
  requiredRole: RequiredRole;
  // The caller obtains this from a trusted record lookup. null means missing;
  // undefined means that no record owner check applies.
  recordOwnerId?: string | null;
  payload: unknown;
  schema: S;
};

export function decideActorInput<S extends z.ZodType>({
  actor, requiredRole, recordOwnerId, payload, schema,
}: DecisionInput<S>): AuthorizationResult<z.output<S>> {
  if (!actor) return { ok: false, code: "AUTHENTICATION_REQUIRED" };
  if (actor.role !== requiredRole) return { ok: false, code: "FORBIDDEN" };
  if (recordOwnerId !== undefined && recordOwnerId !== null && recordOwnerId !== actor.subjectId)
    return { ok: false, code: "FORBIDDEN" };
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      fields: [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")).filter(Boolean))],
    };
  }
  return {
    ok: true,
    actor,
    parsedData: parsed.data,
    record: recordOwnerId === undefined ? "unscoped" : recordOwnerId === null ? "missing" : "found",
  };
}
