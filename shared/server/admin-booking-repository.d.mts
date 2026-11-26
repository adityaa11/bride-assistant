import type { AuthorizedRepositoryInput, RepositoryResult } from "./repository-contracts";
type QueryClient = { query(sql: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }> };
export type AdminBookingTransition = { bookingId: string; expectedStatus: "Menunggu Konfirmasi" | "Menunggu Pembayaran"; targetStatus: "Menunggu Pembayaran" | "Booking Berhasil"; paymentReviewed?: boolean };
export function listAdminBookings(client: QueryClient, input: AuthorizedRepositoryInput<undefined>): Promise<RepositoryResult<Record<string, unknown>[]>>;
export function readAdminBooking(client: QueryClient, input: AuthorizedRepositoryInput<{ bookingId: string }>): Promise<RepositoryResult<{ booking: Record<string, unknown>; history: Record<string, unknown>[] }>>;
export function transitionAdminBooking(client: QueryClient, input: AuthorizedRepositoryInput<AdminBookingTransition>, reserveSuccessfulDate?: (client: QueryClient, row: Record<string, unknown>) => Promise<boolean>): Promise<RepositoryResult<{ booking: Record<string, unknown>; event: Record<string, unknown> }>>;
