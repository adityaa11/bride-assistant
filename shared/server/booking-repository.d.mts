import type { AuthorizedRepositoryInput, RepositoryResult } from "./repository-contracts";

type QueryClient = { query(sql: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }> };
export type BookingSubmission = {
  submissionKey: string; packageId: string; customerName: string; whatsapp: string;
  email: string; weddingDate: string; weddingStartTime: string; weddingLocation: string;
  note?: string | null;
};
export function createBooking(client: QueryClient, input: AuthorizedRepositoryInput<BookingSubmission>): Promise<RepositoryResult<Record<string, unknown>>>;
export function listOwnBookings(client: QueryClient, input: AuthorizedRepositoryInput<undefined>): Promise<RepositoryResult<Record<string, unknown>[]>>;
export function readOwnBooking(client: QueryClient, input: AuthorizedRepositoryInput<{ bookingId: string }>): Promise<RepositoryResult<{
  booking: Record<string, unknown>; history: Record<string, unknown>[];
}>>;
