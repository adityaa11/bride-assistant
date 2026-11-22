import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const source = pathToFileURL(resolve("project's goal/UI Reference/Bride_Assistant_Planner_Standalone_v3_Content_Management.html")).href;
const output = resolve(".atlas/evidence/M1-T15");
const base = process.env.T15_BASE_URL ?? "http://localhost:3315";
const widths = [1440, 1251, 1250, 1151, 1150, 931, 930, 721, 720, 486, 485];
const browser = await chromium.launch({ headless: true });
const measures = [];
await mkdir(output, { recursive: true });
for (const width of widths) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
  for (const [panel, sourcePage, route] of [["portfolio", "stories", "/admin/content/empty"], ["testimonials", "stories", "/admin/content/empty"], ["events", "events", "/admin/events/empty"]]) {
    const reference = await context.newPage();
    await reference.goto(source);
    await reference.locator(`[data-page="${sourcePage}"]`).click();
    if (panel === "testimonials") await reference.locator('[data-action="web-tab-testimonials"]').click();
    await reference.mouse.move(1, 1);
    await reference.screenshot({ path: resolve(output, `source-${panel}-${width}.png`), fullPage: true });
    const app = await context.newPage();
    await app.goto(`${base}${route}`);
    if (panel === "testimonials") await app.getByRole("tab", { name: /Testimonials/ }).click();
    await app.mouse.move(1, 1);
    await app.screenshot({ path: resolve(output, `app-${panel}-${width}.png`), fullPage: true });
    const overflow = await app.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false, `${panel} horizontal overflow at ${width}px`);
    assert.equal(await app.getByRole("article").count(), 0);
    measures.push({ panel, width, sourceMain: await reference.locator("#main").boundingBox(), appMain: await app.locator("#admin-workspace").boundingBox(), sourceEmpty: await reference.locator(".web-empty").boundingBox(), appEmpty: await app.getByRole("status").boundingBox(), overflow });
    await reference.close(); await app.close();
  }
  await context.close();
}
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await context.newPage();
await page.goto(`${base}/admin/content`);
assert.equal(await page.getByText("Draft", { exact: true }).count() > 0, true);
assert.equal(await page.getByText("Published", { exact: true }).count() > 0, true);
await page.screenshot({ path: resolve(output, "app-portfolio-populated.png"), fullPage: true });
const publicPage = await context.newPage();
await publicPage.goto(base);
const publicText = await publicPage.locator("body").innerText();
for (const draftOnly of ["An intimate bridal morning", "A thoughtful morning", "Bridal Open House", "Draft consultation"]) assert.equal(publicText.includes(draftOnly), false, `public draft leak: ${draftOnly}`);
await publicPage.screenshot({ path: resolve(output, "app-public-negative.png"), fullPage: true });
await publicPage.close();
await page.getByRole("tab", { name: /Testimonials/ }).click();
assert.equal(await page.getByText("Fictional customer A").count(), 1);
await page.screenshot({ path: resolve(output, "app-testimonials-populated.png"), fullPage: true });
await page.goto(`${base}/admin/events`);
assert.equal(await page.getByText("Bridal Open House").count(), 1);
await page.screenshot({ path: resolve(output, "app-events-populated.png"), fullPage: true });
await page.getByRole("button", { name: "Tambah Event" }).first().click();
assert.equal(await page.getByRole("dialog").isVisible(), true);
await page.screenshot({ path: resolve(output, "app-event-form.png"), fullPage: true });
await page.keyboard.press("Escape");
assert.equal(await page.getByRole("dialog").isVisible(), false);
await page.getByRole("button", { name: "Publish" }).first().click();
await page.getByRole("button", { name: "publish", exact: true }).click();
assert.match(await page.getByRole("status").innerText(), /no content or publication state changed/);
assert.equal(await page.getByText("Draft", { exact: true }).count() > 0, true);
await page.screenshot({ path: resolve(output, "app-proposed-result.png"), fullPage: true });
await page.goto(`${base}/admin/content/error`);
assert.match(await page.getByRole("alert").filter({ hasText: "content review fixture" }).innerText(), /could not be prepared/);
await page.screenshot({ path: resolve(output, "app-error.png"), fullPage: true });
await page.goto(`${base}/admin/content`);
await page.keyboard.press("Tab");
assert.match(await page.locator(":focus").innerText(), /Lewati ke workspace/);
await page.screenshot({ path: resolve(output, "app-keyboard-focus.png"), fullPage: true });
await context.close();
for (const width of [1440, 930, 720, 485]) {
  const shell = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
  for (const [name, route] of [["bookings", "/admin"], ["availability", "/admin/availability"], ["content", "/admin/content"], ["events", "/admin/events"]]) {
    const page = await shell.newPage(); await page.goto(`${base}${route}`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name} shell overflow ${width}px`);
    assert.equal(await page.locator('a[href="/admin/content"]').count() > 0, true);
    assert.equal(await page.locator('a[href="/admin/events"]').count() > 0, true);
    await page.screenshot({ path: resolve(output, `shell-${name}-${width}.png`), fullPage: true });
    await page.close();
  }
  await shell.close();
}
const mobile = await browser.newContext({ viewport: { width: 485, height: 900 }, reducedMotion: "reduce" });
const menu = await mobile.newPage(); await menu.goto(`${base}/admin/content`);
await menu.getByRole("button", { name: "Buka menu modul" }).click();
assert.equal(await menu.getByRole("dialog", { name: "Menu modul" }).isVisible(), true);
await menu.screenshot({ path: resolve(output, "app-mobile-drawer.png"), fullPage: true });
await menu.keyboard.press("Escape");
assert.equal(await menu.getByRole("dialog", { name: "Menu modul" }).isVisible(), false);
await mobile.close();
await writeFile(resolve(output, "measurements.json"), JSON.stringify(measures, null, 2));
await browser.close();
