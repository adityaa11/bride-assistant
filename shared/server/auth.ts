import "server-only";
import { betterAuth } from "better-auth";
import { authDatabasePool } from "./database.mjs";

function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET_MISSING");
  return betterAuth({
      secret,
      database: authDatabasePool(),
      emailAndPassword: { enabled: true },
      user: {
        additionalFields: {
          role: {
            type: "string",
            required: true,
            defaultValue: "customer",
            input: false,
          },
        },
      },
  });
}

let instance: ReturnType<typeof createAuth> | undefined;

export function getAuth(): ReturnType<typeof createAuth> {
  return instance ??= createAuth();
}
