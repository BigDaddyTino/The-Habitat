import { spawn } from "node:child_process";
import dotenv from "dotenv";
import path from "node:path";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";

const root = path.resolve(process.cwd(), "..", "..");
dotenv.config({ path: path.join(root, ".env"), quiet: true });
dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });
const developmentUrl = resolveAtlasDevelopmentDatabaseUrl(process.env);
if (!developmentUrl) throw new Error("Atlas development startup requires the explicit local development configuration.");

const corepackPnpm = path.join(process.execPath, "..", "node_modules", "corepack", "dist", "pnpm.js");
const child = spawn(process.execPath, [corepackPnpm, "--filter", "@habitat/web", "dev", ...process.argv.slice(2)], {
  cwd: root,
  env: { ...process.env, DATABASE_URL: developmentUrl },
  stdio: "inherit",
});
child.once("exit", (code, signal) => process.exitCode = code ?? (signal ? 1 : 0));
