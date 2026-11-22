import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const modules = new Map();
function load(path) {
  const file = resolve(path);
  if (modules.has(file)) return modules.get(file).exports;
  const loadedModule = { exports: {} };
  modules.set(file, loadedModule);
  const compiled = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const require = (name) => name === "server-only" ? {} : name.startsWith("@/") ? load(`${name.slice(2)}.ts`) : nativeRequire(name);
  new Function("require", "module", "exports", compiled)(require, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const { localContentImageStore } = load("shared/server/local-content-image-store.ts");
const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
let sequence = 0;
let failNextPut = false;
const objects = new Map();
const associations = new Map();
const lists = new Map();
for (const collection of ["portfolio", "testimonials", "events"]) lists.set(collection, {});
const alternate = {
  async put({ bytes: input, mediaType, collection }) {
    if (failNextPut) { failNextPut = false; throw new Error("fixture write failure"); }
    const storageKey = (++sequence).toString(16).padStart(32, "0");
    const metadata = { storageKey, sha256: createHash("sha256").update(input).digest("hex"), size: input.length, mediaType };
    objects.set(storageKey, { ...metadata, bytes: input, collection });
    return metadata;
  },
  async read(key) { return objects.get(key) ?? null; },
  async remove(key, collection) { return objects.get(key)?.collection === collection ? objects.delete(key) : false; },
  async cleanupOrphans(collection, referenced) {
    let removed = 0;
    for (const [key, object] of objects) if (object.collection === collection && !referenced.has(key)) { objects.delete(key); removed++; }
    return removed;
  },
  async listAssociations(collection) { return lists.get(collection); },
  async readAssociation(key) { return associations.get(key) ?? null; },
  async writeAssociation(association) { associations.set(association.metadata.storageKey, association); },
  async saveAssociations(collection, records) { lists.set(collection, records); },
  async removeAssociation(key) { associations.delete(key); },
  async cleanupAssociations() { return 0; },
};
const store = localContentImageStore(alternate);
for (const [recordId, collection] of [["portfolio-draft", "portfolio"], ["testimonial-draft", "testimonials"], ["event-draft", "events"]]) {
  const input = { bytes, mediaType: "image/jpeg", altText: `${collection} fixture`, recordId };
  const first = await store.put(input);
  assert.deepEqual(Object.keys(first).sort(), ["altText", "mediaType", "sha256", "size", "storageKey"]);
  assert.deepEqual((await store.read(first.storageKey)).bytes, bytes);
  assert.equal((await store.list())[recordId].storageKey, first.storageKey);
  failNextPut = true;
  await assert.rejects(() => store.replace(first.storageKey, input), /fixture write failure/);
  assert.equal((await store.list())[recordId].storageKey, first.storageKey);
  assert.deepEqual((await store.read(first.storageKey)).bytes, bytes);
  const second = await store.replace(first.storageKey, input);
  assert.ok(second && second.storageKey !== first.storageKey);
  assert.equal(await store.read(first.storageKey), null);
  assert.equal(objects.get(second.storageKey).collection, collection);
  assert.equal(await store.remove(second.storageKey, recordId), true);
  assert.equal(await store.read(second.storageKey), null);
}
assert.equal(objects.size, 0);
assert.equal(associations.size, 0);
console.log("PASS: in-memory DocumentStore substitution preserved UI metadata and lifecycle for three collections");
