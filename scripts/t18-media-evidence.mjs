import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const base = process.env.T18_BASE_URL ?? "http://localhost:3318";
const root = process.env.M1_T18_TEST_STORAGE_ROOT;
assert.ok(root && root.includes("t18-"), "isolated T18 temporary storage root required");
const output = resolve(process.env.T18_EVIDENCE_DIR ?? join(tmpdir(), "t18-media-evidence"));
await mkdir(output, { recursive: true });
const source = pathToFileURL(resolve("project's goal/UI Reference/Bride_Assistant_Planner_Standalone_v3_Content_Management.html")).href;
const png = await readFile(resolve("public/fixture-assets/m1-t15/bridal-preparation.png"));
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
const webp = Buffer.from("RIFF\x04\x00\x00\x00WEBP", "binary");
const cases = [
  { collection: "portfolio", record: "portfolio-published", title: "A garden celebration", route: "/admin/content", label: "Foto portfolio (JPG / PNG / WebP)", newRecord: "portfolio-new" },
  { collection: "testimonials", record: "testimonial-published", title: "I felt supported throughout the day.", route: "/admin/content", label: "Foto testimoni (JPG / PNG / WebP)", newRecord: "testimonial-new" },
  { collection: "events", record: "event-published", title: "Bridal Care Preview", route: "/admin/events", label: "Foto event (JPG / PNG / WebP)", newRecord: "event-new" },
];
const collectionRoot = (name) => name === "portfolio" ? root : join(dirname(root), name);
const files = async (name) => readdir(collectionRoot(name)).catch((error) => error.code === "ENOENT" ? [] : Promise.reject(error));
const api = `${base}/api/fixtures/m1-t15/content-media`;
const makeForm = (bytes, type, recordId, altText = "Fictional fixture image", filename = "../../outside.png") => {
  const form = new FormData();
  form.set("image", new File([bytes], filename, { type }));
  form.set("recordId", recordId);
  form.set("altText", altText);
  return form;
};
const metadata = async (record) => (await (await fetch(api)).json())[record];
const checkRead = async (key, bytes, type) => {
  const response = await fetch(`${api}/${key}`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), type);
  assert.equal(Number(response.headers.get("x-fixture-media-size")), bytes.length);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
};
const sourceScan = ["shared/admin-content-workspace.tsx", "app/(public)/page.tsx", "app/(customer)/customer/page.tsx"];
for (const path of sourceScan) assert.doesNotMatch(await readFile(resolve(path), "utf8"), /FileReader|readAsDataURL|localStorage|node:fs|data:image\/|https?:\/\/|local-document-store/);
for (const path of ["app/(public)/page.tsx", "app/(customer)/customer/page.tsx"]) assert.doesNotMatch(await readFile(resolve(path), "utf8"), /content-media|local-content-image-store/);
await rm(dirname(root), { recursive: true, force: true });
assert.equal((await fetch(`${api}/${"a".repeat(32)}`)).status, 404);
assert.ok([400, 404].includes((await fetch(`${api}/%2e%2e%2foutside`)).status));
for (const item of cases) assert.deepEqual(await files(item.collection), []);
for (const route of ["/admin/content/empty", "/admin/content/error", "/admin/events/empty", "/admin/events/error", "/", "/customer"]) {
  const response = await fetch(`${base}${route}`);
  assert.equal(response.status, 200);
  assert.equal((await response.text()).includes("/api/fixtures/m1-t15/content-media/"), false);
}
for (const item of cases) assert.deepEqual(await files(item.collection), []);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await context.newPage();
const openPanel = async (item) => {
  await page.goto(`${base}${item.route}`);
  if (item.collection === "testimonials") await page.getByRole("tab", { name: /Testimonials/ }).click();
};
for (const item of cases) {
  await openPanel(item);
  const card = page.getByRole("article").filter({ hasText: item.title });
  if (item.collection === "events") assert.equal(await card.locator("img").count(), 0);
  if (item.collection === "testimonials") assert.equal(await card.locator("img").count(), 0);
  for (const width of [1440, 930, 720, 485]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: join(output, `${item.collection}-fallback-${width}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await card.getByRole("button", { name: "Edit" }).click();
  const file = page.getByLabel(item.label);
  assert.equal(await file.count(), 1);
  await file.focus();
  assert.equal(await file.evaluate((element) => document.activeElement === element), true);
  await page.route("**/api/fixtures/m1-t15/content-media", async (route) => {
    if (route.request().method() === "POST") await new Promise((done) => setTimeout(done, 250));
    await route.continue();
  });
  await page.getByLabel("Teks alternatif foto (aksesibilitas)").fill(`${item.collection} fictional image`);
  await file.setInputFiles({ name: "../../outside.png", mimeType: "image/png", buffer: png });
  await page.getByRole("dialog").getByRole("button", { name: "Simpan konten" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Menyimpan…" }).waitFor();
  assert.equal(await page.getByRole("dialog").getByRole("button", { name: "Menyimpan…" }).isDisabled(), true);
  await page.screenshot({ path: join(output, `${item.collection}-loading-1440.png`), fullPage: true });
  await page.getByRole("status").filter({ hasText: "Foto fixture tersimpan" }).waitFor();
  await page.unroute("**/api/fixtures/m1-t15/content-media");
  const first = await metadata(item.record);
  assert.match(first.storageKey, /^[a-f0-9]{32}$/);
  assert.equal(first.sha256, createHash("sha256").update(png).digest("hex"));
  assert.equal(first.size, png.length);
  assert.equal(first.mediaType, "image/png");
  assert.equal(first.altText, `${item.collection} fictional image`);
  assert.equal(JSON.parse(await readFile(join(collectionRoot(item.collection), `${first.storageKey}.json`), "utf8")).recordId, item.record);
  assert.equal((await files(item.collection)).includes(`${first.storageKey}.bin`), true);
  await checkRead(first.storageKey, png, "image/png");
  await page.reload();
  if (item.collection === "testimonials") await page.getByRole("tab", { name: /Testimonials/ }).click();
  await page.getByRole("article").filter({ hasText: item.title }).locator(`img[src*="${first.storageKey}"]`).waitFor();
  for (const width of [1440, 930, 720, 485]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: join(output, `${item.collection}-uploaded-${width}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 900 });

  const bad = await fetch(`${api}/${first.storageKey}`, { method: "PUT", body: makeForm(Buffer.from("bad"), "image/png", item.record) });
  assert.equal(bad.status, 400);
  await checkRead(first.storageKey, png, "image/png");
  const other = cases.find((entry) => entry.collection !== item.collection);
  assert.equal((await fetch(`${api}/${first.storageKey}`, { method: "PUT", body: makeForm(jpeg, "image/jpeg", other.record) })).status, 404);
  assert.equal((await fetch(`${api}/${first.storageKey}?recordId=${other.record}`, { method: "DELETE" })).status, 404);
  await checkRead(first.storageKey, png, "image/png");
  const replace = await fetch(`${api}/${first.storageKey}`, { method: "PUT", body: makeForm(jpeg, "image/jpeg", item.record) });
  assert.equal(replace.status, 200);
  const next = await replace.json();
  assert.notEqual(next.storageKey, first.storageKey);
  assert.equal((await fetch(`${api}/${first.storageKey}`)).status, 404);
  await checkRead(next.storageKey, jpeg, "image/jpeg");
  assert.equal((await metadata(item.record)).storageKey, next.storageKey);
  assert.equal((await fetch(`${api}/${next.storageKey}?recordId=${item.record}`, { method: "DELETE" })).status, 204);
  assert.equal((await fetch(`${api}/${next.storageKey}`)).status, 404);
  assert.equal(await metadata(item.record), undefined);

  await openPanel(item);
  const cardCount = await page.getByRole("article").count();
  await page.getByRole("button", { name: item.collection === "portfolio" ? "Tambah Portfolio" : item.collection === "testimonials" ? "Tambah Testimoni" : "Tambah Event" }).first().click();
  if (item.collection === "portfolio") await page.getByPlaceholder("Contoh: A beautiful intimate wedding").fill("Fictional new portfolio");
  if (item.collection === "testimonials") {
    await page.getByPlaceholder("Nama customer, sesuai persetujuan").fill("Fictional person");
    await page.getByPlaceholder("Tuliskan pengalaman customer...").fill("Fictional review for this fixture.");
  }
  if (item.collection === "events") {
    await page.getByPlaceholder("Contoh: Ranur Bridal Open House").fill("Fictional event");
    await page.getByRole("dialog").locator('input[type="date"]').fill("2026-12-10");
  }
  await page.getByLabel("Teks alternatif foto (aksesibilitas)").fill("Fictional new image");
  await page.getByLabel(item.label).setInputFiles({ name: "new.png", mimeType: "image/png", buffer: png });
  await page.getByRole("dialog").getByRole("button", { name: "Simpan konten" }).click();
  await page.getByRole("status").filter({ hasText: "Foto fixture tersimpan" }).waitFor();
  assert.equal(await page.getByRole("article").count(), cardCount);
  const proposed = await metadata(item.newRecord);
  await page.locator(`[role="status"] img[src*="${proposed.storageKey}"]`).waitFor();
  await page.screenshot({ path: join(output, `${item.collection}-proposed-add-1440.png`), fullPage: true });
  assert.equal((await fetch(`${api}/${proposed.storageKey}?recordId=${item.newRecord}`, { method: "DELETE" })).status, 204);

  await page.getByRole("button", { name: item.collection === "portfolio" ? "Tambah Portfolio" : item.collection === "testimonials" ? "Tambah Testimoni" : "Tambah Event" }).first().click();
  if (item.collection === "portfolio") await page.getByPlaceholder("Contoh: A beautiful intimate wedding").fill("Fictional invalid portfolio");
  if (item.collection === "testimonials") {
    await page.getByPlaceholder("Nama customer, sesuai persetujuan").fill("Fictional person");
    await page.getByPlaceholder("Tuliskan pengalaman customer...").fill("Fictional review.");
  }
  if (item.collection === "events") {
    await page.getByPlaceholder("Contoh: Ranur Bridal Open House").fill("Fictional event");
    await page.getByRole("dialog").locator('input[type="date"]').fill("2026-12-10");
  }
  await page.getByLabel("Teks alternatif foto (aksesibilitas)").fill("Invalid fixture image");
  await page.getByLabel(item.label).setInputFiles({ name: "invalid.png", mimeType: "image/png", buffer: Buffer.from("bad") });
  await page.getByRole("dialog").getByRole("button", { name: "Simpan konten" }).click();
  await page.getByRole("alert").filter({ hasText: "Foto tidak dapat disimpan" }).waitFor();
  await page.screenshot({ path: join(output, `${item.collection}-error-1440.png`), fullPage: true });
  assert.equal(await metadata(item.newRecord), undefined);
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
}

for (const [bytes, type, expected] of [[webp, "image/webp", 201], [jpeg, "image/jpeg", 201], [Buffer.from("bad"), "image/png", 400], [png, "text/plain", 400], [Buffer.alloc(5 * 1024 * 1024 + 1), "image/png", 413]]) {
  const response = await fetch(api, { method: "POST", body: makeForm(bytes, type, "testimonial-new") });
  assert.equal(response.status, expected);
  if (expected === 201) {
    const result = await response.json();
    await checkRead(result.storageKey, bytes, type);
    assert.equal((await fetch(`${api}/${result.storageKey}?recordId=testimonial-new`, { method: "DELETE" })).status, 204);
  }
}
for (const record of ["events", "testimonial-published/../../", "unknown"]) assert.equal((await fetch(api, { method: "POST", body: makeForm(png, "image/png", record) })).status, 400);
assert.equal((await fetch(api, { method: "POST", body: makeForm(png, "image/png", "event-new", "") })).status, 400);
const sentinel = join(dirname(root), "t18-outside-sentinel.txt");
await writeFile(sentinel, "keep");
const siblingUpload = await fetch(api, { method: "POST", body: makeForm(png, "image/png", "event-new") });
assert.equal(siblingUpload.status, 201);
const siblingKey = (await siblingUpload.json()).storageKey;
await writeFile(join(root, `${"b".repeat(32)}.bin`), "orphan");
await writeFile(join(root, `${"c".repeat(32)}.0123456789abcdef.tmp`), "temporary");
await writeFile(join(root, `${"d".repeat(32)}.bin`), "orphan pair");
await writeFile(join(root, `${"d".repeat(32)}.json`), "{}");
await writeFile(join(collectionRoot("testimonials"), `${"e".repeat(32)}.bin`), "testimonial orphan");
await writeFile(join(collectionRoot("events"), `${"f".repeat(32)}.bin`), "event orphan");
const cleanup = await fetch(api, { method: "DELETE" });
assert.equal(cleanup.status, 200);
assert.equal((await cleanup.json()).removed, 6);
assert.equal(await readFile(sentinel, "utf8"), "keep");
await checkRead(siblingKey, png, "image/png");
assert.equal((await fetch(`${api}/${siblingKey}?recordId=event-new`, { method: "DELETE" })).status, 204);
for (const item of cases) assert.deepEqual(await files(item.collection), ["records.json"]);

for (const width of [1440, 930, 720, 485]) {
  await page.setViewportSize({ width, height: 900 });
  for (const item of cases) {
    const reference = await context.newPage();
    await reference.setViewportSize({ width, height: 900 });
    await reference.goto(source);
    await reference.locator(`[data-page="${item.collection === "events" ? "events" : "stories"}"]`).click();
    if (item.collection === "testimonials") await reference.locator('[data-action="web-tab-testimonials"]').click();
    await reference.locator(`[data-action="website-new-${item.collection}"]`).first().click();
    await reference.screenshot({ path: join(output, `source-${item.collection}-form-${width}.png`), fullPage: true });
    await reference.close();
    await openPanel(item);
    await page.getByRole("button", { name: item.collection === "portfolio" ? "Tambah Portfolio" : item.collection === "testimonials" ? "Tambah Testimoni" : "Tambah Event" }).first().click();
    assert.equal(await page.getByRole("dialog").locator('input[type="file"]').count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: join(output, `${item.collection}-form-${width}.png`), fullPage: true });
    await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
  }
}
await browser.close();
await rm(dirname(root), { recursive: true, force: true });
for (const item of cases) assert.deepEqual(await files(item.collection), []);
console.log(JSON.stringify({ result: "PASS", root, captures: output, collections: cases.map((item) => item.collection) }));
