import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { resolve } from "node:path";

const root = process.cwd();
const sourceFiles = [
  "app/(public)/page.tsx",
  "app/(customer)/customer/page.tsx",
  "app/(admin)/admin/page.tsx",
  "shared/review-route.tsx",
];

test("public, customer, and admin route groups compose through the shared seam", async () => {
  const pages = await Promise.all(sourceFiles.slice(0, 3).map((file) => readFile(resolve(root, file), "utf8")));

  for (const page of pages) {
    assert.match(page, /@\/shared\/review-route/);
    assert.match(page, /<ReviewRoute audience=/);
  }
});

test("review-build source has no prototype execution or unsafe rendering escape hatch", async () => {
  const contents = await Promise.all(sourceFiles.map((file) => readFile(resolve(root, file), "utf8")));
  const source = contents.join("\n");

  for (const forbidden of ["localStorage", "dangerouslySetInnerHTML", "eval(", "new Function", "http://", "https://"]) {
    assert.doesNotMatch(source, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
