import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): PostgresJsDatabase<typeof schema> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for persistent data access.");
  }
  // Cloudflare Workers bind socket I/O to the request that created it. A
  // module-level postgres.js pool therefore fails on the next request.
  const client = postgres(url, {
    max: 5,
    prepare: false,
    idle_timeout: 20,
  });
  return drizzle(client, { schema });
}

export async function closeDb(): Promise<void> {
  // Connections are request-scoped. postgres.js closes idle connections using
  // the configured timeout, so there is no shared client to close here.
}
