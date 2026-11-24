import "server-only";
import type { AuthorizationResult } from "./authorization-decision";

// Only T05's successful actor and schema decision may enter an authoritative
// repository. A missing owner record remains a typed absence, not a new record.
export type AuthorizedRepositoryInput<T> = Extract<AuthorizationResult<T>, { ok: true }>;

export type RepositoryResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: "NOT_FOUND" | "CONFLICT" | "STORAGE_FAILURE" };

// M3/M4 implement operation-specific repositories. The caller supplies the
// T05 decision; each implementation must check the trusted record identity
// against that actor before reading or mutating a row. A storage key is never
// an identity or authorization credential.
export interface ProtectedRepository<Input, Output> {
  read(input: AuthorizedRepositoryInput<Input>): Promise<RepositoryResult<Output>>;
  write(input: AuthorizedRepositoryInput<Input>): Promise<RepositoryResult<Output>>;
}
