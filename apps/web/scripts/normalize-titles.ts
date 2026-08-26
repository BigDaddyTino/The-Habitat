import path from "node:path";
import { stat } from "node:fs/promises";
import dotenv from "dotenv";
import { createPrismaClient, type Prisma } from "@habitat/db/client";
import { resolveAtlasDevelopmentDatabaseUrl } from "../lib/atlas-development-database";
import { assertAtlasPersistentDevelopmentTarget, assertAtlasV2SchemaPresent } from "./lib/atlas-v2-activation";
import { atlasSha256, stableAtlasJson } from "./lib/atlas-integrity";
import { captureAtlasPreservationSnapshot } from "./lib/geographic-hierarchy-repair";
import {
  assessTitleNormalization,
  titleNormalizationContract,
  titleNormalizationManifest,
  titleNormalizationRevisionData,
} from "./lib/title-normalization";

const developmentConfirmation = "--confirm=NORMALIZE_CANONICAL_TITLES_DEVELOPMENT";
const productionConfirmation = "--confirm=NORMALIZE_CANONICAL_TITLES_PRODUCTION";

async function resolveTarget() {
  const root = path.resolve(process.cwd(), "..", "..");
  dotenv.config({ path: path.join(root, ".env"), quiet: true });
  const productionBase = process.env.DATABASE_URL;
  // Development resolution wants the local overrides; production mode must NOT
  // let .env.local stomp the explicitly provided production environment.
  if (!process.argv.includes("--production")) dotenv.config({ path: path.join(root, ".env.local"), override: true, quiet: true });

  if (!process.argv.includes("--production")) {
    const url = resolveAtlasDevelopmentDatabaseUrl(process.env);
    if (!url) throw new Error("Title normalization development target URL is unavailable.");
    assertAtlasPersistentDevelopmentTarget(url);
    return { mode: "DEVELOPMENT" as const, url, confirmation: developmentConfirmation };
  }

  // Production mode never infers its target from the normal app environment
  // loader; it requires the explicit target plus the same evidence gates the
  // Bloomfall production activation established.
  const url = process.env.TITLE_NORMALIZATION_DATABASE_URL;
  if (!url) throw new Error("Production title normalization requires an explicit TITLE_NORMALIZATION_DATABASE_URL.");
  const identity = new URL(url);
  if (!["localhost", "127.0.0.1", "::1"].includes(identity.hostname.toLowerCase()) || identity.pathname.slice(1) !== "habitat") throw new Error("Production title normalization is restricted to the loopback canonical habitat database.");
  if (!productionBase || stableAtlasJson({ h: new URL(productionBase).hostname, d: new URL(productionBase).pathname }, false) !== stableAtlasJson({ h: identity.hostname, d: identity.pathname }, false)) throw new Error("Production title normalization target must match the configured production database identity.");
  if (process.env.HABITAT_ENVIRONMENT !== "production" || process.env.TITLE_NORMALIZATION_CONFIRM_DATABASE !== "habitat") throw new Error("Production title normalization requires HABITAT_ENVIRONMENT=production and TITLE_NORMALIZATION_CONFIRM_DATABASE=habitat.");
  const backupPath = process.env.TITLE_NORMALIZATION_BACKUP_PATH?.trim();
  if (!backupPath || !path.isAbsolute(backupPath) || path.extname(backupPath).toLowerCase() !== ".dump") throw new Error("Production title normalization requires an absolute custom-format backup dump path.");
  const backup = await stat(backupPath);
  if (!backup.isFile() || backup.size <= 0) throw new Error("Production title normalization backup is missing or empty.");
  if (Date.now() - backup.mtimeMs > 2 * 60 * 60 * 1000) throw new Error("Production title normalization backup is older than two hours.");
  if (process.env.TITLE_NORMALIZATION_BACKUP_VERIFICATION !== "PG_RESTORE_LIST_OK") throw new Error("Production title normalization requires successful pg_restore list verification.");
  return { mode: "PRODUCTION" as const, url, confirmation: productionConfirmation, backup: { path: path.resolve(backupPath), bytes: backup.size } };
}

async function manifestRows(client: Prisma.TransactionClient | ReturnType<typeof createPrismaClient>) {
  const rows = await client.storyEntry.findMany({
    where: { id: { in: titleNormalizationManifest.map((entry) => entry.id) } },
    orderBy: { slug: "asc" },
    select: { id: true, slug: true, title: true, version: true },
  });
  return rows;
}

async function main() {
  const target = await resolveTarget();
  const database = createPrismaClient(target.url);
  try {
    await assertAtlasV2SchemaPresent(database);
    const current = await manifestRows(database);
    const assessment = assessTitleNormalization(current);
    const identity = new URL(target.url).pathname.slice(1);

    if (assessment.overall === "DRIFT") throw new Error(`Title normalization source drifted from its exact all-before/all-after contract: ${stableAtlasJson(assessment.records.filter((record) => record.state === "DRIFT"), false)}`);
    if (assessment.overall === "ALREADY_APPLIED") {
      process.stdout.write(stableAtlasJson({ contract: titleNormalizationContract, status: "ALREADY_APPLIED", mode: target.mode, database: identity, mutations: 0, revisions: 0 }));
      return;
    }
    if (!process.argv.includes("--apply")) {
      const proposedDiff = titleNormalizationManifest.map((entry) => ({ slug: entry.slug, category: entry.category, before: entry.beforeTitle, after: entry.finalTitle }));
      process.stdout.write(stableAtlasJson({ contract: titleNormalizationContract, status: "PREVIEW", mode: target.mode, database: identity, mutations: proposedDiff.length, proposedDiff }));
      return;
    }
    if (!process.argv.includes(target.confirmation)) throw new Error(`${target.mode} title normalization requires ${target.confirmation}.`);

    const result = await database.$transaction(async (tx) => {
      const beforeAtlas = await captureAtlasPreservationSnapshot(tx);
      const beforeRows = await manifestRows(tx);
      const transactionAssessment = assessTitleNormalization(beforeRows);
      if (transactionAssessment.overall !== "READY") throw new Error(`Titles changed before the transaction obtained its normalization state: ${stableAtlasJson(transactionAssessment, false)}`);
      const actor = await tx.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
      if (!actor) throw new Error("Title normalization requires an active administrator for revision authorship.");
      const changed = [];
      for (const expected of titleNormalizationManifest) {
        const before = beforeRows.find((entry) => entry.slug === expected.slug)!;
        const claimed = await tx.storyEntry.updateMany({
          where: { id: expected.id, slug: expected.slug, title: expected.beforeTitle, version: before.version },
          data: { title: expected.finalTitle, version: { increment: 1 }, updatedByUserId: actor.id },
        });
        if (claimed.count !== 1) throw new Error(`Optimistic title claim failed for ${expected.slug}.`);
        const revision = titleNormalizationRevisionData(expected.id, expected.slug, actor.id, before.version);
        await tx.storyRevision.create({ data: revision });
        changed.push({ slug: expected.slug, title: expected.finalTitle, versionBefore: before.version, versionAfter: before.version + 1, revisionId: revision.id });
      }
      const afterRows = await manifestRows(tx);
      const afterAssessment = assessTitleNormalization(afterRows);
      if (afterAssessment.overall !== "ALREADY_APPLIED") throw new Error(`Titles did not reach their exact final contract: ${stableAtlasJson(afterAssessment, false)}`);
      const afterAtlas = await captureAtlasPreservationSnapshot(tx);
      if (stableAtlasJson(afterAtlas, false) !== stableAtlasJson(beforeAtlas, false)) throw new Error("Atlas maps, placements, topology, connections, paths, or geometry changed during the title normalization.");
      return { actorUserId: actor.id, changed, atlasPreserved: true };
    }, { isolationLevel: "Serializable", timeout: 30_000 });

    const receipt = {
      contract: titleNormalizationContract,
      status: "NORMALIZED",
      mode: target.mode,
      database: identity,
      backup: target.mode === "PRODUCTION" ? target.backup : undefined,
      actorUserId: result.actorUserId,
      mutations: result.changed.length,
      revisions: result.changed.length,
      atlasPreserved: result.atlasPreserved,
      changed: result.changed,
    };
    process.stdout.write(stableAtlasJson({ ...receipt, logicalSha256: atlasSha256(stableAtlasJson(receipt, false)) }));
  } finally {
    await database.$disconnect();
  }
}

void main();
