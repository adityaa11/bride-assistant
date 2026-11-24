import type { Client, ClientConfig } from "pg";
export declare class DatabaseConfigError extends Error { code: string; constructor(code: string); }
export declare function databaseConfig(env?: NodeJS.ProcessEnv): ClientConfig;
export declare function databaseClient(env?: NodeJS.ProcessEnv): Client;
export declare function databaseState(client: Client): Promise<{database: string; version: string; migrated: boolean; migrations: string[]}>;
export declare function withDatabase<T>(callback: (client: Client) => Promise<T>, env?: NodeJS.ProcessEnv): Promise<T>;
