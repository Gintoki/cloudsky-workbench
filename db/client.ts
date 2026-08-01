import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type PostgresClient = ReturnType<typeof postgres>;

const globalForDatabase = globalThis as typeof globalThis & {
  cloudskyPostgresClient?: PostgresClient;
  cloudskyPostgresUrl?: string;
};

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): PostgresJsDatabase<typeof schema> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for persistent data access.");
  }
  const client = getClient(url);
  return drizzle(client, { schema });
}

function getClient(url: string): PostgresClient {
  if (
    globalForDatabase.cloudskyPostgresClient &&
    globalForDatabase.cloudskyPostgresUrl === url
  ) {
    return globalForDatabase.cloudskyPostgresClient;
  }

  const client = postgres(url, {
    max: 5,
    prepare: false,
    idle_timeout: 20,
    keep_alive: 30,
  });
  globalForDatabase.cloudskyPostgresClient = client;
  globalForDatabase.cloudskyPostgresUrl = url;
  return client;
}

export async function closeDb(): Promise<void> {
  if (!globalForDatabase.cloudskyPostgresClient) {
    return;
  }
  await globalForDatabase.cloudskyPostgresClient.end({ timeout: 5 });
  globalForDatabase.cloudskyPostgresClient = undefined;
  globalForDatabase.cloudskyPostgresUrl = undefined;
}
