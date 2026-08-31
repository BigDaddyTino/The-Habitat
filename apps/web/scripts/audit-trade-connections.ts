/**
 * The trades' world-connection audit — the professions system may not float.
 *
 * Verifies, against the LIVE codex:
 *  1. Every gate issuer resolves to a real entry, and the name the trades
 *     page prints matches the codex title (normalized).
 *  2. Every written trade ground resolves; every ground flagged `unwritten`
 *     genuinely has no entry yet (a flag gone stale is a lie on the page).
 *  3. Keeper slugs: existing codex characters are honoured (Mara Quill must
 *     exist and be what the seat says she is); the rest must be FREE slugs —
 *     a collision with an unrelated entry is a future dossier landing on
 *     somebody else's name.
 *  4. Every keeper `kind` anchors to a real shelf entry (species or
 *     creature), so no seat claims a kind the world does not have.
 *  5. Contradiction sweep: no codex entry still teaches three rungs, and
 *     nothing states the one-mastery law in a way that forecloses the
 *     Procurator's Second Seal.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/audit-trade-connections.ts
 */

import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { professions, tradeGrounds } from "../lib/professions";

const db = getPrismaClient();

let failures = 0;
let declared = 0;
const fail = (message: string) => { failures += 1; console.log(`  FAIL  ${message}`); };
const ok = (message: string) => console.log(`  ok    ${message}`);
const pending = (message: string) => { declared += 1; console.log(`  ....  ${message} (declared pending)`); };

const normalize = (value: string) => value.toLowerCase().replace(/^the /, "").replace(/[^a-z0-9]/g, "");

/** kind → the codex slug that proves the world has such a thing. */
const kindAnchors: Record<string, string[]> = {
  human: ["human"],
  returnee: ["returnees"],
  chartered: ["chartered"],
  beast: ["beasts"],
  supernatural: ["supernaturals"],
  risen: ["the-risen"],
  bloommarked: ["bloommarked-remnant"],
  echo: ["reclamation", "the-soul-forge"], // Echoes live in the Forge canon
  machine: ["maintenance-unit-m-17", "cybernetics"], // machine precedent
};

/** Keepers who must already exist, and what the seat claims about them. */
const existing: Record<string, { kind: string }> = {
  "mara-quill": { kind: "human" },
};

async function main() {
  const entries = await db.storyEntry.findMany({ select: { slug: true, title: true, kind: true, meta: true } });
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));

  console.log("1 · Gate issuers resolve, and the printed names match the codex");
  const issuers = new Map<string, string>();
  for (const trade of professions) for (const tier of trade.tiers) if (tier.gate) issuers.set(tier.gate.issuer, tier.gate.issuerName);
  for (const [slug, name] of issuers) {
    const entry = bySlug.get(slug);
    if (!entry) { fail(`issuer ${slug} (“${name}”) has no codex entry`); continue; }
    if (normalize(entry.title) !== normalize(name)) fail(`issuer ${slug}: page prints “${name}”, codex title is “${entry.title}”`);
    else ok(`${slug} → “${entry.title}”`);
  }

  console.log("\n2 · Trade grounds: written ones resolve, unwritten flags are true");
  for (const ground of tradeGrounds) {
    const entry = bySlug.get(ground.slug);
    if (ground.unwritten) {
      if (entry) fail(`${ground.slug} is flagged unwritten but the codex has “${entry.title}” — flip the flag`);
      else ok(`${ground.name} — genuinely unwritten, seat reservations valid`);
    } else {
      if (!entry) fail(`${ground.slug} claims to be written but has no codex entry`);
      else ok(`${ground.name} → “${entry.title}”`);
    }
  }

  console.log("\n3 · Keeper slugs: canon honoured, future names unclaimed");
  for (const trade of professions) {
    for (const seat of trade.seats) {
      if (!seat.keeperSlug) continue;
      const entry = bySlug.get(seat.keeperSlug);
      const claim = existing[seat.keeperSlug];
      if (claim) {
        if (!entry) { fail(`${seat.keeperSlug} is cited as an existing character but the codex has no such entry`); continue; }
        const meta = (entry.meta ?? {}) as Record<string, unknown>;
        const species = typeof meta.species === "string" ? meta.species : null;
        if (claim.kind === "human" && species && species !== "human") fail(`${seat.keeperSlug}: seat says human, sheet says ${species}`);
        else ok(`${seat.keeperSlug} exists (“${entry.title}”, ${entry.kind}) and the seat contradicts nothing`);
      } else if (entry) {
        fail(`${seat.keeperSlug} (${trade.slug} seat) collides with existing entry “${entry.title}” (${entry.kind})`);
      } else {
        pending(`${seat.keeperSlug} — ${seat.keeper}, ${trade.name} seat on ${seat.ground}`);
      }
    }
  }

  console.log("\n4 · Keeper kinds anchor to shelves the world actually has");
  const kinds = new Set(professions.flatMap((trade) => trade.seats.map((seat) => seat.kind).filter(Boolean))) as Set<string>;
  for (const kind of kinds) {
    const anchors = kindAnchors[kind];
    if (!anchors) { fail(`kind “${kind}” has no anchor mapping at all`); continue; }
    const found = anchors.find((slug) => bySlug.has(slug));
    if (found) ok(`${kind} → ${found} (“${bySlug.get(found)!.title}”)`);
    else fail(`kind “${kind}” anchors to none of [${anchors.join(", ")}]`);
  }

  console.log("\n5 · Contradiction sweep across the codex");
  const bodies = await db.storyEntry.findMany({ select: { slug: true, body: true }, where: { body: { not: null } } });
  for (const entry of bodies) {
    const body = entry.body ?? "";
    if (/three rungs/i.test(body)) fail(`${entry.slug} still teaches “three rungs”`);
    const oneMastery = /master (rung )?in exactly one/i.exec(body);
    if (oneMastery) {
      const window = body.slice(Math.max(0, oneMastery.index - 400), oneMastery.index + 400);
      if (!/procurator/i.test(window)) fail(`${entry.slug} states the one-mastery law with no Second Seal exception in reach`);
      else ok(`${entry.slug} states the one-mastery law with the Procurator exception beside it`);
    }
  }

  console.log("\n" + "=".repeat(70));
  if (failures) console.log(`FAIL — ${failures} broken connection(s); ${declared} future dossier(s) declared pending.`);
  else console.log(`PASS — every connection resolves or is declared; ${declared} future dossier(s) pending, none colliding.`);
  process.exitCode = failures ? 1 : 0;
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => db.$disconnect());
