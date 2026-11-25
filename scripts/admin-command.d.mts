export function runAdminCommand(
  args: readonly string[],
  dependencies?: {
    prompt?: (label: string) => Promise<string>;
    write?: (line: string) => void;
    env?: NodeJS.ProcessEnv;
  },
): Promise<number>;
