import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const referenceDirectory = path.join(root, "project's goal", "UI Reference");
const outputDirectory = path.join(root, "public", "reference-assets", "ui-reference");

const extensionFor = (mime) => ({
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
}[mime] ?? "bin");

const safeName = (value) => value.replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "").toLowerCase();
const digest = (value) => createHash("sha256").update(value).digest("hex").slice(0, 12);

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

const manifest = [];
const files = (await readdir(referenceDirectory)).filter((name) => name.endsWith(".html"));

for (const file of files) {
  const source = await readFile(path.join(referenceDirectory, file), "utf8");
  const stem = safeName(path.basename(file, ".html"));
  let imageIndex = 0;
  let svgIndex = 0;

  for (const match of source.matchAll(/data:(image\/[a-zA-Z0-9.+-]+)(;base64)?,([^"'\s)]+)/g)) {
    const [, mime, encoded, payload] = match;
    const content = encoded ? Buffer.from(payload, "base64") : Buffer.from(decodeURIComponent(payload));
    const extension = extensionFor(mime);
    const name = `${stem}-image-${String(++imageIndex).padStart(2, "0")}-${digest(content)}.${extension}`;
    await writeFile(path.join(outputDirectory, name), content);
    manifest.push({ source: file, kind: "embedded-image", mime, file: name });
  }

  for (const match of source.matchAll(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi)) {
    const svg = match[0];
    if (/<script\b|\son[a-z]+\s*=|<foreignObject\b/i.test(svg)) {
      throw new Error(`Unsafe inline SVG in ${file}; extraction stopped.`);
    }
    const name = `${stem}-inline-svg-${String(++svgIndex).padStart(2, "0")}-${digest(svg)}.svg`;
    await writeFile(path.join(outputDirectory, name), svg);
    manifest.push({ source: file, kind: "inline-svg", mime: "image/svg+xml", file: name });
  }
}

await writeFile(
  path.join(outputDirectory, "manifest.json"),
  `${JSON.stringify({ generatedFrom: "project's goal/UI Reference", assets: manifest }, null, 2)}\n`,
);

console.log(`Extracted ${manifest.length} static assets from ${files.length} reference pages.`);
