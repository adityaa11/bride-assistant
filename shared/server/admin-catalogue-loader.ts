import "server-only";
import { z } from "zod";
import { authorizeRequest } from "./authorization";
import { withDatabase } from "./database.mjs";
import { readAdminCatalogue } from "./admin-catalogue-commands.mjs";

export async function loadAdminCatalogue() {
  const decision = await authorizeRequest({ requiredRole: "admin", payload: undefined, schema: z.undefined() });
  if (!decision.ok) return { ok: false as const, code: decision.code };
  try { return await withDatabase((client) => readAdminCatalogue(client, decision)); }
  catch { return { ok: false as const, code: "STORAGE_FAILURE" as const }; }
}
