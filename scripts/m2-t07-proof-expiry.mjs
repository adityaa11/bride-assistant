import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// This is a disposable policy rehearsal, not a production retention worker.
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const runRoot = resolve(root, ".local-storage/m2-t07", randomBytes(8).toString("hex"));
const byteRoot = join(runRoot, "content", "portfolio");
const metadataPath = join(runRoot, "proof-metadata.json");
const auditPath = join(runRoot, "proof-audit.json");
const historyPath = join(runRoot, "booking-history.json");
const nativeRequire = createRequire(import.meta.url);
const modules = new Map();
const config = JSON.parse(readFileSync(resolve(root, "config/proof-retention.development.json"), "utf8"));
assert.deepEqual(config, {
  mode: "disposable-rehearsal", expiryMinutes: 5,
  originWhenReviewed: "final-review", originWhenUnreviewed: "upload",
});
const expiryDuration = config.expiryMinutes * 60 * 1000;

function load(path) {
  const file = resolve(root, path);
  if (modules.has(file)) return modules.get(file).exports;
  const loadedModule = { exports: {} };
  modules.set(file, loadedModule);
  const compiled = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const require = (name) => name === "server-only" ? {} : name.startsWith("@/") ? load(`${name.slice(2)}.ts`) : nativeRequire(name);
  new Function("require", "module", "exports", compiled)(require, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path, value) {
  await writeFile(path, JSON.stringify(value));
}

async function expire({ store, now }) {
  const metadata = await readJson(metadataPath);
  const audits = await readJson(auditPath);
  const expired = metadata.filter((proof) => now >= proof.originAt + expiryDuration);
  for (const proof of expired) {
    assert.equal(await store.remove(proof.storageKey, "payment-proofs"), true);
  }
  await writeJson(metadataPath, metadata.filter((proof) => !expired.includes(proof)));
  await writeJson(auditPath, audits.filter((event) => !expired.some((proof) => proof.proofId === event.proofId)));
  return expired.length;
}

async function main() {
  assert.equal(existsSync(runRoot), false, "disposable store must start empty");
  process.env.M1_T18_TEST_STORAGE_ROOT = byteRoot;
  const { localDocumentStore } = load("shared/server/local-document-store.ts");
  const store = localDocumentStore();
  const start = Date.parse("2026-01-01T00:00:00.000Z");
  const fixtureBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  const cases = [
    { proofId: "reviewed", origin: config.originWhenReviewed, originAt: start + 60_000 },
    { proofId: "unreviewed", origin: config.originWhenUnreviewed, originAt: start },
  ];
  const metadata = [];
  const audits = [];
  const history = [];
  await mkdir(runRoot, { recursive: true });
  for (const item of cases) {
    const saved = await store.put({ bytes: fixtureBytes, mediaType: "image/jpeg", collection: "payment-proofs" });
    metadata.push({ proofId: item.proofId, storageKey: saved.storageKey, origin: item.origin, originAt: item.originAt });
    audits.push({ proofId: item.proofId, event: "uploaded" });
    if (item.origin === config.originWhenReviewed) audits.push({ proofId: item.proofId, event: "reviewed" });
    history.push({ bookingId: item.proofId, status: "Menunggu Pembayaran" });
    assert.deepEqual(Array.from((await store.read(saved.storageKey))?.bytes ?? []), Array.from(fixtureBytes));
  }
  await Promise.all([writeJson(metadataPath, metadata), writeJson(auditPath, audits), writeJson(historyPath, history)]);
  assert.equal((await readdir(join(runRoot, "content", "payment-proofs"))).filter((name) => name.endsWith(".bin")).length, 2);
  assert.equal((await readJson(metadataPath)).length, 2);
  assert.equal((await readJson(auditPath)).length, 3);
  assert.equal((await readJson(historyPath)).length, 2);

  assert.equal(await expire({ store, now: start + expiryDuration - 1 }), 0);
  assert.equal((await readJson(metadataPath)).length, 2);
  assert.equal(await expire({ store, now: start + expiryDuration }), 1);
  assert.equal(await store.read(metadata[1].storageKey), null);
  assert.deepEqual((await readJson(metadataPath)).map((entry) => entry.proofId), ["reviewed"]);
  assert.deepEqual((await readJson(auditPath)).map((entry) => entry.proofId), ["reviewed", "reviewed"]);
  assert.equal((await readJson(historyPath)).length, 2);

  assert.equal(await expire({ store, now: start + 60_000 + expiryDuration }), 1);
  assert.equal(await store.read(metadata[0].storageKey), null);
  assert.deepEqual(await readJson(metadataPath), []);
  assert.deepEqual(await readJson(auditPath), []);
  assert.deepEqual(await readJson(historyPath), history);
  assert.deepEqual((await readdir(join(runRoot, "content", "payment-proofs"))).filter((name) => name.endsWith(".bin")), []);
  assert.equal(await expire({ store, now: start + 60_000 + expiryDuration }), 0, "expiry must be idempotent");
  return {
    result: "PASS", rehearsal: "five-minute-clock-controlled", cases: ["upload-origin", "final-review-origin"],
    before: { bytes: 2, metadata: 2, proofAudit: 3, bookingHistory: 2 },
    after: { bytes: 0, metadata: 0, proofAudit: 0, bookingHistory: 2 },
    repeatedExpiry: "no-op",
  };
}

let result;
try {
  result = await main();
} finally {
  await rm(runRoot, { recursive: true, force: true });
}
assert.equal(existsSync(runRoot), false, "disposable root must be removed");
console.log(JSON.stringify({ ...result, disposableStoreRemoved: true }));
