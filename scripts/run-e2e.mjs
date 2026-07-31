import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

// E2E exercises the deterministic demo store, never a developer's local database.
process.env.DATABASE_URL = "";
process.env.USE_DEMO_DATA = "true";
process.env.MARKET_DATA_FETCH_ENABLED = "false";

const server = await createServer({
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
});

await server.listen();

const playwrightCli = new URL(
  "../node_modules/@playwright/test/cli.js",
  import.meta.url,
);
const child = spawn(process.execPath, [fileURLToPath(playwrightCli), "test"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    DATABASE_URL: "",
    USE_DEMO_DATA: "true",
    MARKET_DATA_FETCH_ENABLED: "false",
    PLAYWRIGHT_EXTERNAL_SERVER: "true",
    ALLOW_DEMO_AUTH: "true",
    SESSION_SECRET: "cloudsky-playwright-session-secret-not-for-production-2026",
    SESSION_TTL_HOURS: "12",
  },
  stdio: "inherit",
});

const exitCode = await new Promise((resolve) => {
  child.once("exit", (code) => resolve(code ?? 1));
});

await server.close();
process.exit(exitCode);
