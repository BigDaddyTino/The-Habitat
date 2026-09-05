import type { StoryEntryKind } from "@habitat/shared";

/**
 * The world-connection audit: every sheet field that names something else,
 * read from BOTH ends.
 *
 * The needs-work scan asks "does the thing this field names exist?". That is
 * one direction, and it is the direction that let the Outfall carry a Tier I
 * Veil Anchor on its sheet while the Veil Anchors system listed the Peninsula
 * and Ignit Island — neither of which has one — and never the Outfall.
 * Nothing was unresolved; the two ends simply disagreed.
 *
 * So this audit asks the second question, per field: does the other end
 * agree? A region road that only one region knows about, a faction seat the
 * region does not list as held, a leader whose own sheet does not name the
 * faction, a system note pinned to a region whose sheet carries no instance
 * of that system — each is a connection written once and read never.
 *
 * Pure: it takes rows and returns findings, so it can be tested on fixtures
 * and run by the CLI, the release audit, and anything else that wants it.
 */

export type WorldConnectionEntry = {
  slug: string;
  kind: StoryEntryKind;
  title: string;
  meta: unknown;
  /** Optional: the prose, for wiki-link resolution. */
  body?: string | null;
  summary?: string | null;
};

export type WorldConnectionArc = { slug: string };

export type WorldConnectionSeverity =
  /** Two ends of the same fact disagree, or a field names the wrong kind of thing. Fix before shipping. */
  | "defect"
  /** One end is written and the other is silent; the world reads inconsistently until the other end answers. */
  | "gap"
  /** Informational — something to know, not something wrong. */
  | "note";

export type WorldConnectionFinding = {
  severity: WorldConnectionSeverity;
  code: string;
  /** The entry whose sheet carries the problem. */
  slug: string;
  kind: StoryEntryKind;
  field: string;
  target: string;
  detail: string;
};

/**
 * Sheet fields that ARE an instance of a system: a region carrying a Veil
 * Anchor tier is a Veil Anchor, and the Veil Anchors system is supposed to
 * know. Adding a row here is how a new instance-bearing field joins both the
 * derived backlinks on the system page and this audit.
 */
export const systemInstanceFields: ReadonlyArray<{ field: string; system: string; noun: string; relation: (value: string) => string }> = [
  { field: "veilAnchorTier", system: "veil-anchors", noun: "Veil Anchor", relation: (value) => `stands here as a Tier ${value} Veil Anchor` },
  { field: "soulForge", system: "the-soul-forge", noun: "Soul Forge", relation: (value) => value === "destroyed" ? "had a Soul Forge here, now destroyed" : value === "damaged" ? "has a Soul Forge here, running but damaged" : "has a Soul Forge here" },
];

/** Which kinds a slug-typed field is allowed to resolve to. */
const expectedKinds: Record<string, StoryEntryKind[]> = {
  "CHARACTER.home": ["REGION"],
  "CHARACTER.species": ["CREATURE"],
  "CHARACTER.factions[].faction": ["FACTION"],
  "CHARACTER.relationships[].character": ["CHARACTER"],
  "CHARACTER.involvement[].ref (event)": ["EVENT"],
  "REGION.parent": ["REGION"],
  "REGION.control[].faction": ["FACTION"],
  "REGION.connections[].to": ["REGION"],
  "FACTION.parent": ["FACTION"],
  "FACTION.seat": ["REGION"],
  "FACTION.faith": ["SYSTEM", "FACTION"],
  "FACTION.leaders[]": ["CHARACTER"],
  "FACTION.relations[].faction": ["FACTION"],
  "CREATURE.parent": ["CREATURE"],
  "CREATURE.biomes[]": ["REGION"],
  "ITEM.origin": ["REGION"],
  "EVENT.where[]": ["REGION"],
  "EVENT.involved[]": ["CHARACTER", "FACTION", "CREATURE"],
  "SYSTEM.parent": ["SYSTEM"],
  "SYSTEM.dependsOn[]": ["SYSTEM"],
  "SYSTEM.regionNotes[].region": ["REGION"],
  "THREAD.parent": ["THREAD"],
  "THREAD.characters[]": ["CHARACTER"],
  "THREAD.companions[]": ["CHARACTER"],
  "THREAD.factions[]": ["FACTION"],
  "THREAD.locations[]": ["REGION"],
  "THREAD.bosses[]": ["CREATURE", "CHARACTER"],
  "THREAD.companionMissions[]": ["COMPANION_MISSION"],
  "THREAD.canonPackets[].targetRegion": ["REGION"],
  "THREAD.canonPackets[].targetCompanion": ["CHARACTER"],
  "THREAD.canonPackets[].targetFaction": ["FACTION"],
  "COMPANION_MISSION.companion": ["CHARACTER"],
  "COMPANION_MISSION.characters[]": ["CHARACTER"],
  "COMPANION_MISSION.locations[]": ["REGION"],
  "COMPANION_MISSION.factions[]": ["FACTION"],
  "COMPANION_MISSION.threads[]": ["THREAD"],
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
const rows = (value: unknown): Array<Record<string, unknown>> =>
  Array.isArray(value) ? value.map(asRecord).filter((row): row is Record<string, unknown> => row !== null) : [];
const slugOf = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);
const list = (value: unknown): string[] => (Array.isArray(value) ? value.map(slugOf).filter((slug): slug is string => slug !== null) : []);
/** Slug-or-prose fields only count as links when they look like a slug. */
const isSlugShaped = (value: string) => value.includes("-") && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
const kindLabel = (kind: StoryEntryKind) => kind.toLowerCase().replaceAll("_", " ");

export function auditWorldConnections(entries: WorldConnectionEntry[], arcs: WorldConnectionArc[] = []) {
  const findings: WorldConnectionFinding[] = [];
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const arcSlugs = new Set(arcs.map((arc) => arc.slug));
  const metaOf = (entry: WorldConnectionEntry) => asRecord(entry.meta) ?? {};

  const push = (severity: WorldConnectionSeverity, code: string, entry: WorldConnectionEntry, field: string, target: string, detail: string) =>
    findings.push({ severity, code, slug: entry.slug, kind: entry.kind, field, target, detail });

  /**
   * The one-direction check, kind-aware. A reference that resolves nowhere is
   * a link-now-fill-later marker and only a note; a reference that resolves to
   * the wrong KIND of entry is a defect, because every reader of that field
   * will treat it as the kind the field promises.
   */
  const resolve = (entry: WorldConnectionEntry, fieldKey: string, target: string | null, options: { slugOrProse?: boolean; field?: string } = {}) => {
    const field = options.field ?? fieldKey.slice(fieldKey.indexOf(".") + 1);
    if (!target) return null;
    // A slug-or-prose field is a link when it names an entry outright (even a
    // one-word slug like `heartland`) or is shaped like one; anything else is
    // a writer's note by design.
    if (options.slugOrProse && !bySlug.has(target) && !isSlugShaped(target)) return null;
    if (target === entry.slug) { push("defect", "SELF_REFERENCE", entry, field, target, `${entry.title} names itself in ${field}`); return null; }
    const found = bySlug.get(target);
    if (!found) { push("note", "UNRESOLVED", entry, field, target, `${field} names ${target}, which nobody has written yet`); return null; }
    const allowed = expectedKinds[fieldKey];
    if (allowed && !allowed.includes(found.kind)) {
      push("defect", "WRONG_KIND", entry, field, target, `${field} names ${found.title}, which is a ${kindLabel(found.kind)} — this field expects ${allowed.map(kindLabel).join(" or ")}`);
      return null;
    }
    return found;
  };
  const resolveArc = (entry: WorldConnectionEntry, field: string, target: string | null) => {
    if (!target) return;
    if (!arcSlugs.has(target)) push("note", "UNRESOLVED", entry, field, target, `${field} names the arc ${target}, which nobody has opened yet`);
  };

  // Region hierarchy, for the "an instance somewhere inside this region"
  // question the system-note check needs.
  const parentOf = (slug: string): string | null => {
    const entry = bySlug.get(slug);
    return entry?.kind === "REGION" ? slugOf(metaOf(entry).parent) : null;
  };
  const ancestorsOf = (slug: string): string[] => {
    const trail: string[] = [];
    let cursor = parentOf(slug);
    while (cursor && !trail.includes(cursor) && trail.length < 12) { trail.push(cursor); cursor = parentOf(cursor); }
    return trail;
  };

  for (const entry of entries) {
    const meta = metaOf(entry);

    if (entry.kind === "CHARACTER") {
      resolve(entry, "CHARACTER.home", slugOf(meta.home), { slugOrProse: true });
      resolve(entry, "CHARACTER.species", slugOf(meta.species), { slugOrProse: true });
      for (const row of rows(meta.factions)) resolve(entry, "CHARACTER.factions[].faction", slugOf(row.faction), { field: "factions" });
      for (const row of rows(meta.relationships)) {
        const other = resolve(entry, "CHARACTER.relationships[].character", slugOf(row.character), { field: "relationships" });
        if (!other) continue;
        const back = rows(metaOf(other).relationships).some((candidate) => slugOf(candidate.character) === entry.slug);
        if (!back) push("gap", "ONE_WAY_RELATIONSHIP", entry, "relationships", other.slug, `${entry.title} lists ${other.title} as ${slugOf(row.type) ?? "a relationship"}, but ${other.title}'s sheet does not list ${entry.title} back`);
      }
      for (const row of rows(meta.involvement)) {
        const ref = slugOf(row.ref) ?? slugOf(row.arc);
        if (row.kind === "EVENT") {
          const event = resolve(entry, "CHARACTER.involvement[].ref (event)", ref, { field: "involvement" });
          if (event && !list(metaOf(event).involved).includes(entry.slug)) push("gap", "ONE_WAY_INVOLVEMENT", entry, "involvement", event.slug, `${entry.title}'s sheet says they were involved in ${event.title}, but the event's own sheet does not list them`);
        } else resolveArc(entry, "involvement", ref);
      }
    }

    if (entry.kind === "REGION") {
      resolve(entry, "REGION.parent", slugOf(meta.parent));
      for (const row of rows(meta.control)) resolve(entry, "REGION.control[].faction", slugOf(row.faction), { field: "control" });
      for (const row of rows(meta.connections)) {
        const other = resolve(entry, "REGION.connections[].to", slugOf(row.to), { field: "connections" });
        if (!other) continue;
        const back = rows(metaOf(other).connections).some((candidate) => slugOf(candidate.to) === entry.slug);
        if (!back) push("gap", "ONE_WAY_REGION_CONNECTION", entry, "connections", other.slug, `${entry.title} connects to ${other.title}${slugOf(row.by) ? ` by ${slugOf(row.by)}` : ""}, but ${other.title} does not connect back — a road only one end knows about`);
      }
      // Every instance-bearing field: the governing system must exist, and it
      // should have written the place up. The derived backlink covers the link
      // itself, so a missing note is only a note.
      for (const spec of systemInstanceFields) {
        const value = slugOf(meta[spec.field]);
        if (!value) continue;
        const system = bySlug.get(spec.system);
        if (!system) { push("defect", "SYSTEM_MISSING", entry, spec.field, spec.system, `${entry.title} carries a ${spec.noun} but the ${spec.system} system entry does not exist`); continue; }
        const noted = rows(metaOf(system).regionNotes).some((row) => slugOf(row.region) === entry.slug);
        if (!noted) push("note", "INSTANCE_WITHOUT_SYSTEM_NOTE", entry, spec.field, spec.system, `${entry.title} carries a ${spec.noun} (${value}); ${system.title} links it by derivation but has written no region note for it`);
      }
    }

    if (entry.kind === "FACTION") {
      resolve(entry, "FACTION.parent", slugOf(meta.parent));
      resolve(entry, "FACTION.faith", slugOf(meta.faith), { slugOrProse: true });
      const seat = resolve(entry, "FACTION.seat", slugOf(meta.seat), { slugOrProse: true });
      if (seat && !rows(metaOf(seat).control).some((row) => slugOf(row.faction) === entry.slug)) {
        push("gap", "SEAT_NOT_IN_CONTROL", entry, "seat", seat.slug, `${entry.title} is seated at ${seat.title}, but ${seat.title}'s sheet does not list ${entry.title} among the powers there`);
      }
      for (const leader of list(meta.leaders)) {
        const character = resolve(entry, "FACTION.leaders[]", leader, { field: "leaders" });
        if (character && !rows(metaOf(character).factions).some((row) => slugOf(row.faction) === entry.slug)) {
          push("gap", "LEADER_NOT_MEMBER", entry, "leaders", character.slug, `${entry.title} names ${character.title} as a leader, but ${character.title}'s sheet does not list ${entry.title} among their factions`);
        }
      }
      for (const row of rows(meta.relations)) {
        const other = resolve(entry, "FACTION.relations[].faction", slugOf(row.faction), { field: "relations" });
        if (!other) continue;
        const back = rows(metaOf(other).relations).some((candidate) => slugOf(candidate.faction) === entry.slug);
        if (!back) push("gap", "ONE_WAY_FACTION_RELATION", entry, "relations", other.slug, `${entry.title} holds a stance toward ${other.title}${slugOf(row.stance) ? ` (${slugOf(row.stance)})` : ""}, but ${other.title}'s sheet has no stance toward ${entry.title}`);
      }
    }

    if (entry.kind === "CREATURE") {
      resolve(entry, "CREATURE.parent", slugOf(meta.parent));
      for (const biome of list(meta.biomes)) resolve(entry, "CREATURE.biomes[]", biome, { slugOrProse: true, field: "biomes" });
    }

    if (entry.kind === "ITEM") resolve(entry, "ITEM.origin", slugOf(meta.origin), { slugOrProse: true });

    if (entry.kind === "EVENT") {
      for (const place of list(meta.where)) resolve(entry, "EVENT.where[]", place, { field: "where" });
      for (const who of list(meta.involved)) {
        const found = resolve(entry, "EVENT.involved[]", who, { field: "involved" });
        // A character's sheet keeps its own involvement ledger; an event that
        // names them while their ledger stays silent is the same fact half-told.
        if (found?.kind === "CHARACTER" && !rows(metaOf(found).involvement).some((row) => row.kind === "EVENT" && (slugOf(row.ref) ?? slugOf(row.arc)) === entry.slug)) {
          push("gap", "ONE_WAY_INVOLVEMENT", entry, "involved", found.slug, `${entry.title} names ${found.title} as involved, but ${found.title}'s own involvement ledger does not record it`);
        }
      }
    }

    if (entry.kind === "SYSTEM") {
      resolve(entry, "SYSTEM.parent", slugOf(meta.parent));
      for (const dependency of list(meta.dependsOn)) resolve(entry, "SYSTEM.dependsOn[]", dependency, { field: "dependsOn" });
      resolveArc(entry, "unlockArc", slugOf(meta.unlockArc));
      const spec = systemInstanceFields.find((candidate) => candidate.system === entry.slug);
      for (const row of rows(meta.regionNotes)) {
        const region = resolve(entry, "SYSTEM.regionNotes[].region", slugOf(row.region), { field: "regionNotes" });
        if (!region || !spec) continue;
        // A note from an instance-bearing system pinned to a region that has
        // no instance on its sheet — nor anywhere inside it — is the Peninsula
        // bug: the system claiming ground the map does not give it.
        const inside = entries.filter((candidate) => candidate.kind === "REGION" && (candidate.slug === region.slug || ancestorsOf(candidate.slug).includes(region.slug)));
        if (!inside.some((candidate) => slugOf(metaOf(candidate)[spec.field]))) {
          push("defect", "SYSTEM_NOTE_WITHOUT_INSTANCE", entry, "regionNotes", region.slug, `${entry.title} carries a region note for ${region.title}, but no place in ${region.title} carries a ${spec.noun} on its sheet`);
        }
      }
    }

    if (entry.kind === "THREAD") {
      resolve(entry, "THREAD.parent", slugOf(meta.parent));
      for (const [key, field] of [["THREAD.characters[]", "characters"], ["THREAD.companions[]", "companions"], ["THREAD.factions[]", "factions"], ["THREAD.locations[]", "locations"], ["THREAD.bosses[]", "bosses"]] as const) {
        for (const target of list(meta[field])) resolve(entry, key, target, { field });
      }
      for (const target of list(meta.arcs)) resolveArc(entry, "arcs", target);
      for (const target of list(meta.companionMissions)) {
        const mission = resolve(entry, "THREAD.companionMissions[]", target, { field: "companionMissions" });
        if (mission && !list(metaOf(mission).threads).includes(entry.slug)) push("gap", "ONE_WAY_THREAD_MISSION", entry, "companionMissions", mission.slug, `${entry.title} lists the mission ${mission.title}, but the mission does not say it advances ${entry.title}`);
      }
      for (const row of rows(meta.canonPackets)) {
        resolve(entry, "THREAD.canonPackets[].targetRegion", slugOf(row.targetRegion), { field: "canonPackets" });
        resolve(entry, "THREAD.canonPackets[].targetCompanion", slugOf(row.targetCompanion), { field: "canonPackets" });
        resolve(entry, "THREAD.canonPackets[].targetFaction", slugOf(row.targetFaction), { field: "canonPackets" });
        for (const target of list(row.entries)) resolve(entry, "THREAD.canonPackets[].entries[]", target, { field: "canonPackets" });
      }
    }

    if (entry.kind === "COMPANION_MISSION") {
      resolve(entry, "COMPANION_MISSION.companion", slugOf(meta.companion));
      resolveArc(entry, "arc", slugOf(meta.arc));
      for (const [key, field] of [["COMPANION_MISSION.characters[]", "characters"], ["COMPANION_MISSION.locations[]", "locations"], ["COMPANION_MISSION.factions[]", "factions"]] as const) {
        for (const target of list(meta[field])) resolve(entry, key, target, { field });
      }
      for (const target of list(meta.threads)) {
        const thread = resolve(entry, "COMPANION_MISSION.threads[]", target, { field: "threads" });
        if (thread && !list(metaOf(thread).companionMissions).includes(entry.slug)) push("gap", "ONE_WAY_THREAD_MISSION", entry, "threads", thread.slug, `${entry.title} says it advances ${thread.title}, but the thread does not list this mission`);
      }
    }

    // Prose links, the one field every kind has.
    for (const match of `${entry.summary ?? ""}\n${entry.body ?? ""}`.matchAll(/\[\[([a-z0-9-]+)\]\]/g)) {
      const target = match[1]!;
      if (target === entry.slug || bySlug.has(target) || arcSlugs.has(target)) continue;
      if (!findings.some((finding) => finding.slug === entry.slug && finding.code === "UNRESOLVED" && finding.target === target)) push("note", "UNRESOLVED", entry, "body", target, `the prose links [[${target}]], which nobody has written yet`);
    }
  }

  const count = (severity: WorldConnectionSeverity) => findings.filter((finding) => finding.severity === severity).length;
  return { findings, defects: count("defect"), gaps: count("gap"), notes: count("note") };
}
