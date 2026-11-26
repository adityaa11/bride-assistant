import type { AuthorizedRepositoryInput, RepositoryResult } from "./repository-contracts";

export type CatalogueEntity = "item" | "bundle" | "package" | "promotion";
export type CatalogueCommand = {
  entity: CatalogueEntity;
  operation: "create" | "update" | "retire";
  id?: string;
  requestKey?: string;
  values?: Record<string, unknown>;
};
type QueryClient = { query(sql: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }> };
export function readAdminCatalogue(client: QueryClient, decision: AuthorizedRepositoryInput<undefined>): Promise<RepositoryResult<{
  types: Record<string, unknown>[];
  items: Record<string, unknown>[];
  bundles: Record<string, unknown>[];
  packages: Record<string, unknown>[];
  promotions: Record<string, unknown>[];
}>>;
export function executeAdminCatalogueCommand(client: QueryClient, decision: AuthorizedRepositoryInput<CatalogueCommand>): Promise<RepositoryResult<Record<string, unknown>>>;
