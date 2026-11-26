import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { withDatabase } from "../shared/server/database.mjs";

const output = resolve(process.argv[2] ?? ".local-storage/m3-t07-erd");
const tables = ["catalogue_types", "catalogue", "bundle", "bundle_catalogue", "master_package",
  "package_catalogue", "package_bundle", "promotion", "promotion_package", "booking", "booking_status_history",
  "booking_date_reservation", "admin_closed_date"];
const state = await withDatabase(async (db) => {
  const versions = (await db.query("SELECT version FROM public.schema_migrations ORDER BY version")).rows.map((row) => row.version);
  const constraints = (await db.query(`SELECT c.conrelid::regclass::text AS source, c.conname, c.contype,
    CASE WHEN c.contype = 'f' THEN c.confrelid::regclass::text END AS target,
    array(SELECT a.attname FROM unnest(c.conkey) WITH ORDINALITY k(num,ord)
      JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=k.num ORDER BY k.ord) AS columns
    FROM pg_constraint c WHERE c.conrelid = ANY($1::regclass[]) AND c.contype IN ('p','f','u')
    ORDER BY source, c.contype, c.conname`, [tables.map((table) => `public.${table}`)])).rows;
  return { versions, constraints };
});
assert.deepEqual(state.versions, ["0001", "0002", "0003", "0004", "0005", "0006"]);
assert.equal(state.constraints.filter((row) => row.contype === "p").length, 13);
assert.equal(state.constraints.filter((row) => row.contype === "f").length, 16);
assert(state.constraints.some((row) => row.source === "booking_date_reservation" && row.contype === "u" &&
  String(row.columns).replaceAll(/[{}]/g, "") === "wedding_date"));
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const cards = tables.map((table, index) => {
  const x = 35 + (index % 3) * 520, y = 355 + Math.floor(index / 3) * 250;
  const lines = state.constraints.filter((row) => row.source === table).map((row) => row.contype === "p"
    ? `PK ${String(row.columns).replaceAll(/[{}]/g, "")}` : row.contype === "u"
      ? `UNIQUE ${String(row.columns).replaceAll(/[{}]/g, "")}`
      : `FK ${String(row.columns).replaceAll(/[{}]/g, "")} → ${row.target} (${table === "booking_date_reservation" ? "1 : 0..1" : "1 : 0..N"})`);
  return `<g><rect x="${x}" y="${y}" width="480" height="215" rx="12" fill="#fff" stroke="#82536e" stroke-width="2"/><rect x="${x}" y="${y}" width="480" height="45" rx="12" fill="#82536e"/><text x="${x + 16}" y="${y + 30}" fill="#fff" font-size="20" font-weight="bold">public.${table}</text>${lines.map((line, i) => `<text x="${x + 16}" y="${y + 82 + i * 28}" fill="#332b32" font-size="16">${escape(line)}</text>`).join("")}</g>`;
}).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1700" viewBox="0 0 1600 1700" role="img"><title>M3-T07 actual before and after booking date ERD</title><rect width="1600" height="1700" fill="#fff9f7"/><g font-family="Arial,sans-serif"><text x="35" y="52" fill="#332b32" font-size="30">M3-T07 · actual booking date schema</text><text x="35" y="86" fill="#693a53" font-size="20">Before 0006 · 11 public tables; no reservation or closure table</text><rect x="35" y="105" width="1520" height="155" rx="12" fill="#fff" stroke="#82536e" stroke-width="2"/><text x="55" y="137" font-size="19">public.booking: id PK; customer_id FK → auth.user; package_id FK → master_package; promotion_id nullable FK → promotion</text><text x="55" y="170" font-size="19">public.booking_status_history: id PK; booking_id FK → booking; actor_id FK → auth.user</text><text x="55" y="203" font-size="18">booking 1 : 0..N history; auth.user 1 : 0..N bookings/events; package 1 : 0..N bookings</text><text x="55" y="236" font-size="18">Existing catalogue/package tables and auth.user(id PK) remain unchanged.</text><text x="35" y="296" fill="#693a53" font-size="20">After 0006 · 13 public tables · 13 PKs · 16 FKs · auth.user(id PK) external identity target</text><text x="35" y="327" fill="#332b32" font-size="17">booking 1 : 0..1 reservation; auth.user 1 : 0..N closures; reservation wedding_date UNIQUE; closure date PK.</text>${cards}<text x="35" y="1641" fill="#693a53" font-size="17">Cross-table date exclusion: shared transaction lock. 0004 catalogue · 0005 booking/history · 0006 reservation/closure · no test seed.</text></g></svg>`;
await mkdir(output, { recursive: true });
await writeFile(resolve(output, "actual-erd.svg"), svg);
await writeFile(resolve(output, "schema.json"), JSON.stringify(state, null, 2));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1700 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(resolve(output, "actual-erd.svg")).href);
  await page.screenshot({ path: resolve(output, "actual-erd.png") });
} finally { await browser.close(); }
console.log(`PASS: actual before/after ERD, ${state.versions.join(",")}, 13 PK/16 FK`);
