import type { AuthorizedRepositoryInput, RepositoryResult } from "./repository-contracts";

type QueryClient = { query(sql: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }> };
type ItemInput = { catalogueTypeId: number; name: string; description?: string; active?: boolean };
type BundleInput = { name: string; description?: string; active?: boolean; catalogueIds?: string[] };
type PackageInput = { name: string; description?: string; durationMinutes: number; basePrice: string;
  published?: boolean; active?: boolean; catalogueIds?: string[]; bundleIds?: string[] };
type PromotionInput = { title: string; description?: string; discountType: "percentage" | "rupiah";
  discountValue: string; startsOn: string; endsOn: string; published?: boolean; active?: boolean;
  packageIds?: string[] };

export function listCatalogueTypes(client: QueryClient, input: AuthorizedRepositoryInput<undefined>): Promise<RepositoryResult<Record<string, unknown>[]>>;
export function listCatalogue(client: QueryClient, input: AuthorizedRepositoryInput<{ type?: "service" | "action" }>): Promise<RepositoryResult<Record<string, unknown>[]>>;
export function listPublishedPackages(client: QueryClient, input: AuthorizedRepositoryInput<undefined>): Promise<RepositoryResult<Record<string, unknown>[]>>;
export function listBundles(client: QueryClient, input: AuthorizedRepositoryInput<undefined>): Promise<RepositoryResult<Record<string, unknown>[]>>;
export function listPromotions(client: QueryClient, input: AuthorizedRepositoryInput<undefined>): Promise<RepositoryResult<Record<string, unknown>[]>>;
export function createCatalogue(client: QueryClient, input: AuthorizedRepositoryInput<ItemInput>): Promise<RepositoryResult<Record<string, unknown>>>;
export function createBundle(client: QueryClient, input: AuthorizedRepositoryInput<BundleInput>): Promise<RepositoryResult<Record<string, unknown>>>;
export function createPackage(client: QueryClient, input: AuthorizedRepositoryInput<PackageInput>): Promise<RepositoryResult<Record<string, unknown>>>;
export function createPromotion(client: QueryClient, input: AuthorizedRepositoryInput<PromotionInput>): Promise<RepositoryResult<Record<string, unknown>>>;
export function resolvePackage(client: QueryClient, input: AuthorizedRepositoryInput<{ packageId: string; createdAt: string }>): Promise<RepositoryResult<{
  package: Record<string, unknown>; items: Record<string, unknown>[]; promotion: Record<string, unknown> | null;
}>>;
