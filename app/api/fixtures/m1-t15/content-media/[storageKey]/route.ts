import { contentMediaError, ContentMediaInputError, parseContentMediaRequest } from "@/shared/server/content-media-request";
import { localContentImageStore, validStorageKey } from "@/shared/server/local-content-image-store";

export const runtime = "nodejs";
type Context = { params: Promise<{ storageKey: string }> };

async function keyFrom(context: Context): Promise<string> {
  const { storageKey } = await context.params;
  if (!validStorageKey(storageKey)) throw new ContentMediaInputError("INVALID_KEY");
  return storageKey;
}

export async function GET(_request: Request, context: Context) {
  try {
    const image = await localContentImageStore().read(await keyFrom(context));
    if (!image) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return new Response(new Uint8Array(image.bytes), { headers: { "Content-Type": image.metadata.mediaType, "Content-Length": String(image.metadata.size), "X-Fixture-Media-Size": String(image.metadata.size), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return contentMediaError(error); }
}

export async function PUT(request: Request, context: Context) {
  try {
    const key = await keyFrom(context);
    const input = await parseContentMediaRequest(request);
    const metadata = await localContentImageStore().replace(key, input);
    if (!metadata) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json(metadata, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return contentMediaError(error); }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    if (!(await localContentImageStore().remove(await keyFrom(context)))) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch (error) { return contentMediaError(error); }
}
