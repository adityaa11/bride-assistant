import "server-only";
import { withDatabase } from "./database.mjs";
import { readPublicPackages } from "./catalogue-repository.mjs";

export type PublicOffer = {
  id: string;
  title: string;
  description: string;
  type: "percentage" | "rupiah";
  value: number;
  startsOn: string;
  endsOn: string;
};

export type PublicPackageDetail = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  basePrice: number;
  items: { id: string; name: string; type: "service" | "action" }[];
  offer: PublicOffer | null;
};

type DbRow = Record<string, unknown>;
const string = (row: DbRow, key: string) => String(row[key]);
const number = (row: DbRow, key: string) => Number(row[key]);

export function publicPackageDate(now = new Date()) {
  return now.toISOString();
}

export async function loadPublicPackages(now = new Date()): Promise<
  { ok: true; packages: PublicPackageDetail[] } | { ok: false; code: "STORAGE_FAILURE" }
> {
  try {
    const result = await withDatabase((client) => readPublicPackages(client, publicPackageDate(now)));
    if (!result.ok) return { ok: false, code: "STORAGE_FAILURE" };
    return { ok: true, packages: result.value.map((row: DbRow) => {
      const offer = row.promotion as DbRow | null;
      return {
        id: string(row, "id"), name: string(row, "name"), description: string(row, "description"),
        durationMinutes: number(row, "duration_minutes"), basePrice: number(row, "base_price"),
        items: (row.items as DbRow[]).map((item) => ({ id: string(item, "id"),
          name: string(item, "name"), type: string(item, "type_code") as "service" | "action" })),
        offer: offer ? { id: string(offer, "id"), title: string(offer, "title"),
          description: string(offer, "description"), type: string(offer, "discount_type") as "percentage" | "rupiah",
          value: number(offer, "discount_value"), startsOn: string(offer, "starts_on"),
          endsOn: string(offer, "ends_on") } : null,
      };
    }) };
  } catch {
    return { ok: false, code: "STORAGE_FAILURE" };
  }
}
