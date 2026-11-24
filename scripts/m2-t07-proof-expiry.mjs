import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const runRoot = resolve(root, ".local-storage/m2-t07", randomBytes(8).toString("hex"));
const nativeRequire = createRequire(import.meta.url);
const modules = new Map();
function load(path) {
  const file = resolve(root, path);
  if (modules.has(file)) return modules.get(file).exports;
  const loadedModule = { exports: {} };
  modules.set(file, loadedModule);
  const code = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const require = (name) => name === "server-only" ? {} : name.startsWith("@/") ? load(`${name.slice(2)}.ts`) : nativeRequire(name);
  new Function("require", "module", "exports", code)(require, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
const policy = load("shared/proof-policy.ts");
const emptyLedger = Object.fromEntries(policy.decisionIds.map((id) => [id, null]));
const profiles = JSON.parse(readFileSync(resolve(root, "config/proof-retention.profiles.json"), "utf8"));
assert.equal(profiles.schemaVersion, policy.proofPolicyVersion);
const localProfile = { ...profiles.development, environment: "test" };
const durationProfile = profiles.test;
const productionProfile = profiles.production;
const testIdentity = policy.identityFromDeployment("test");
const prodIdentity = policy.identityFromDeployment("production");
const observations = { version: policy.proofPolicyVersion, profileDenials: [], activation: {}, scenarios: [], emptyState: {} };
function validated(profile) {
  const result = policy.validateProfile(testIdentity, profile, emptyLedger);
  assert.equal(result.ok, true, JSON.stringify(result));
  return result.runtime;
}
function denial(label, identity, profile, ledger = emptyLedger) {
  const result = policy.validateProfile(identity, profile, ledger);
  assert.equal(result.ok, false, label);
  observations.profileDenials.push({ label, reasons: result.reasons });
}
function inspectProfiles() {
  validated(localProfile); validated(durationProfile);
  const devValidation = policy.validateProfile(policy.identityFromDeployment("development"), profiles.development, emptyLedger);
  assert.equal(devValidation.ok, true);
  denial("unknown identity", { environment: "test" }, localProfile);
  denial("environment override", testIdentity, { ...localProfile, environment: "production" });
  denial("short production duration", prodIdentity, { ...productionProfile, duration: { minutes: 5 } });
  denial("controlled production clock", prodIdentity, { ...productionProfile, clock: "controlled" });
  denial("disposable production adapter", prodIdentity, { ...productionProfile, adapter: "local-disposable" });
  for (const [field, value] of [["database", "neon-production"], ["objectStore", "neon-production"], ["credentials", "production"], ["data", "real"]]) denial(`test rejects ${field}`, testIdentity, { ...localProfile, [field]: value });
  denial("unknown environment", { environment: "unknown" }, localProfile);
  const approved = Object.fromEntries(policy.decisionIds.map((id) => [id, { value: "synthetic", owner: "synthetic", date: "2026-01-01", evidence: "synthetic" }]));
  for (const missing of policy.decisionIds) denial(`missing ${missing}`, prodIdentity, productionProfile, { ...approved, [missing]: null });
  const prodValidation = policy.validateProfile(prodIdentity, productionProfile, approved);
  assert.equal(prodValidation.ok, true);
  const state = (policyApproved, operationalReady, activationAuthorized, validation) => policy.readiness({ technicalReady: true, policyApproved, operationalReady, activationAuthorized, validation });
  observations.activation = { pending: state(false, false, false, policy.validateProfile(prodIdentity, productionProfile, emptyLedger)), approvedWithoutOperations: state(true, false, true, prodValidation), operationsWithoutRelease: state(true, true, false, prodValidation), completeSynthetic: state(true, true, true, prodValidation) };
  assert.equal(observations.activation.pending.activationAuthorized, false);
  assert.equal(observations.activation.approvedWithoutOperations.activationAuthorized, false);
  assert.equal(observations.activation.operationsWithoutRelease.activationAuthorized, false);
}
async function scenario(name, runtime, proofs, checkpoints) {
  const scenarioRoot = join(runRoot, name);
  process.env.M1_T18_TEST_STORAGE_ROOT = join(scenarioRoot, "content", "portfolio");
  const { localDocumentStore } = load("shared/server/local-document-store.ts");
  const store = localDocumentStore();
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  const metadata = [], audit = [], history = [], deletions = [];
  for (const proof of proofs) {
    const saved = await store.put({ bytes, mediaType: "image/jpeg", collection: "payment-proofs" });
    metadata.push({ ...proof, storageKey: saved.storageKey });
    audit.push({ proofId: proof.id, event: "uploaded" });
    if (proof.finalReviewedAt) audit.push({ proofId: proof.id, event: "reviewed" });
    history.push({ bookingId: proof.id, status: "Menunggu Pembayaran" });
  }
  const ports = { bytes: store, async list() { return [...metadata]; }, async removeMetadataAndAudit(id) { metadata.splice(metadata.findIndex((entry) => entry.id === id), 1); for (let i = audit.length - 1; i >= 0; i--) if (audit[i].proofId === id) audit.splice(i, 1); }, async recordDeletion(id) { deletions.push(id); } };
  const snapshots = [];
  for (const [label, at] of [["before", null], ...checkpoints]) {
    const deleted = at ? await policy.runProofLifecycle(runtime, ports, new Date(at)) : [];
    const diskBytes = (await readdir(join(scenarioRoot, "content", "payment-proofs"))).filter((file) => file.endsWith(".bin")).length;
    assert.equal(diskBytes, metadata.length);
    assert.equal(history.length, proofs.length);
    for (const proof of metadata) assert.ok(await store.read(proof.storageKey));
    snapshots.push({ label, deleted, bytes: diskBytes, metadata: metadata.length, audit: audit.length, history: history.length, deletionRecords: deletions.length });
  }
  observations.scenarios.push({ name, snapshots });
  return snapshots;
}
async function main() {
  assert.equal(existsSync(runRoot), false);
  await mkdir(runRoot, { recursive: true });
  try {
    inspectProfiles();
    const start = "2026-01-01T00:00:00.000Z";
    const five = validated(localProfile);
    let invalidPortCalls = 0;
    await assert.rejects(policy.runProofLifecycle({ version: policy.proofPolicyVersion, duration: { minutes: 5 }, production: true }, { async list() { invalidPortCalls++; return []; } }, new Date(start)), /UNVALIDATED_PROOF_POLICY/);
    assert.equal(invalidPortCalls, 0);
    const empty = await policy.runProofLifecycle(five, { async list() { return []; } }, new Date(start));
    assert.deepEqual(empty, []);
    observations.emptyState = { initialRecords: 0, deleted: 0, byteRootExists: existsSync(join(runRoot, "empty", "content")) };
    const short = await scenario("five-minute-reviewed-and-upload", five, [
      { id: "reviewed", uploadedAt: start, finalReviewedAt: "2026-01-01T00:01:00.000Z", classification: "operational", activeHold: false, scan: "clean" },
      { id: "unreviewed", uploadedAt: start, classification: "operational", activeHold: false, scan: "clean" },
    ], [["pre-expiry", "2026-01-01T00:04:59.999Z"], ["upload-expiry", "2026-01-01T00:05:00.000Z"], ["review-expiry", "2026-01-01T00:06:00.000Z"], ["idempotent", "2026-01-01T00:07:00.000Z"]]);
    assert.deepEqual(short.map((s) => s.bytes), [2, 2, 1, 0, 0]);
    assert.deepEqual(short.map((s) => s.audit), [3, 3, 2, 0, 0]);
    const calendar = await scenario("authoritative-calendar-and-statutory", validated(durationProfile), [
      { id: "reviewed", uploadedAt: start, finalReviewedAt: "2026-01-31T00:00:00.000Z", classification: "operational", activeHold: false, scan: "clean" },
      { id: "unreviewed", uploadedAt: "2026-01-31T00:00:00.000Z", classification: "operational", activeHold: false, scan: "clean" },
      { id: "statutory", uploadedAt: start, statutoryStartAt: "2026-01-31T00:00:00.000Z", classification: "statutory", activeHold: false, scan: "clean" },
      { id: "unknown", uploadedAt: start, classification: "unknown", activeHold: false, scan: "clean" },
    ], [["before-eight-month-boundary", "2026-09-29T23:59:59.999Z"], ["eight-month-boundary", "2026-09-30T00:00:00.000Z"], ["before-ten-year-boundary", "2036-01-30T23:59:59.999Z"], ["ten-year-boundary", "2036-01-31T00:00:00.000Z"]]);
    assert.deepEqual(calendar.map((s) => s.bytes), [4, 4, 2, 2, 1]);
    const held = await scenario("hold-and-scanner-fail-closed", five, [
      { id: "held", uploadedAt: start, classification: "operational", activeHold: true, scan: "clean" },
      ...["infected", "unavailable", "timeout"].map((scan) => ({ id: scan, uploadedAt: start, classification: "operational", activeHold: false, scan })),
      { id: "eligible", uploadedAt: start, classification: "operational", activeHold: false, scan: "clean" },
    ], [["after-expiry", "2026-01-01T00:05:00.000Z"]]);
    assert.deepEqual(held.map((s) => s.bytes), [5, 4]);
    for (const outcome of ["infected", "unavailable", "timeout"]) assert.equal(policy.scannerDisposition(outcome), "quarantined");
    console.log(JSON.stringify({ result: "PASS", ...observations }, null, 2));
  } finally {
    await rm(runRoot, { recursive: true, force: true });
    delete process.env.M1_T18_TEST_STORAGE_ROOT;
    assert.equal(existsSync(runRoot), false);
  }
}
await main();
