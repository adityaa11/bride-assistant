export type DocumentCollection = "portfolio" | "testimonials" | "events";
export type DocumentMediaType = "image/jpeg" | "image/png" | "image/webp";

export type StoredDocument = Readonly<{
  storageKey: string;
  sha256: string;
  size: number;
  mediaType: DocumentMediaType;
  bytes: Uint8Array;
  collection: DocumentCollection;
}>;

// Bytes cross this boundary for every fixture upload. Record association belongs above it.
export interface DocumentStore {
  put(input: { bytes: Uint8Array; mediaType: DocumentMediaType; collection: DocumentCollection }): Promise<Omit<StoredDocument, "bytes" | "collection">>;
  read(storageKey: string): Promise<StoredDocument | null>;
  remove(storageKey: string, collection: DocumentCollection): Promise<boolean>;
  cleanupOrphans(collection: DocumentCollection, referenced: ReadonlySet<string>): Promise<number>;
}

export type FixtureAssociation<T> = Readonly<{ recordId: string; metadata: T; collection: DocumentCollection }>;

// Fixture-only association persistence; the content facade retains lifecycle decisions.
export interface FixtureDocumentStore<T> extends DocumentStore {
  listAssociations(collection: DocumentCollection): Promise<Record<string, T>>;
  readAssociation(storageKey: string): Promise<FixtureAssociation<T> | null>;
  writeAssociation(association: FixtureAssociation<T>): Promise<void>;
  saveAssociations(collection: DocumentCollection, records: Record<string, T>): Promise<void>;
  removeAssociation(storageKey: string, collection: DocumentCollection): Promise<void>;
  cleanupAssociations(collection: DocumentCollection, referenced: ReadonlySet<string>): Promise<number>;
}
