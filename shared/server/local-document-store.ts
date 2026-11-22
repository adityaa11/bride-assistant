import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type { ContentImageMetadata } from "@/shared/content-image-store";
import type { DocumentCollection, FixtureDocumentStore, StoredDocument } from "@/shared/document-store";

const collections = ["portfolio", "testimonials", "events"] as const;
export const validStorageKey = (key: string) => /^[a-f0-9]{32}$/.test(key);
const portfolioRoot = () => resolve(/* turbopackIgnore: true */ process.env.M1_T18_TEST_STORAGE_ROOT ?? ".local-storage/m1-t15/content/portfolio");
export const collectionRoot = (collection: DocumentCollection) => collection === "portfolio" ? portfolioRoot() : join(dirname(portfolioRoot()), collection);

export function localDocumentStore(): FixtureDocumentStore<ContentImageMetadata> {
  const manifest = (collection: DocumentCollection) => join(collectionRoot(collection), "records.json");
  const associationPath = (collection: DocumentCollection, key: string) => join(collectionRoot(collection), `${key}.json`);
  const missing = (error: unknown) => (error as NodeJS.ErrnoException).code === "ENOENT";
  return {
    async put(input) {
      const storageKey = randomBytes(16).toString("hex");
      const root = collectionRoot(input.collection);
      const temporary = join(root, `${storageKey}.${randomBytes(8).toString("hex")}.tmp`);
      const destination = join(root, `${storageKey}.bin`);
      await mkdir(root, { recursive: true });
      try {
        await writeFile(temporary, input.bytes, { flag: "wx" });
        await rename(temporary, destination);
      } catch (error) {
        await Promise.all([rm(temporary, { force: true }), rm(destination, { force: true })]);
        throw error;
      }
      return { storageKey, sha256: createHash("sha256").update(input.bytes).digest("hex"), size: input.bytes.byteLength, mediaType: input.mediaType };
    },
    async read(storageKey): Promise<StoredDocument | null> {
      if (!validStorageKey(storageKey)) return null;
      for (const collection of collections) {
        try {
          const bytes = await readFile(/* turbopackIgnore: true */ join(collectionRoot(collection), `${storageKey}.bin`));
          const mediaType = bytes[0] === 0xff && bytes[1] === 0xd8 ? "image/jpeg" : bytes[0] === 0x89 && bytes[1] === 0x50 ? "image/png" : "image/webp";
          return { storageKey, bytes, collection, sha256: createHash("sha256").update(bytes).digest("hex"), size: bytes.length, mediaType };
        } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
      }
      return null;
    },
    async remove(storageKey, collection) {
      if (!validStorageKey(storageKey)) return false;
      try { await rm(join(collectionRoot(collection), `${storageKey}.bin`)); return true; }
      catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error; }
    },
    async cleanupOrphans(collection, referenced) {
      const root = collectionRoot(collection);
      let names: string[];
      try { names = await readdir(/* turbopackIgnore: true */ root); }
      catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return 0; throw error; }
      const orphans = names.filter((name) => /^[a-f0-9]{32}\.bin$/.test(name) && !referenced.has(name.slice(0, 32)) || /^[a-f0-9]{32}\.[a-f0-9]{16}\.tmp$/.test(name));
      await Promise.all(orphans.map((name) => rm(join(root, name), { force: true })));
      return orphans.length;
    },
    async listAssociations(collection) {
      try { return JSON.parse(await readFile(/* turbopackIgnore: true */ manifest(collection), "utf8")) as Record<string, ContentImageMetadata>; }
      catch (error) { if (missing(error)) return {}; throw error; }
    },
    async readAssociation(storageKey) {
      if (!validStorageKey(storageKey)) return null;
      for (const collection of collections) {
        try {
          const { recordId, metadata } = JSON.parse(await readFile(/* turbopackIgnore: true */ associationPath(collection, storageKey), "utf8")) as { recordId: string; metadata: ContentImageMetadata };
          if (metadata.storageKey === storageKey) return { collection, recordId, metadata };
        } catch (error) { if (!missing(error)) throw error; }
      }
      return null;
    },
    async writeAssociation(association) {
      await writeFile(associationPath(association.collection, association.metadata.storageKey), JSON.stringify({ recordId: association.recordId, metadata: association.metadata }), { flag: "wx" });
    },
    async saveAssociations(collection, records) {
      const root = collectionRoot(collection);
      const temp = join(root, `${randomBytes(16).toString("hex")}.manifest.tmp`);
      try { await writeFile(temp, JSON.stringify(records), { flag: "wx" }); await rename(temp, manifest(collection)); }
      finally { await rm(temp, { force: true }); }
    },
    async removeAssociation(storageKey, collection) {
      await rm(associationPath(collection, storageKey), { force: true });
    },
    async cleanupAssociations(collection, referenced) {
      const root = collectionRoot(collection);
      let names: string[];
      try { names = await readdir(/* turbopackIgnore: true */ root); }
      catch (error) { if (missing(error)) return 0; throw error; }
      const stale = names.filter((name) => /^[a-f0-9]{32}\.json$/.test(name) && !referenced.has(name.slice(0, 32)));
      await Promise.all(stale.map((name) => rm(join(root, name), { force: true })));
      return stale.length;
    },
  };
}
