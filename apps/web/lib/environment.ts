import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import { resolveAtlasDevelopmentDatabaseUrl } from "./atlas-development-database";

function findEnvFile() {
  let directory = process.cwd();
  for (;;) {
    const candidate = path.join(directory, ".env");
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
}

const envFile = findEnvFile();
if (envFile) dotenv.config({ path: envFile, quiet: true });
const atlasDevelopmentUrl = resolveAtlasDevelopmentDatabaseUrl(process.env);
if (atlasDevelopmentUrl) process.env.DATABASE_URL = atlasDevelopmentUrl;
