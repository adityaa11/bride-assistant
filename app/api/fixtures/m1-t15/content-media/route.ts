import { contentMediaError, parseContentMediaRequest } from "@/shared/server/content-media-request";
import { localContentImageStore } from "@/shared/server/local-content-image-store";

export const runtime = "nodejs";

export async function GET() {
  try { return Response.json(await localContentImageStore().list(), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return contentMediaError(error); }
}

export async function POST(request: Request) {
  try {
    const input = await parseContentMediaRequest(request);
    const metadata = await localContentImageStore().put(input);
    return Response.json(metadata, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return contentMediaError(error); }
}

export async function DELETE() {
  try {
    const removed = await localContentImageStore().cleanupOrphans();
    return Response.json({ removed }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return contentMediaError(error); }
}
