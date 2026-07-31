import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./db/migrations",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://cloudsky:cloudsky_dev@localhost:5432/cloudsky_workbench",
  },
  strict: true,
  verbose: true,
});
