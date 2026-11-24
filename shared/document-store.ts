export const documentCollections = ["portfolio", "testimonials", "events", "payment-proofs"] as const;
export type DocumentCollection = typeof documentCollections[number];
export type DocumentMediaType = "image/jpeg" | "image/png" | "image/webp" | "application/pdf";

export type StoredDocument = Readonly<{
  storageKey: string;
  sha256: string;
  size: number;
  mediaType: DocumentMediaType;
  bytes: Uint8Array;
  collection: DocumentCollection;
}>;

// Every application upload crosses this byte boundary. Authorization, file validation,
// record association, publication, and cleanup policy belong to owning facades.
export interface DocumentStore {
  put<M extends DocumentMediaType>(input: { bytes: Uint8Array; mediaType: M; collection: DocumentCollection }): Promise<Omit<StoredDocument, "bytes" | "collection" | "mediaType"> & { mediaType: M }>;
  read(storageKey: string): Promise<StoredDocument | null>;
}

// The existing local fixture lifecycle has its own cleanup operations. They are
// deliberately outside the production-neutral two-operation byte contract.
export interface FixtureByteLifecycle {
  remove(storageKey: string, collection: DocumentCollection): Promise<boolean>;
  cleanupOrphans(collection: DocumentCollection, referenced: ReadonlySet<string>): Promise<number>;
}

export type FixtureAssociation<T> = Readonly<{ recordId: string; metadata: T; collection: DocumentCollection }>;

// Fixture-only association persistence; the content facade retains lifecycle decisions.
export interface FixtureDocumentStore<T> extends DocumentStore, FixtureByteLifecycle {
  listAssociations(collection: DocumentCollection): Promise<Record<string, T>>;
  readAssociation(storageKey: string): Promise<FixtureAssociation<T> | null>;
  writeAssociation(association: FixtureAssociation<T>): Promise<void>;
  saveAssociations(collection: DocumentCollection, records: Record<string, T>): Promise<void>;
  removeAssociation(storageKey: string, collection: DocumentCollection): Promise<void>;
  cleanupAssociations(collection: DocumentCollection, referenced: ReadonlySet<string>): Promise<number>;
}
