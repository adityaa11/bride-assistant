import type { RepositoryResult } from "./repository-contracts";
type QueryClient = { query(sql: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }> };
export function lockDate(client: QueryClient, date: string): Promise<void>;
export function dateIsAvailable(client: QueryClient, date: string): Promise<boolean>;
export function reserveSuccessfulDate(client: QueryClient, booking: Record<string, unknown>): Promise<boolean>;
export function listUnavailableDates(client: QueryClient, from: string, to: string): Promise<RepositoryResult<{ date: string; state: "unavailable" }[]>>;
export function listClosedDates(client: QueryClient, from: string, to: string): Promise<RepositoryResult<string[]>>;
export function changeClosedDate(client: QueryClient, date: string, actorId: string, operation: "close" | "open"): Promise<RepositoryResult<{ date: string; closed: boolean }>>;
