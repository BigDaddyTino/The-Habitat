import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";

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
