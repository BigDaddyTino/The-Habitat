"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AbilityCardView } from "@/components/ability-card";
import type { Pillar, Spell, SpellTier } from "@/lib/spellbook";
import type { SpellUnlock } from "@/lib/spell-unlocks";

/**
 * The 108, browsable: filter by pillar, tier, and which of the eight classes
 * can reach the spell through its tree. Each spell is one ability card with
 * the licence class as its eyebrow, the overcharge failure as a red line
 * under it, and the nodes that open it as links into the class pages.
 */
const tiers: SpellTier[] = ["Licensed", "Certified", "Master"];

export function SpellbookBrowser({
  spells,
  pillars,
  unlocks,
  icons,
  classes,
}: {
  spells: Spell[];
  pillars: Pillar[];
  unlocks: Record<string, SpellUnlock[]>;
  icons: Record<string, string>;
  classes: Array<{ slug: string; name: string }>;
}) {
  const [pillar, setPillar] = useState<string>("all");
  const [tier, setTier] = useState<string>("all");
  const [classSlug, setClassSlug] = useState<string>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => spells.filter((spell) => {
    if (pillar !== "all" && spell.pillar !== pillar) return false;
    if (tier !== "all" && spell.tier !== tier) return false;
    if (classSlug !== "all" && !(unlocks[spell.id] ?? []).some((unlock) => unlock.classSlug === classSlug)) return false;
    if (query && !`${spell.name} ${spell.licence} ${spell.card.effect}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [spells, pillar, tier, classSlug, query, unlocks]);

  const grouped = pillars.map((entry) => ({ pillar: entry, spells: visible.filter((spell) => spell.pillar === entry.slug) })).filter((group) => group.spells.length);

  return (
    <div className="spellbook">
      <div className="spellbook-filters">
        <label>Pillar
          <select onChange={(event) => setPillar(event.target.value)} value={pillar}>
            <option value="all">All six</option>
            {pillars.map((entry) => <option key={entry.slug} value={entry.slug}>{entry.name}</option>)}
          </select>
        </label>
        <label>Tier
          <select onChange={(event) => setTier(event.target.value)} value={tier}>
            <option value="all">Any tier</option>
            {tiers.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
          </select>
        </label>
        <label>Reachable by
          <select onChange={(event) => setClassSlug(event.target.value)} value={classSlug}>
            <option value="all">Any class</option>
            {classes.map((entry) => <option key={entry.slug} value={entry.slug}>{entry.name}</option>)}
          </select>
        </label>
        <label>Search
          <input onChange={(event) => setQuery(event.target.value)} placeholder="a name, a licence, a word in the effect" type="search" value={query} />
        </label>
        <span className="spellbook-count">{visible.length} of {spells.length}</span>
      </div>

      {grouped.length ? grouped.map(({ pillar: entry, spells: list }) => (
        <section className="play-law spellbook-pillar" id={entry.slug} key={entry.slug}>
          <h2><Link href={`/codex/bible/${entry.slug}`}>{entry.name}</Link> <small>{entry.licences.join(" · ")}</small></h2>
          <p className="play-lede">{entry.tagline} <b>Licensed by:</b> {entry.holder} <b>How it fails:</b> {entry.failure}</p>
          <div className="ability-grid is-wide">
            {list.map((spell) => {
              const via = unlocks[spell.id] ?? [];
              return (
                <div className="spellbook-entry" id={spell.id} key={spell.id}>
                  <AbilityCardView
                    card={spell.card}
                    eyebrow={`${spell.licence} · ${spell.tier} · ${spell.cast === "Instant" ? "Instant" : spell.castTime}${spell.damageType ? ` · ${spell.damageType}` : ""}`}
                    flavor={spell.flavor}
                    icon={icons[spell.id] ?? null}
                    name={spell.name}
                  >
                    <p className="spellbook-overcharge"><b>Pushed:</b> {spell.overcharge}</p>
                    {via.length ? (
                      <p className="spellbook-via">
                        <b>Opened by:</b>{" "}
                        {via.map((unlock, index) => (
                          <span key={`${unlock.classSlug}/${unlock.nodeId}`}>
                            {index ? " · " : ""}
                            <Link href={`/codex/classes/${unlock.classSlug}#${unlock.nodeId}`}>{unlock.className} — {unlock.nodeName}</Link>
                            {unlock.choice ? " (one of a choice)" : ""}
                          </span>
                        ))}
                      </p>
                    ) : (
                      <p className="spellbook-via is-licence-only"><b>Opened by:</b> a licence alone — no tree reaches it yet.</p>
                    )}
                  </AbilityCardView>
                </div>
              );
            })}
          </div>
          <p className="spellbook-counter"><b>Counterplay:</b> {entry.counterplay}</p>
        </section>
      )) : <p className="spellbook-empty">Nothing matches. Loosen a filter.</p>}
    </div>
  );
}
