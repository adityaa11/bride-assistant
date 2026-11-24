import { expect, test, type Page } from "@playwright/test";
import { z } from "zod";
import { withDatabase } from "../shared/server/database.mjs";
import { decideActorInput } from "../shared/server/authorization-decision";
import type { SessionActor } from "../shared/server/actor";

const password = "Disposable-Password-123";
const commandSchema = z.object({ value: z.string().min(1) }).strict();

async function register(page: Page, email: string) {
  await page.goto("/daftar");
  await page.getByLabel("Nama lengkap").fill("Disposable Customer");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(password);
  await page.getByLabel("Konfirmasi kata sandi", { exact: true }).fill(password);
  await page.getByRole("button", { name: /Daftar Akun/ }).click();
  await expect(page).toHaveURL(/\/beranda$/);
}

test("protected routes and disposable authoritative owner contract", async ({ page, browser, request }) => {
  test.setTimeout(60_000);
  const suffix = Date.now();
  const ownerEmail = `m2t05-owner-${suffix}@example.test`;
  const otherEmail = `m2t05-other-${suffix}@example.test`;

  const anonymous = await request.get("/admin", { maxRedirects: 0 });
  expect(anonymous.status()).toBe(307);
  expect(anonymous.headers().location).toBe("/admin/masuk");
  const anonymousCustomer = await request.get("/beranda", { maxRedirects: 0 });
  expect(anonymousCustomer.status()).toBe(307);
  expect(anonymousCustomer.headers().location).toBe("/masuk");

  await register(page, ownerEmail);
  const otherContext = await browser.newContext();
  const otherPage = await otherContext.newPage();
  await register(otherPage, otherEmail);
  const rowsBefore = await withDatabase(async (db) => db.query(
    `SELECT (SELECT count(*)::int FROM auth."user") AS users,
      (SELECT count(*)::int FROM auth.session) AS sessions`,
  ));
  const deniedAdmin = await page.request.get("/admin", { maxRedirects: 0 });
  expect(deniedAdmin.status()).toBe(307);
  expect(deniedAdmin.headers().location).toBe("/admin/masuk");
  await page.context().addCookies([{ name: "role", value: "admin", url: "http://localhost:3000" }]);
  expect((await page.request.get("/admin", { maxRedirects: 0 })).status()).toBe(307);
  expect((await page.request.get("/booking-saya")).status()).toBe(200);
  const rowsAfter = await withDatabase(async (db) => db.query(
    `SELECT (SELECT count(*)::int FROM auth."user") AS users,
      (SELECT count(*)::int FROM auth.session) AS sessions`,
  ));
  expect(rowsAfter.rows).toEqual(rowsBefore.rows);

  await withDatabase(async (db) => {
    await db.query("BEGIN");
    try {
      await db.query(`CREATE TEMP TABLE m2_t05_owned_record (
        id text PRIMARY KEY, owner_id text NOT NULL, value text NOT NULL
      ) ON COMMIT DROP`);
      const identities = await db.query<{ id: string; email: string; role: string }>(
        `SELECT id, email, role FROM auth."user" WHERE email = ANY($1)`, [[ownerEmail, otherEmail]],
      );
      const rows = identities.rows as Array<{ id: string; email: string; role: string }>;
      const ownerId = rows.find((row) => row.email === ownerEmail)?.id;
      const otherId = rows.find((row) => row.email === otherEmail)?.id;
      expect(ownerId).toBeTruthy();
      expect(otherId).toBeTruthy();
      expect(rows.every((row) => row.role === "customer")).toBe(true);
      await db.query("INSERT INTO m2_t05_owned_record (id, owner_id, value) VALUES ($1, $2, $3)",
        ["other-record", otherId, "private value"]);
      const countBefore = await db.query("SELECT count(*)::int AS count FROM m2_t05_owned_record");
      const lookup = async (id: string) => {
        const result = await db.query<{ owner_id: string }>(
          "SELECT owner_id FROM m2_t05_owned_record WHERE id = $1", [id]);
        return result.rows[0]?.owner_id ?? null;
      };
      const actor: SessionActor = {
        subjectId: ownerId!, role: "customer", sessionId: "test-session", expiresAt: new Date(Date.now() + 60_000),
      };
      const valid = decideActorInput({ actor, requiredRole: "customer", recordOwnerId: ownerId!,
        payload: { value: "allowed" }, schema: commandSchema });
      expect(valid).toMatchObject({ ok: true, parsedData: { value: "allowed" }, record: "found" });
      expect(decideActorInput({ actor: null, requiredRole: "customer", recordOwnerId: await lookup("other-record"),
        payload: { value: "x" }, schema: commandSchema })).toEqual({ ok: false, code: "AUTHENTICATION_REQUIRED" });
      expect(decideActorInput({ actor, requiredRole: "admin", payload: { value: "x", role: "admin" },
        schema: commandSchema })).toEqual({ ok: false, code: "FORBIDDEN" });
      expect(decideActorInput({ actor, requiredRole: "customer", recordOwnerId: await lookup("other-record"),
        payload: { value: "x", ownerId }, schema: commandSchema })).toEqual({ ok: false, code: "FORBIDDEN" });
      expect(decideActorInput({ actor, requiredRole: "customer", recordOwnerId: ownerId!,
        payload: { value: "" }, schema: commandSchema })).toMatchObject({ ok: false, code: "INVALID_INPUT", fields: ["value"] });
      expect(decideActorInput({ actor, requiredRole: "customer", recordOwnerId: ownerId!,
        payload: { value: "x", role: "admin" }, schema: commandSchema })).toMatchObject({ ok: false, code: "INVALID_INPUT" });
      const empty = decideActorInput({ actor, requiredRole: "customer", recordOwnerId: await lookup("missing"),
        payload: { value: "x" }, schema: commandSchema });
      expect(empty).toMatchObject({ ok: true, record: "missing", parsedData: { value: "x" } });
      expect(JSON.stringify(empty)).not.toContain("private value");
      const countAfter = await db.query("SELECT count(*)::int AS count FROM m2_t05_owned_record");
      expect(countAfter.rows).toEqual(countBefore.rows);
    } finally {
      await db.query("ROLLBACK");
    }
  });
  await otherContext.close();
});
