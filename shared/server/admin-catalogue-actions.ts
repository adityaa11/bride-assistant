"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorizeRequest } from "./authorization";
import { withDatabase } from "./database.mjs";
import { executeAdminCatalogueCommand } from "./admin-catalogue-commands.mjs";

const uuid = z.uuid();
const text = z.string().trim().min(1).max(120);
const description = z.string().trim().max(600);
const ids = z.array(uuid).max(100).refine((values) => new Set(values).size === values.length);
const item = z.object({ catalogue_type_id: z.number().int().positive(), name: text, description, active: z.boolean() }).strict();
const bundle = z.object({ name: text, description, active: z.boolean(), catalogueIds: ids.min(1) }).strict();
const pkg = z.object({ name: text, description, duration_minutes: z.number().int().positive().max(1440),
  base_price: z.string().regex(/^\d{1,12}(?:\.\d{1,2})?$/), published: z.boolean(), active: z.boolean(),
  catalogueIds: ids, bundleIds: ids }).strict().refine((value) => value.catalogueIds.length + value.bundleIds.length > 0);
const promotion = z.object({ title: text, description, discount_type: z.enum(["percentage", "rupiah"]),
  discount_value: z.string().regex(/^\d{1,12}(?:\.\d{1,2})?$/).refine((value) => Number(value) > 0),
  starts_on: z.iso.date(), ends_on: z.iso.date(), published: z.boolean(), active: z.boolean(), packageIds: ids.min(1) })
  .strict().refine((value) => value.starts_on <= value.ends_on)
  .refine((value) => value.discount_type !== "percentage" || Number(value.discount_value) <= 100);

const schema = z.discriminatedUnion("entity", [
  z.object({ entity: z.literal("item"), operation: z.enum(["create", "update", "retire"]), id: uuid.optional(), requestKey: uuid.optional(), values: item.optional() }),
  z.object({ entity: z.literal("bundle"), operation: z.enum(["create", "update", "retire"]), id: uuid.optional(), requestKey: uuid.optional(), values: bundle.optional() }),
  z.object({ entity: z.literal("package"), operation: z.enum(["create", "update", "retire"]), id: uuid.optional(), requestKey: uuid.optional(), values: pkg.optional() }),
  z.object({ entity: z.literal("promotion"), operation: z.enum(["create", "update", "retire"]), id: uuid.optional(), requestKey: uuid.optional(), values: promotion.optional() }),
]).superRefine((value, context) => {
  if (value.operation === "create" && !value.requestKey) context.addIssue({ code: "custom", path: ["requestKey"], message: "Required" });
  if (value.operation !== "create" && !value.id) context.addIssue({ code: "custom", path: ["id"], message: "Required" });
  if (value.operation !== "retire" && !value.values) context.addIssue({ code: "custom", path: ["values"], message: "Required" });
});

export async function adminCatalogueCommand(input: unknown) {
  const decision = await authorizeRequest({ requiredRole: "admin", payload: input, schema });
  if (!decision.ok) return decision;
  try {
    const result = await withDatabase((client) => executeAdminCatalogueCommand(client, decision));
    if (result.ok) {
      for (const path of ["/admin/catalogue", "/admin/packages", "/admin/promotions"]) revalidatePath(path);
      return { ok: true as const, id: String(result.value.id) };
    }
    return result;
  } catch { return { ok: false as const, code: "STORAGE_FAILURE" as const }; }
}
