import "server-only";
import type { ContentImageMetadata } from "@/shared/content-image-store";

const maxBytes = 5 * 1024 * 1024;
const allowedRecords = new Set(["portfolio-draft", "portfolio-published", "portfolio-new"]);

export class ContentMediaInputError extends Error {
  constructor(readonly code: string, readonly status = 400) { super(code); }
}

export async function parseContentMediaRequest(request: Request): Promise<{ bytes: Uint8Array; mediaType: ContentImageMetadata["mediaType"]; altText: string; recordId: string }> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data;")) throw new ContentMediaInputError("INVALID_FORM");
  let form: FormData;
  try { form = await request.formData(); } catch { throw new ContentMediaInputError("INVALID_FORM"); }
  const file = form.get("image");
  const recordId = form.get("recordId");
  const altText = form.get("altText");
  if (!(file instanceof File) || form.getAll("image").length !== 1 || typeof recordId !== "string" || !allowedRecords.has(recordId)) throw new ContentMediaInputError("INVALID_SCOPE");
  if (typeof altText !== "string" || !altText.trim() || altText.trim().length > 180) throw new ContentMediaInputError("INVALID_ALT_TEXT");
  if (!file.size || file.size > maxBytes) throw new ContentMediaInputError("INVALID_SIZE", 413);
  const mediaType = file.type;
  if (mediaType !== "image/jpeg" && mediaType !== "image/png" && mediaType !== "image/webp") throw new ContentMediaInputError("INVALID_TYPE");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const signatureValid = mediaType === "image/jpeg" ? bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : mediaType === "image/png" ? bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)
    : bytes.length >= 12 && String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" && String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP";
  if (!signatureValid) throw new ContentMediaInputError("INVALID_SIGNATURE");
  return { bytes, mediaType, altText: altText.trim(), recordId };
}

export function contentMediaError(error: unknown): Response {
  const known = error instanceof ContentMediaInputError;
  return Response.json({ error: known ? error.code : "STORAGE_FAILURE" }, { status: known ? error.status : 500, headers: { "Cache-Control": "no-store" } });
}
