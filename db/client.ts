import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let cachedDb: PostgresJsDatabase<typeof schema> | null = null;
let cachedClient: ReturnType<typeof postgres> | null = null;

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (cachedDb) return cachedDb;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for persistent data access.");
  }
  cachedClient = postgres(url, {
    max: 5,
    prepare: false,
    idle_timeout: 20,
  });
  cachedDb = drizzle(cachedClient, { schema });
  return cachedDb;
}

export async function closeDb(): Promise<void> {
  if (cachedClient) await cachedClient.end();
  cachedClient = null;
  cachedDb = null;
}
