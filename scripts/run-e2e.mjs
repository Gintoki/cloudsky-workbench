import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

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
