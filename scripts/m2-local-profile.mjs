import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { readdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const compose = resolve(root, "compose.m2-local.yaml");
const operation = process.argv[2];
const project = operation === "verify" ? `bride-m2-probe-${randomBytes(5).toString("hex")}` : "bride-m2-local";
const probeRoot = resolve(root, ".local-storage/m2-local", project);
const storageRoot = resolve(probeRoot, "content/portfolio");
const password = randomBytes(32).toString("hex");
const env = { ...process.env, M2_LOCAL_DB_PASSWORD: password, M2_LOCAL_PG_PORT: operation === "verify" ? "0" : "55432" };

function docker(...args) {
  return execFileSync("docker", ["compose", "-p", project, "-f", compose, ...args], { cwd: root, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

const nativeRequire = createRequire(import.meta.url);
const modules = new Map();
function load(path) {
  const file = resolve(root, path);
  if (modules.has(file)) return modules.get(file).exports;
  const loadedModule = { exports: {} };
  modules.set(file, loadedModule);
  const compiled = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const require = (name) => name === "server-only" ? {} : name.startsWith("@/") ? load(`${name.slice(2)}.ts`) : nativeRequire(name);
  new Function("require", "module", "exports", compiled)(require, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

async function probeLocalStore() {
  assert.equal(existsSync(storageRoot), false, "local store must start empty");
  process.env.M1_T18_TEST_STORAGE_ROOT = storageRoot;
  const { localDocumentStore } = load("shared/server/local-document-store.ts");
  const store = localDocumentStore();
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  const saved = await store.put({ bytes, mediaType: "image/jpeg", collection: "portfolio" });
  assert.deepEqual(Array.from((await store.read(saved.storageKey))?.bytes ?? []), Array.from(bytes));
  assert.equal(await store.remove(saved.storageKey, "portfolio"), true);
  assert.equal(await store.read(saved.storageKey), null);
  assert.deepEqual(await readdir(storageRoot), []);
  await rm(probeRoot, { recursive: true, force: true });
}

if (operation !== "verify") throw new Error("Usage: node scripts/m2-local-profile.mjs verify");
try {
  docker("up", "-d", "--wait");
  const version = docker("exec", "-T", "postgres", "psql", "-U", "bride_local", "-d", "bride_local", "-Atc", "SHOW server_version");
  assert.match(version, /^18\.7\b/);
  const tables = docker("exec", "-T", "postgres", "psql", "-U", "bride_local", "-d", "bride_local", "-Atc", "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'");
  assert.equal(tables, "0");
  await probeLocalStore();
  console.log("PASS: fresh PostgreSQL 18.7, zero public tables, local DocumentStore put/read/remove, and no source-controlled bytes");
} finally {
  docker("down", "--volumes", "--remove-orphans");
  await rm(probeRoot, { recursive: true, force: true });
}
