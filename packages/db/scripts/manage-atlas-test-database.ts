import path from "node:path";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: path.resolve(process.cwd(), "..", "..", ".env"), quiet: true });

const action = process.argv[2];
const database = process.env.ATLAS_PERSISTENCE_TEST_DATABASE_NAME ?? "";
const source = process.env.DATABASE_URL;
if ((action !== "create" && action !== "drop" && action !== "status") || !source) throw new Error("Usage: manage-atlas-test-database.ts <create|drop|status> with DATABASE_URL configured.");
if (!/^habitat_atlas_(?:p3_verify|p4_rehearsal|p7_activation)_[a-z0-9_]+$/.test(database)) throw new Error("The isolated database name must use an approved Atlas verification/rehearsal prefix.");
const url = new URL(source);
if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname) || url.pathname.slice(1) === database) throw new Error("Only a distinct isolated local PostgreSQL database may be managed.");
url.pathname = "/postgres";

const client = new pg.Client({ connectionString: url.toString() });
await client.connect();
try {
  const present = await client.query<{ present: boolean }>("SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS present", [database]);
  const exists = present.rows[0]?.present === true;
  if (action === "create") {
    if (exists) throw new Error(`Refusing to overwrite existing database ${database}.`);
    await client.query(`CREATE DATABASE "${database}"`);
  } else if (action === "drop") {
    if (!exists) throw new Error(`Isolated database ${database} does not exist.`);
    await client.query(`DROP DATABASE "${database}"`);
  }
  process.stdout.write(`${JSON.stringify({ action, database, existedBefore: exists, existsAfter: action === "create" ? true : action === "drop" ? false : exists })}\n`);
} finally {
  await client.end();
}
