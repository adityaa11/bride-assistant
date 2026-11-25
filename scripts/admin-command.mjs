import { bootstrapAdmin, reconcileAdmin, BootstrapError } from "./admin-bootstrap-core.mjs";

const usage = "Usage: npm run admin -- bootstrap --email <email> --name <name> | reconcile --attempt-id <id>";

function options(args, allowed) {
  const values = {};
  for (let index = 0; index < args.length; index += 2) {
    const option = args[index];
    const value = args[index + 1];
    if (/^--(?:password|initial-password|confirm-password)(?:=|$)/.test(option ?? "")) throw new BootstrapError("PASSWORD_ARGUMENT_FORBIDDEN");
    if (!allowed.includes(option) || !value || value.startsWith("--") || values[option]) throw new BootstrapError("INVALID_ARGUMENTS");
    values[option] = value;
  }
  return values;
}

function passwordPrompt(label) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new BootstrapError("NON_INTERACTIVE");
  process.stdout.write(`${label}: `);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  return new Promise((resolve, reject) => {
    let value = "";
    const restore = () => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };
    const onData = (chunk) => {
      if (chunk.includes("\u001b")) return;
      for (const character of chunk) {
        if (character === "\r" || character === "\n") {
          restore(); process.stdout.write("\n"); resolve(value); return;
        }
        if (character === "\u0003") {
          restore(); process.stdout.write("\n"); reject(new BootstrapError("INPUT_CANCELLED")); return;
        }
        if (character === "\u007f" || character === "\b") { value = Array.from(value).slice(0, -1).join(""); continue; }
        value += character;
      }
    };
    process.stdin.on("data", onData);
  });
}

const messages = {
  PASSWORD_ARGUMENT_FORBIDDEN: "Passwords must be entered at the interactive prompts.",
  NON_INTERACTIVE: "Bootstrap requires an interactive terminal.",
  INVALID_EMAIL: "A valid --email is required.",
  INVALID_NAME: "A non-empty --name is required.",
  INVALID_PASSWORD: "A password is required.",
  PASSWORD_MISMATCH: "Password confirmation did not match.",
  INPUT_CANCELLED: "Password input was cancelled.",
  BOOTSTRAP_SEALED: "The first administrator bootstrap is already sealed.",
  BOOTSTRAP_RESERVED: "An earlier bootstrap attempt is reserved; use its recorded ID with reconcile.",
  BOOTSTRAP_CONFLICT: "An administrator already exists; bootstrap was not started.",
  EMAIL_COLLISION: "This email belongs to an existing account.",
  ATTEMPT_MISMATCH: "The attempt ID does not match the reservation.",
  ATTEMPT_ID_REQUIRED: "A valid --attempt-id is required.",
  RECONCILIATION_UNVERIFIED: "The reserved admin identity could not be verified; reservation remains in place.",
  IDENTITY_CREATION_FAILED: "Identity creation failed; reservation remains in place.",
  IDENTITY_VERIFICATION_FAILED: "Created identity could not be verified; reservation remains in place.",
};

export async function runAdminCommand(args, { prompt = passwordPrompt, write = console.log, env = process.env } = {}) {
  try {
    if (args[0] === "reconcile") {
      const values = options(args.slice(1), ["--attempt-id"]);
      const result = await reconcileAdmin(values["--attempt-id"], env);
      write(`Bootstrap attempt ${result.attemptId} sealed. Email: ${result.email}`);
      return 0;
    }
    if (args[0] !== "bootstrap") throw new BootstrapError("INVALID_ARGUMENTS");
    const values = options(args.slice(1), ["--email", "--name"]);
    if (!values["--email"] || !values["--name"]) throw new BootstrapError("INVALID_ARGUMENTS");
    const password = await prompt("Initial password");
    const confirmation = await prompt("Confirm password");
    if (password !== confirmation) throw new BootstrapError("PASSWORD_MISMATCH");
    const result = await bootstrapAdmin({ email: values["--email"], name: values["--name"], password }, env);
    write(`First administrator ready. Email: ${result.email}. Role: admin. Bootstrap: sealed.`);
    return 0;
  } catch (error) {
    const code = error instanceof BootstrapError ? error.code : "BOOTSTRAP_FAILED";
    write(`ERROR: ${messages[code] ?? (code === "INVALID_ARGUMENTS" ? usage : "Bootstrap failed. Check configuration and the database.")}`);
    if (error instanceof BootstrapError && error.attemptId) write(`Reserved attempt ID: ${error.attemptId}`);
    return 1;
  }
}
