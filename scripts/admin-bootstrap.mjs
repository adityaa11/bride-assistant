import { runAdminCommand } from "./admin-command.mjs";

process.exitCode = await runAdminCommand(process.argv.slice(2));
