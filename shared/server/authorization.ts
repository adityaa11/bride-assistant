import "server-only";
import type { z } from "zod";
import { sessionActor } from "./actor";
import { decideActorInput, type AuthorizationResult, type DecisionInput } from "./authorization-decision";

export { decideActorInput } from "./authorization-decision";
export type { AuthorizationFailure, AuthorizationResult, DecisionInput, RequiredRole } from "./authorization-decision";

export async function authorizeRequest<S extends z.ZodType>(
  input: Omit<DecisionInput<S>, "actor">,
): Promise<AuthorizationResult<z.output<S>>> {
  return decideActorInput({ ...input, actor: await sessionActor() });
}
