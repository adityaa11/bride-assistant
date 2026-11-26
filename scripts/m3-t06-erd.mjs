import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { withDatabase } from "../shared/server/database.mjs";

const output = resolve(process.argv[2] ?? ".local-storage/m3-t06-erd");
const tables = ["catalogue_types", "catalogue", "bundle", "bundle_catalogue", "master_package",
  "package_catalogue", "package_bundle", "promotion", "promotion_package", "booking", "booking_status_history"];
const state = await withDatabase(async (db) => {
  const versions = (await db.query("SELECT version FROM public.schema_migrations ORDER BY version")).rows.map((row) => row.version);
  const constraints = (await db.query(`SELECT c.conrelid::regclass::text AS source, c.conname, c.contype,
    CASE WHEN c.contype = 'f' THEN c.confrelid::regclass::text END AS target,
    array(SELECT a.attname FROM unnest(c.conkey) WITH ORDINALITY k(num,ord)
      JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=k.num ORDER BY k.ord) AS columns
    FROM pg_constraint c WHERE c.conrelid = ANY($1::regclass[]) AND c.contype IN ('p','f')
    ORDER BY source, c.contype, c.conname`, [tables.map((table) => `public.${table}`)])).rows;
  return { versions, constraints };
});
assert.deepEqual(state.versions, ["0001", "0002", "0003", "0004", "0005"]);
assert.equal(state.constraints.filter((row) => row.contype === "p").length, 11);
assert.equal(state.constraints.filter((row) => row.contype === "f").length, 14);
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const cards = tables.map((table, index) => {
  const x = 35 + (index % 3) * 520, y = 190 + Math.floor(index / 3) * 250;
  const lines = state.constraints.filter((row) => row.source === table).map((row) => row.contype === "p"
    ? `PK ${String(row.columns).replaceAll(/[{}]/g, "")}` : `FK ${String(row.columns).replaceAll(/[{}]/g, "")} → ${row.target} (1 : 0..N)`);
  return `<g><rect x="${x}" y="${y}" width="480" height="215" rx="12" fill="#fff" stroke="#82536e" stroke-width="2"/><rect x="${x}" y="${y}" width="480" height="45" rx="12" fill="#82536e"/><text x="${x + 16}" y="${y + 30}" fill="#fff" font-size="20" font-weight="bold">public.${table}</text>${lines.map((line, i) => `<text x="${x + 16}" y="${y + 82 + i * 28}" fill="#332b32" font-size="16">${escape(line)}</text>`).join("")}</g>`;
}).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1220" viewBox="0 0 1600 1220" role="img"><title>M3-T06 actual unchanged booking schema ERD</title><rect width="1600" height="1220" fill="#fff9f7"/><g font-family="Arial,sans-serif"><text x="35" y="52" fill="#332b32" font-size="30">M3-T06 · actual unchanged schema</text><text x="35" y="91" fill="#693a53" font-size="20">Before and after T06: same fresh PostgreSQL 18.7 schema · migrations 0001–0005</text><text x="35" y="125" fill="#332b32" font-size="17">11 affected public tables · 11 PKs · 14 FKs · auth.user(id PK) is the external identity target</text><text x="35" y="153" fill="#332b32" font-size="16">Each FK child belongs to one parent; each parent may have 0..N children. booking.promotion_id is nullable (0..1 promotion per booking).</text>${cards}<text x="35" y="1191" fill="#693a53" font-size="17">0004 catalogue/package/promotion · 0005 booking/history · no T06 migration or production seed</text></g></svg>`;
await mkdir(output, { recursive: true });
await writeFile(resolve(output, "actual-erd.svg"), svg);
await writeFile(resolve(output, "schema.json"), JSON.stringify(state, null, 2));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1220 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(resolve(output, "actual-erd.svg")).href);
  await page.screenshot({ path: resolve(output, "actual-erd.png") });
} finally { await browser.close(); }
console.log(`PASS: unchanged ERD, ${state.versions.join(",")}, 11 PK/14 FK`);
