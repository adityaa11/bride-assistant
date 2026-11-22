import "server-only";
import type { ContentImageMetadata, ContentImageStore, StoredContentImage } from "@/shared/content-image-store";
import type { DocumentCollection, FixtureDocumentStore } from "@/shared/document-store";
import { localDocumentStore } from "@/shared/server/local-document-store";
import { collectionForRecord, contentCollections } from "@/shared/server/content-media-request";

// This facade decides record lifecycle. The injected DocumentStore owns all local bytes and metadata files.
export function localContentImageStore(documents: FixtureDocumentStore<ContentImageMetadata> = localDocumentStore()): ContentImageStore {
  const readRecord = async (key: string) => {
    const association = await documents.readAssociation(key);
    return association && collectionForRecord(association.recordId) === association.collection ? association : null;
  };
  const put = async (input: Parameters<ContentImageStore["put"]>[0], collection: DocumentCollection) => {
    const stored = await documents.put({ bytes: input.bytes, mediaType: input.mediaType, collection });
    const metadata: ContentImageMetadata = { ...stored, altText: input.altText };
    try { await documents.writeAssociation({ collection, recordId: input.recordId, metadata }); }
    catch (error) { await documents.remove(metadata.storageKey, collection); throw error; }
    return metadata;
  };
  const discard = async (collection: DocumentCollection, key: string) => {
    await documents.remove(key, collection);
    await documents.removeAssociation(key, collection);
  };
  return {
    async list() {
      const results = await Promise.all(contentCollections.map((collection) => documents.listAssociations(collection)));
      return Object.assign({}, ...results) as Record<string, ContentImageMetadata>;
    },
    async put(input) {
      const collection = collectionForRecord(input.recordId);
      if (!collection) throw new Error("Invalid record");
      const records = await documents.listAssociations(collection);
      if (records[input.recordId]) throw new Error("Record already has fixture media");
      const metadata = await put(input, collection);
      try { await documents.saveAssociations(collection, { ...records, [input.recordId]: metadata }); }
      catch (error) { await discard(collection, metadata.storageKey); throw error; }
      return metadata;
    },
    async read(key): Promise<StoredContentImage | null> {
      const record = await readRecord(key);
      if (!record) return null;
      const document = await documents.read(key);
      if (!document || document.collection !== record.collection || document.sha256 !== record.metadata.sha256 || document.size !== record.metadata.size) return null;
      return { metadata: record.metadata, recordId: record.recordId, bytes: document.bytes };
    },
    async replace(key, input) {
      const collection = collectionForRecord(input.recordId);
      const previous = await readRecord(key);
      if (!collection || !previous || previous.collection !== collection || previous.recordId !== input.recordId) return null;
      const records = await documents.listAssociations(collection);
      if (records[input.recordId]?.storageKey !== key || !(await this.read(key))) return null;
      const next = await put(input, collection);
      try { await documents.saveAssociations(collection, { ...records, [input.recordId]: next }); }
      catch (error) { await discard(collection, next.storageKey); throw error; }
      await discard(collection, key);
      return next;
    },
    async remove(key, recordId) {
      const collection = collectionForRecord(recordId);
      const record = await readRecord(key);
      if (!collection || !record || record.collection !== collection || record.recordId !== recordId) return false;
      const records = await documents.listAssociations(collection);
      if (records[recordId]?.storageKey !== key) return false;
      const next = { ...records };
      delete next[recordId];
      await documents.saveAssociations(collection, next);
      await discard(collection, key);
      return true;
    },
    async cleanupOrphans() {
      let removed = 0;
      for (const collection of contentCollections) {
        const referenced = new Set(Object.values(await documents.listAssociations(collection)).map((metadata) => metadata.storageKey));
        removed += await documents.cleanupOrphans(collection, referenced);
        removed += await documents.cleanupAssociations(collection, referenced);
      }
      return removed;
    },
  };
}
