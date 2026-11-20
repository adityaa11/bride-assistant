import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { resolve } from "node:path";

const root = process.cwd();
const sourceFiles = [
  "app/(public)/page.tsx",
  "app/(customer)/customer/page.tsx",
  "app/(admin)/admin/page.tsx",
  "app/(public)/fixtures/empty/page.tsx",
  "app/(public)/fixtures/error/page.tsx",
  "shared/public-discovery.tsx",
  "shared/review-route.tsx",
  "shared/scenarios/contracts.ts",
  "shared/scenarios/catalogue.ts",
  "shared/scenarios/adapter.ts",
];

test("public, customer, and admin route groups compose through the shared seam", async () => {
  const pages = await Promise.all(sourceFiles.slice(0, 3).map((file) => readFile(resolve(root, file), "utf8")));

  for (const page of pages.slice(1)) {
    assert.match(page, /@\/shared\/review-route/);
    assert.match(page, /<ReviewRoute scenarioId=/);
  }
  assert.match(pages[0], /@\/shared\/public-discovery/);
  assert.match(pages[0], /<PublicDiscovery scenarioId=/);
});

test("public review states are named routes with declared scenario IDs", async () => {
  const [emptyRoute, errorRoute] = await Promise.all([
    readFile(resolve(root, "app/(public)/fixtures/empty/page.tsx"), "utf8"),
    readFile(resolve(root, "app/(public)/fixtures/error/page.tsx"), "utf8"),
  ]);

  assert.match(emptyRoute, /<PublicDiscovery scenarioId="public\.catalogue-empty"/);
  assert.match(errorRoute, /<PublicDiscovery scenarioId="public\.catalogue-error"/);
});

test("feature routes reach declared scenarios only through the versioned adapter seam", async () => {
  const [publicRoute, customerRoute, adminRoute, publicDiscovery, reviewRoute, adapter, catalogue] = await Promise.all([
    readFile(resolve(root, "app/(public)/page.tsx"), "utf8"),
    readFile(resolve(root, "app/(customer)/customer/page.tsx"), "utf8"),
    readFile(resolve(root, "app/(admin)/admin/page.tsx"), "utf8"),
    readFile(resolve(root, "shared/public-discovery.tsx"), "utf8"),
    readFile(resolve(root, "shared/review-route.tsx"), "utf8"),
    readFile(resolve(root, "shared/scenarios/adapter.ts"), "utf8"),
    readFile(resolve(root, "shared/scenarios/catalogue.ts"), "utf8"),
  ]);

  for (const featureSource of [publicRoute, customerRoute, adminRoute]) {
    assert.doesNotMatch(featureSource, /shared\/scenarios\/(?:catalogue|contracts|adapter)/);
  }
  assert.match(publicDiscovery, /getScenario/);
  assert.doesNotMatch(publicDiscovery, /publication|draft/);
  assert.match(reviewRoute, /getScenario/);
  assert.match(adapter, /scenarioCatalogue/);
  assert.match(catalogue, /satisfies Record<string/);
});

test("scenario catalogue covers review states and protects lifecycle, publication, and provenance boundaries", async () => {
  const [contracts, catalogue, adapter] = await Promise.all([
    readFile(resolve(root, "shared/scenarios/contracts.ts"), "utf8"),
    readFile(resolve(root, "shared/scenarios/catalogue.ts"), "utf8"),
    readFile(resolve(root, "shared/scenarios/adapter.ts"), "utf8"),
  ]);

  for (const state of ["loading", "empty", "error", "success", "unavailable"]) {
    assert.match(catalogue, new RegExp(`kind: \\\"${state}\\\"`));
  }
  for (const emptyScenario of ["public.catalogue-empty", "public.published-content-empty", "customer.bookings-empty", "admin.catalogue-empty"]) {
    assert.match(catalogue, new RegExp(emptyScenario.replace(".", "\\.")));
  }
  for (const status of ["Menunggu Konfirmasi", "Menunggu Pembayaran", "Booking Berhasil", "Menunggu Pembatalan Booking", "Dibatalkan", "Menunggu Reschedule Booking"]) {
    assert.match(contracts, new RegExp(`\\\"${status}\\\"`));
  }
  assert.match(catalogue, /publication: "draft"/);
  assert.match(catalogue, /publishedContent/);
  assert.match(catalogue, /public\.discovery-success/);
  assert.match(catalogue, /packages/);
  assert.match(catalogue, /promotions/);
  assert.match(catalogue, /customer\.whatsapp-unavailable/);
  assert.match(catalogue, /customer\.command-result/);
  assert.doesNotMatch(contracts, /Confirmed|On Hold/);
  assert.match(adapter, /Non-authoritative fixture/);
  assert.match(adapter, /requested review scenario was not found/);
});

test("review-build source has no prototype execution or unsafe rendering escape hatch", async () => {
  const contents = await Promise.all(sourceFiles.map((file) => readFile(resolve(root, file), "utf8")));
  const source = contents.join("\n");

  for (const forbidden of ["localStorage", "dangerouslySetInnerHTML", "eval(", "new Function", "http://", "https://"]) {
    assert.doesNotMatch(source, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
