import { randomBytes } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
const project = `bride-m3-t02-browser-${randomBytes(5).toString("hex")}`;
const password = randomBytes(24).toString("hex");
const port = 3392;
const output = resolve(process.argv[2] ?? ".local-storage/m3-t02-evidence");
const env = { ...process.env, M2_LOCAL_DB_PASSWORD: password, M2_LOCAL_PG_PORT: "0" };
const docker = (...args) => execFileSync("docker", ["compose", "-p", project, "-f", "compose.m2-local.yaml", ...args],
  { env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
let started = false;
let server;
try {
  docker("up", "-d", "--wait"); started = true;
  const dbPort = Number(docker("port", "postgres", "5432").split(":").at(-1));
  const appEnv = { ...env, DATABASE_MODE: "local", DATABASE_EXPECTED_NAME: "bride_local",
    DATABASE_URL: `postgresql://bride_local:${password}@127.0.0.1:${dbPort}/bride_local`,
    BETTER_AUTH_URL: `http://127.0.0.1:${port}`,
    M1_T08_BASE_URL: `http://127.0.0.1:${port}`, M3_T02_EVIDENCE: output };
  execFileSync(process.execPath, ["scripts/m2-migrate.mjs"], { env: appEnv, encoding: "utf8" });
  await mkdir(output, { recursive: true });
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], { env: appEnv, stdio: "ignore" });
  for (let attempt = 0; attempt < 80; attempt++) {
    try { const response = await fetch(`http://127.0.0.1:${port}/admin/masuk`); if (response.ok) break; } catch { /* waiting */ }
    if (attempt === 79) throw new Error("Next server did not start");
    await new Promise((done) => setTimeout(done, 250));
  }
  execFileSync(process.execPath, ["node_modules/@playwright/test/cli.js", "test", "tests/m3-t02.browser.spec.ts"],
    { env: appEnv, encoding: "utf8", stdio: "inherit" });
  console.log(JSON.stringify({ status: "PASS", output }));
} finally {
  server?.kill();
  if (started) docker("down", "--volumes", "--remove-orphans");
}
