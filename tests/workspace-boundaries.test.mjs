import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { resolve } from "node:path";

const root = process.cwd();
const sourceFiles = [
  "app/(public)/page.tsx",
  "app/(customer)/customer/page.tsx",
  "app/(customer)/daftar/page.tsx",
  "app/(customer)/masuk/page.tsx",
  "app/(customer)/daftar/[state]/page.tsx",
  "app/(customer)/masuk/[state]/page.tsx",
  "app/(admin)/admin/page.tsx",
  "app/(public)/fixtures/empty/page.tsx",
  "app/(public)/fixtures/error/page.tsx",
  "shared/public-home.tsx",
  "shared/review-route.tsx",
  "shared/customer-auth.tsx",
  "shared/customer-home.tsx",
  "shared/customer-booking-history.tsx",
  "shared/admin-booking-workspace.tsx",
  "shared/scenarios/contracts.ts",
  "shared/scenarios/catalogue.ts",
  "shared/scenarios/adapter.ts",
];

test("public, customer, and admin route groups compose through the approved fixture seams", async () => {
  const pages = await Promise.all([sourceFiles[0], sourceFiles[1], sourceFiles[6]].map((file) => readFile(resolve(root, file), "utf8")));

  for (const page of pages.slice(1, 2)) {
    assert.match(page, /@\/shared\/review-route/);
    assert.match(page, /<ReviewRoute scenarioId=/);
  }
  assert.match(pages[0], /@\/shared\/public-home/);
  assert.match(pages[0], /<PublicHome scenarioId=/);
  assert.match(pages[2], /@\/shared\/admin-booking-workspace/);
  assert.match(pages[2], /<AdminBookingWorkspace scenarioId="admin\.booking-workspace"/);
});

test("public review states are named routes with declared scenario IDs", async () => {
  const [emptyRoute, errorRoute] = await Promise.all([
    readFile(resolve(root, "app/(public)/fixtures/empty/page.tsx"), "utf8"),
    readFile(resolve(root, "app/(public)/fixtures/error/page.tsx"), "utf8"),
  ]);

  assert.match(emptyRoute, /<PublicHome scenarioId="public\.catalogue-empty"/);
  assert.match(errorRoute, /<PublicHome scenarioId="public\.catalogue-error"/);
});

test("feature routes reach declared scenarios only through the versioned adapter seam", async () => {
  const [publicRoute, customerRoute, publicHome, reviewRoute, adapter, catalogue] = await Promise.all([
    readFile(resolve(root, "app/(public)/page.tsx"), "utf8"),
    readFile(resolve(root, "app/(customer)/customer/page.tsx"), "utf8"),
    readFile(resolve(root, "shared/public-home.tsx"), "utf8"),
    readFile(resolve(root, "shared/review-route.tsx"), "utf8"),
    readFile(resolve(root, "shared/scenarios/adapter.ts"), "utf8"),
    readFile(resolve(root, "shared/scenarios/catalogue.ts"), "utf8"),
  ]);

  for (const featureSource of [publicRoute, customerRoute]) {
    assert.doesNotMatch(featureSource, /shared\/scenarios\/(?:catalogue|contracts|adapter)/);
  }
  assert.match(publicHome, /getScenario/);
  assert.doesNotMatch(publicHome, /publication|draft/);
  assert.match(reviewRoute, /getScenario/);
  assert.match(adapter, /scenarioCatalogue/);
  assert.match(catalogue, /satisfies Record<string/);
});

test("admin booking and availability routes use named adapter fixtures without mutation authority", async () => {
  const [adminRoute, bookingsState, availabilityRoute, workspace, catalogue] = await Promise.all([
    readFile(resolve(root, "app/(admin)/admin/page.tsx"), "utf8"),
    readFile(resolve(root, "app/(admin)/admin/bookings/[state]/page.tsx"), "utf8"),
    readFile(resolve(root, "app/(admin)/admin/availability/page.tsx"), "utf8"),
    readFile(resolve(root, "shared/admin-booking-workspace.tsx"), "utf8"),
    readFile(resolve(root, "shared/scenarios/catalogue.ts"), "utf8"),
  ]);
  for (const route of [adminRoute, bookingsState, availabilityRoute]) assert.match(route, /AdminBookingWorkspace/);
  for (const scenario of ["admin.booking-workspace", "admin.booking-empty", "admin.availability-workspace"]) assert.match(catalogue, new RegExp(scenario.replaceAll(".", "\\.")));
  assert.match(workspace, /getScenario/);
  assert.match(workspace, /scenario\.interaction\.summary/);
  for (const forbidden of ["localStorage", "sessionStorage", "fetch(", "dangerouslySetInnerHTML", "Confirmed", "On Hold"]) assert.doesNotMatch(workspace, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("customer auth fixture routes expose declared register and sign-in states without authority", async () => {
  const [registerPage, signInPage, registerStates, signInStates, auth, catalogue] = await Promise.all([
    readFile(resolve(root, "app/(customer)/daftar/page.tsx"), "utf8"),
    readFile(resolve(root, "app/(customer)/masuk/page.tsx"), "utf8"),
    readFile(resolve(root, "app/(customer)/daftar/[state]/page.tsx"), "utf8"),
    readFile(resolve(root, "app/(customer)/masuk/[state]/page.tsx"), "utf8"),
    readFile(resolve(root, "shared/customer-auth.tsx"), "utf8"),
    readFile(resolve(root, "shared/scenarios/catalogue.ts"), "utf8"),
  ]);

  for (const source of [registerPage, signInPage, registerStates, signInStates]) assert.match(source, /CustomerAuth/);
  for (const scenario of ["customer.register-validation", "customer.register-loading", "customer.register-error", "customer.register-success", "customer.signin-validation", "customer.signin-loading", "customer.signin-error", "customer.signin-success"]) assert.match(catalogue, new RegExp(scenario.replaceAll(".", "\\.")));
  assert.match(auth, /getScenario/);
  assert.match(auth, /provenance/);
  assert.doesNotMatch(auth, /localStorage|sessionStorage|location\.assign|fetch\(/);
});

test("customer home and help routes use declared fixtures and never enable a live WhatsApp URL", async () => {
  const [homePage, homeStates, helpPage, customerHome, catalogue] = await Promise.all([
    readFile(resolve(root, "app/(customer)/beranda/page.tsx"), "utf8"),
    readFile(resolve(root, "app/(customer)/beranda/[state]/page.tsx"), "utf8"),
    readFile(resolve(root, "app/(customer)/bantuan/page.tsx"), "utf8"),
    readFile(resolve(root, "shared/customer-home.tsx"), "utf8"),
    readFile(resolve(root, "shared/scenarios/catalogue.ts"), "utf8"),
  ]);

  for (const source of [homePage, homeStates, helpPage]) assert.match(source, /Customer(?:Home|Help)/);
  for (const scenario of ["customer.home-success", "customer.home-empty", "customer.whatsapp-unavailable"]) assert.match(catalogue, new RegExp(scenario.replaceAll(".", "\\.")));
  assert.match(customerHome, /getScenario/);
  assert.match(customerHome, /setMessage\(scenario\.state\.message\)/);
  assert.match(catalogue, /Kontak WhatsApp belum tersedia/);
  assert.doesNotMatch(customerHome, /wa\.me|whatsapp:\/\/|https?:\/\//);
});

test("Booking Saya routes use typed fixture history and preserve the lifecycle and owner boundary", async () => {
  const [page, states, history, catalogue] = await Promise.all([
    readFile(resolve(root, "app/(customer)/booking-saya/page.tsx"), "utf8"),
    readFile(resolve(root, "app/(customer)/booking-saya/[state]/page.tsx"), "utf8"),
    readFile(resolve(root, "shared/customer-booking-history.tsx"), "utf8"),
    readFile(resolve(root, "shared/scenarios/catalogue.ts"), "utf8"),
  ]);
  assert.match(page, /CustomerBookingHistory/);
  assert.match(states, /customer\.booking-history-(?:error|payment|cancellation|cancelled|reschedule)/);
  assert.match(history, /getScenario/);
  assert.match(history, /bookingHistory/);
  assert.doesNotMatch(history, /localStorage|sessionStorage|wa\.me|fetch\(/);
  assert.doesNotMatch(history, /Ditolak/);
  for (const scenario of ["customer.booking-history-success", "customer.booking-history-payment", "customer.booking-history-cancellation", "customer.booking-history-cancelled", "customer.booking-history-reschedule", "customer.booking-history-error"]) assert.match(catalogue, new RegExp(scenario.replaceAll(".", "\\.")));
});

test("the public success route renders only adapter-provided published promotions", async () => {
  const [publicHome, sections, catalogue] = await Promise.all([
    readFile(resolve(root, "shared/public-home.tsx"), "utf8"),
    readFile(resolve(root, "shared/public-home/sections.tsx"), "utf8"),
    readFile(resolve(root, "shared/scenarios/catalogue.ts"), "utf8"),
  ]);

  assert.match(publicHome, /promotions=\{readModel\.promotions\}/);
  assert.match(sections, /PromotionShowcase promotions=\{promotions\}/);
  assert.match(sections, /promotion\.title/);
  assert.match(sections, /promotion\.description/);
  assert.match(sections, /promotion\.value/);
  assert.match(sections, /promotion\.endsOn/);
  assert.match(catalogue, /public\.catalogue-empty[\s\S]*?promotions: \[\]/);
  assert.match(catalogue, /public\.catalogue-error[\s\S]*?promotions: \[\]/);
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

test("public discovery styles remain route-local instead of leaking through global CSS", async () => {
  const [globalStyles, publicStyles] = await Promise.all([
    readFile(resolve(root, "app/globals.css"), "utf8"),
    readFile(resolve(root, "shared/public-home.module.css"), "utf8"),
  ]);

  assert.doesNotMatch(globalStyles, /public-site|public-hero|Public discovery composition/);
  assert.match(publicStyles, /Route \/ only/);
  assert.match(publicStyles, /--paper\s*:\s*#fffaf7\s*;/);
});
