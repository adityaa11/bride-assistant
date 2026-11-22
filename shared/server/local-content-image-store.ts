import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { ContentImageMetadata, ContentImageStore, StoredContentImage } from "@/shared/content-image-store";

const keyPattern = /^[a-f0-9]{32}$/;
type StoredRecord = { metadata: ContentImageMetadata; recordId: string };

export function validStorageKey(key: string): boolean { return keyPattern.test(key); }

export function localContentImageStore(): ContentImageStore {
  const root = resolve(/* turbopackIgnore: true */ process.env.M1_T18_TEST_STORAGE_ROOT ?? ".local-storage/m1-t15/content/portfolio");
  const paths = (key: string) => ({ image: join(root, `${key}.bin`), metadata: join(root, `${key}.json`) });
  const manifest = join(root, "records.json");
  const list = async (): Promise<Record<string, ContentImageMetadata>> => {
    try { return JSON.parse(await readFile(/* turbopackIgnore: true */ manifest, "utf8")) as Record<string, ContentImageMetadata>; }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return {}; throw error; }
  };
  const saveList = async (records: Record<string, ContentImageMetadata>) => {
    const temp = join(root, `${randomBytes(16).toString("hex")}.manifest.tmp`);
    try { await writeFile(temp, JSON.stringify(records), { flag: "wx" }); await rename(temp, manifest); }
    finally { await rm(temp, { force: true }); }
  };
  const cleanupOrphans = async () => {
    let names: string[];
    try { names = await readdir(/* turbopackIgnore: true */ root); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return 0; throw error; }
    const owned = new Set(names);
    const referenced = new Set(Object.values(await list()).map((metadata) => metadata.storageKey));
    const orphans = names.filter((name) => {
      const key = name.slice(0, 32);
      if (!validStorageKey(key)) return false;
      if (/^[a-f0-9]{32}\.[a-f0-9]{16}\.tmp$/.test(name)) return true;
      if (name === `${key}.bin`) return !owned.has(`${key}.json`) || !referenced.has(key);
      if (name === `${key}.json`) return !owned.has(`${key}.bin`) || !referenced.has(key);
      return false;
    });
    await Promise.all(orphans.map((name) => rm(join(root, name), { force: true })));
    return orphans.length;
  };
  const readRecord = async (key: string): Promise<StoredRecord | null> => {
    if (!validStorageKey(key)) return null;
    try {
      const record = JSON.parse(await readFile(/* turbopackIgnore: true */ paths(key).metadata, "utf8")) as StoredRecord;
      if (record.metadata.storageKey !== key || !validStorageKey(record.metadata.storageKey)) return null;
      return record;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  };
  const writeObject = async (input: Parameters<ContentImageStore["put"]>[0]) => {
    const key = randomBytes(16).toString("hex");
    const metadata: ContentImageMetadata = { storageKey: key, sha256: createHash("sha256").update(input.bytes).digest("hex"), size: input.bytes.byteLength, mediaType: input.mediaType, altText: input.altText };
    const final = paths(key);
    const temp = join(root, `${key}.${randomBytes(8).toString("hex")}.tmp`);
    await mkdir(root, { recursive: true });
    try {
      await writeFile(temp, input.bytes, { flag: "wx" });
      await rename(temp, final.image);
      await writeFile(final.metadata, JSON.stringify({ metadata, recordId: input.recordId } satisfies StoredRecord), { flag: "wx" });
      return metadata;
    } catch (error) {
      await Promise.all([rm(temp, { force: true }), rm(final.image, { force: true }), rm(final.metadata, { force: true })]);
      throw error;
    }
  };
  return {
    async put(input) {
      const records = await list();
      if (records[input.recordId]) throw new Error("Record already has fixture media");
      const metadata = await writeObject(input);
      try { await saveList({ ...records, [input.recordId]: metadata }); }
      catch (error) { await Promise.all([rm(paths(metadata.storageKey).image, { force: true }), rm(paths(metadata.storageKey).metadata, { force: true })]); throw error; }
      return metadata;
    },
    list,
    cleanupOrphans,
    async read(key): Promise<StoredContentImage | null> {
      const record = await readRecord(key);
      if (!record) return null;
      try { return { ...record, bytes: await readFile(/* turbopackIgnore: true */ paths(key).image) }; }
      catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
    },
    async replace(key, input) {
      const previous = await readRecord(key);
      const records = await list();
      if (!previous || previous.recordId !== input.recordId || records[input.recordId]?.storageKey !== key || !(await this.read(key))) return null;
      const next = await writeObject(input);
      try { await saveList({ ...records, [input.recordId]: next }); }
      catch (error) { await Promise.all([rm(paths(next.storageKey).image, { force: true }), rm(paths(next.storageKey).metadata, { force: true })]); throw error; }
      await Promise.all([rm(paths(key).image, { force: true }), rm(paths(key).metadata, { force: true })]);
      return next;
    },
    async remove(key) {
      const record = await readRecord(key);
      if (!record) return false;
      const records = await list();
      if (records[record.recordId]?.storageKey === key) {
        const next = { ...records };
        delete next[record.recordId];
        await saveList(next);
      }
      await Promise.all([rm(paths(key).image, { force: true }), rm(paths(key).metadata, { force: true })]);
      return true;
    },
  };
}
