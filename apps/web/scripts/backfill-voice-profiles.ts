import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { emptyVoiceProfile } from "@habitat/shared";
import { characterMetaSchema } from "../lib/story-meta-schemas";

/**
 * Export contract v5, B3: every CHARACTER carries `meta.voiceProfile`. The
 * schema field is required-but-nullable, so a sheet that predates it would be
 * rejected whole on its next save; this writes a profile onto every character
 * that has none, prefilled from what the sheet already says — the prose voice
 * note becomes the design prompt, sex and age carry across — with consent
 * SYNTHETIC_DESIGNED (the only kind a script may ever assume) and the face
 * rig unknown. `voiceStatus` is left alone: the pipeline sets it.
 *
 * Idempotent: a character with a profile is skipped. Preview by default;
 * `--apply` writes.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/backfill-voice-profiles.ts [--apply]
 */
const apply = process.argv.includes("--apply");
const db = getPrismaClient();

async function main() {
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  const characters = await db.storyEntry.findMany({ where: { kind: "CHARACTER" }, select: { id: true, slug: true, title: true, meta: true, version: true }, orderBy: { slug: "asc" } });
  let written = 0;
  let skipped = 0;
  const problems: string[] = [];
  for (const character of characters) {
    const meta = typeof character.meta === "object" && character.meta !== null && !Array.isArray(character.meta) ? character.meta as Record<string, unknown> : null;
    if (!meta) { problems.push(`${character.slug}: no sheet at all; run the character-bible backfill first`); continue; }
    if (meta.voiceProfile && typeof meta.voiceProfile === "object") { skipped += 1; continue; }
    const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);
    // The sheet's `age` is prose and can run long; the profile's ageRange is
    // a short label, so a long one is left for a writer rather than cut.
    const age = text(meta.age);
    const profile = {
      ...emptyVoiceProfile(),
      sex: text(meta.sex),
      ageRange: age && age.length <= 40 ? age : null,
      designPrompt: text(meta.voice),
    };
    const next = { ...meta, voiceProfile: profile };
    const parsed = characterMetaSchema.safeParse(next);
    if (!parsed.success) { problems.push(`${character.slug}: ${parsed.error.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`).join("; ")}`); continue; }
    console.log(`${apply ? "write" : "would write"} voiceProfile on ${character.slug}${profile.designPrompt ? "" : " (no voice note to prefill from)"}`);
    written += 1;
    if (!apply) continue;
    // Server-owned keys (visualArt, voiceStatus) are carried because `next`
    // spreads the stored meta rather than the parsed one.
    await db.storyEntry.update({ where: { id: character.id }, data: { meta: next as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: actor.id } });
    await db.storyRevision.create({ data: { entityType: "ENTRY", entityId: character.id, action: "UPDATED", actorUserId: actor.id, summary: "Voice profile backfilled from the sheet (export v5)." } });
  }
  console.log(`${apply ? "WROTE" : "PREVIEW"}: ${written} profile(s), ${skipped} already present, ${problems.length} problem(s)`);
  for (const problem of problems) console.log(`  ! ${problem}`);
  if (problems.length) process.exitCode = 1;
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
