import "../lib/environment";
import { createHash } from "node:crypto";
import { createPrismaClient } from "@habitat/db/client";
import { bloomfallCreatureEnhancements } from "../lib/bloomfall-creature-enhancements";
import { stableAtlasJson } from "./lib/atlas-integrity";

const expectedPromptCBaseline = "d943433bbdfdcfd70761249da81162782e67b71e08a8e74663a75ed91e54bf4f";
const database = createPrismaClient();

async function main() {
  const identity = await database.$queryRaw<Array<{ database: string; schema: string }>>`SELECT current_database() AS database, current_schema() AS schema`;
  if (identity[0]?.database === "habitat_atlas_dev") throw new Error("Production comparison refused the development database.");
  const entries = await database.storyEntry.findMany({
    where: { slug: { in: bloomfallCreatureEnhancements.map((entry) => entry.slug) } },
    orderBy: { slug: "asc" },
    select: { slug: true, kind: true, title: true, summary: true, body: true, meta: true, status: true },
  });
  const fingerprint = createHash("sha256").update(stableAtlasJson(entries, false)).digest("hex");
  const matchesPromptCBaseline = fingerprint === expectedPromptCBaseline;
  process.stdout.write(stableAtlasJson({
    action: "READ_ONLY_PROMPT_C_COMPARISON",
    database: identity[0],
    records: entries.length,
    fingerprint,
    expectedPromptCBaseline,
    matchesPromptCBaseline,
    writes: 0,
    migrations: 0,
    status: entries.length === bloomfallCreatureEnhancements.length && matchesPromptCBaseline ? "PASS" : "FAIL",
  }));
  if (entries.length !== bloomfallCreatureEnhancements.length || !matchesPromptCBaseline) process.exitCode = 1;
}

void main().finally(() => database.$disconnect());
