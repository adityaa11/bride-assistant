import assert from "node:assert/strict";
import test from "node:test";
import { runAdminCommand } from "../scripts/admin-command.mjs";

test("CLI rejects password arguments without prompting or disclosing them", async () => {
  const lines = [];
  const exit = await runAdminCommand(["bootstrap", "--email", "admin@example.test", "--name", "Admin", "--password", "private-value"], {
    prompt: () => { throw new Error("prompt must not run"); },
    write: (line) => lines.push(line),
  });
  assert.equal(exit, 1);
  assert.match(lines.join("\n"), /Passwords must be entered/);
  assert.doesNotMatch(lines.join("\n"), /private-value/);
});

test("CLI stops on password mismatch before database access", async () => {
  const lines = [];
  const values = ["first-password", "second-password"];
  const exit = await runAdminCommand(["bootstrap", "--email", "admin@example.test", "--name", "Admin"], {
    prompt: async () => values.shift(),
    write: (line) => lines.push(line),
  });
  assert.equal(exit, 1);
  assert.match(lines.join("\n"), /did not match/);
  assert.doesNotMatch(lines.join("\n"), /first-password|second-password/);
});
