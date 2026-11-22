export type ContentImageMetadata = Readonly<{
  storageKey: string;
  sha256: string;
  size: number;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  altText: string;
}>;

export type StoredContentImage = Readonly<{
  metadata: ContentImageMetadata;
  bytes: Uint8Array;
  recordId: string;
}>;

export interface ContentImageStore {
  put(input: { bytes: Uint8Array; mediaType: ContentImageMetadata["mediaType"]; altText: string; recordId: string }): Promise<ContentImageMetadata>;
  read(storageKey: string): Promise<StoredContentImage | null>;
  replace(storageKey: string, input: { bytes: Uint8Array; mediaType: ContentImageMetadata["mediaType"]; altText: string; recordId: string }): Promise<ContentImageMetadata | null>;
  remove(storageKey: string): Promise<boolean>;
  cleanupOrphans(): Promise<number>;
  list(): Promise<Record<string, ContentImageMetadata>>;
}
