import { expect, test } from "@playwright/test";
import { runAdminCommand } from "../scripts/admin-command.mjs";

test("CLI bootstrap credentials sign in at admin/masuk", async ({ page }) => {
  test.setTimeout(60_000);
  const email = `admin-browser-${Date.now()}@example.test`;
  const password = "Disposable-Password-123";
  const output: string[] = [];
  const prompts = [password, password];
  const exit = await runAdminCommand(["bootstrap", "--email", email, "--name", "Disposable Administrator"], {
    prompt: async () => prompts.shift() ?? "",
    write: (line) => output.push(line),
  });
  expect(exit).toBe(0);
  expect(output.join("\n")).toContain("Bootstrap: sealed");
  expect(output.join("\n")).not.toContain(password);

  await page.goto("/admin/masuk");
  await page.getByLabel("Alamat email").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(password);
  await page.getByRole("button", { name: /Masuk Akun/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("main")).toBeVisible();
});
