-- The faction shelf grows a spine, and quests learn to fly a banner.
--
-- Two changes that travel together because both land in the same sheet law:
-- factions gain a parent (majors and the wings beneath them, the same tree
-- regions, systems, and races already run on) and arcs gain a FACTION_QUEST
-- category filed to a faction the way a companion quest is filed to a
-- character.

-- Safe inside this transaction: PostgreSQL allows ALTER TYPE ... ADD VALUE in
-- a transaction from 12 onward provided nothing later in the same transaction
-- USES the new value. Nothing below does — the new column is a plain UUID and
-- every backfill touches jsonb only. AFTER keeps the database's enum order
-- matching schema.prisma so a future diff never reads as drift.
ALTER TYPE "StoryArcCategory" ADD VALUE 'FACTION_QUEST' AFTER 'COMPANION_QUEST';

-- Whose banner the quest flies, mirroring regionEntryId and companionEntryId.
ALTER TABLE "StoryArc" ADD COLUMN "factionEntryId" UUID;
ALTER TABLE "StoryArc" ADD CONSTRAINT "StoryArc_factionEntryId_fkey"
  FOREIGN KEY ("factionEntryId") REFERENCES "StoryEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- The sheet law: every field a schema knows is required-with-no-default, so a
-- stored row missing a key is a row whose next save is refused whole. These
-- give the existing faction sheets the two new keys. A NULL meta is still "no
-- sheet written yet" and stays NULL. Guarded per key so a re-run never
-- overwrites a value somebody has since filled in.
UPDATE "StoryEntry" SET "meta" = "meta" || '{"parent": null}'::jsonb
  WHERE "kind" = 'FACTION' AND "meta" IS NOT NULL AND NOT ("meta" ? 'parent');
UPDATE "StoryEntry" SET "meta" = "meta" || '{"power": null}'::jsonb
  WHERE "kind" = 'FACTION' AND "meta" IS NOT NULL AND NOT ("meta" ? 'power');

-- The same law one rung down. Canon packets live inside a thread's own meta
-- and are validated as whole objects, so a packet missing the new key is
-- dropped from the inbox on read and refuses the thread's next sheet save.
-- Every stored packet gains it.
--
-- The array-length guard is load-bearing: jsonb_agg over zero rows returns
-- NULL, which would write "canonPackets": null onto every thread that has not
-- pushed anything yet — turning an empty inbox into a broken sheet.
UPDATE "StoryEntry"
  SET "meta" = jsonb_set("meta", '{canonPackets}', (
    SELECT jsonb_agg(
      CASE WHEN packet ? 'targetFaction' THEN packet
           ELSE packet || '{"targetFaction": null}'::jsonb END
      ORDER BY ordinality)
    FROM jsonb_array_elements("meta"->'canonPackets') WITH ORDINALITY AS t(packet, ordinality)))
  WHERE "kind" = 'THREAD' AND "meta" IS NOT NULL
    AND jsonb_typeof("meta"->'canonPackets') = 'array'
    AND jsonb_array_length("meta"->'canonPackets') > 0;
