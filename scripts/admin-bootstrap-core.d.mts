export class BootstrapError extends Error {
  readonly code: string;
  readonly attemptId?: string;
}

export type AdminBootstrapResult = {
  state: "SEALED";
  attemptId: string;
  email: string;
  userId: string;
};

export function bootstrapAdmin(input: { email: string; name: string; password: string }, env?: NodeJS.ProcessEnv): Promise<AdminBootstrapResult>;
export function reconcileAdmin(attemptId: string, env?: NodeJS.ProcessEnv): Promise<AdminBootstrapResult>;
