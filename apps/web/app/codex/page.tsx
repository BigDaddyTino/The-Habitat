import Link from "next/link";
import { ArrowRight, BookOpen, Cog, GitBranch, History, Map, MapPinned, Shield, Sparkles, UsersRound } from "lucide-react";
import { canonicalStoryEntryRouteSlug } from "@habitat/shared";
import { requireRole } from "@/lib/authorization";
import { getStoryActivity, listStoryArcs, listStoryEntries, storyReadRole } from "@/lib/story-codex";
import { StoryLiveSync } from "@/components/story-live-sync";
import { StoryWarden } from "@/components/story-warden";
import { isStoryAssistantAvailable } from "@/lib/story-assistant-service";
import { getSystemArt, systemArtSlot } from "@/lib/system-art";

export const metadata = { title: "Story Codex" };

const themeArt: Record<string, string> = {
  "something-under-the-war": "/images/codex-theme-something-under-war.jpg",
  "the-cost-of-borrowed-power": "/images/codex-theme-borrowed-power.jpg",
  "the-harvest-economy": "/images/codex-theme-harvest-economy.jpg",
};

function auditStamp(value: Date) {
  return value.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/**
 * The color language of the audit log: green for what arrived, yellow for
 * what changed, red for what left. With the approval ladder gone, this list
 * is how the crew keeps each other honest.
 */
function auditTone(action: string, statusTo: string | null): { label: string; tone: "added" | "edited" | "removed" | "linked" } {
  if (action === "CREATED") return { label: "added", tone: "added" };
  if (action === "UPDATED") return { label: "edited", tone: "edited" };
  if (action === "DELETED") return { label: "removed", tone: "removed" };
  if (action === "LINKED") return { label: "linked", tone: "linked" };
  if (action === "UNLINKED") return { label: "unlinked", tone: "linked" };
  if (action === "STATUS_CHANGED") {
    if (statusTo === "CANON") return { label: "made canon", tone: "added" };
    if (statusTo === "ARCHIVED") return { label: "archived", tone: "removed" };
    if (statusTo === "REJECTED") return { label: "rejected", tone: "removed" };
    return { label: "status changed", tone: "edited" };
  }
  return { label: action.toLowerCase().replace(/_/g, " "), tone: "edited" };
}

export default async function CodexPage() {
  await requireRole(storyReadRole);
  // Story lives at /codex/stories now — the arcs, the create form, the room
  // law, and the links between them. This page keeps the world compass, the
  // libraries, and the audit log, and hands story off through card 5.
  const [arcs, activity, regions, themes, characters, factions, systems] = await Promise.all([
    listStoryArcs(), getStoryActivity(50),
    listStoryEntries({ kind: "REGION" }), listStoryEntries({ kind: "THEME" }),
    listStoryEntries({ kind: "CHARACTER" }), listStoryEntries({ kind: "FACTION" }), listStoryEntries({ kind: "SYSTEM" }),
  ]);
  // The core system spotlight: the mechanic big enough to headline the codex.
  // Swap the slug to feature a different system; everything else follows it.
  const spotlightSlug = "the-veil";
  const spotlight = systems.find((system) => system.slug === spotlightSlug) ?? null;
  const spotlightArt = spotlight ? getSystemArt(spotlight.slug) : null;
  const spotlightChildren = systems
    .filter((system) => {
      const meta = system.meta as Record<string, unknown> | null;
      return typeof meta === "object" && meta !== null && (meta as Record<string, unknown>).parent === spotlightSlug;
    })
    .sort((a, b) => a.title.localeCompare(b.title));
  return (
    <section className="page-shell codex-shell codex-landing-shell">
      <StoryLiveSync />
      <div className="codex-landing-hero">
        <div className="page-intro">
        <p className="eyebrow">Martino — the story compass</p>
        <h1>A war over magic.<br /><em>Something beneath it.</em></h1>
        <p>MARTINO is a dark near-future fantasy about a war fueled by harvested magic. Borrowed power saves lives and corrupts the people who wield it, while something older and more patient moves beneath a conflict neither army truly understands.</p>
        </div>
        <p className="codex-hero-caption"><span>What every writer protects</span><strong>Power has a price. The war is not the whole story.</strong></p>
      </div>

      <section className="codex-story-compass">
        <div className="codex-compass-heading"><div><p className="eyebrow"><Sparkles aria-hidden="true" size={12} /> Start here</p><h2>The game in three truths</h2></div><p>Every character, place, faction, and quest should pull on at least one of these. Open a truth to read the full canon before you build.</p></div>
        <div className="codex-theme-grid">
          {themes.map((theme, index) => <Link href={`/codex/bible/${canonicalStoryEntryRouteSlug(theme.slug)}`} key={theme.id}><div aria-hidden="true" className="codex-theme-art" style={{ backgroundImage: `url('${themeArt[theme.slug] ?? "/images/story-codex-archive.webp"}')` }} /><div className="codex-theme-copy"><span>0{index + 1}</span><div><p className="eyebrow">Core theme</p><h3>{theme.title}</h3><p>{theme.summary}</p><strong>Read the canon <ArrowRight aria-hidden="true" size={12} /></strong></div></div></Link>)}
        </div>
      </section>

      {spotlight ? (
        <section className="codex-system-spotlight">
          <div aria-hidden="true" className={`codex-spotlight-art${spotlightArt ? "" : " is-slot"}`} style={spotlightArt ? { backgroundImage: `url("${spotlightArt}")` } : undefined}>
            {!spotlightArt ? <span className="codex-spotlight-slot"><Cog aria-hidden="true" size={26} /><i>Key art slot</i><code>{systemArtSlot(spotlight.slug)}</code></span> : null}
          </div>
          <div className="codex-spotlight-copy">
            <p className="eyebrow"><Sparkles aria-hidden="true" size={12} /> Core system spotlight</p>
            <h2>{spotlight.title}</h2>
            <p className="codex-spotlight-summary">{spotlight.summary}</p>
            <blockquote>Everything beyond the Veil is an opportunity. Everything you carry through it is a wager.</blockquote>
            {spotlightChildren.length ? <p className="codex-spotlight-children">
              {spotlightChildren.map((child) => <Link href={`/codex/bible/${canonicalStoryEntryRouteSlug(child.slug)}`} key={child.id}>{child.title}</Link>)}
            </p> : null}
            <Link className="primary-link" href={`/codex/bible/${canonicalStoryEntryRouteSlug(spotlight.slug)}`}>Open the system <ArrowRight aria-hidden="true" size={14} /></Link>
          </div>
        </section>
      ) : null}

      <section className="codex-world-libraries">
        <div className="section-heading"><div><p className="eyebrow">Build the world</p><h2>Choose what you want to shape</h2></div><p>No JSON. Open a visual library, create an entry, and fill out its connected sheet.</p></div>
        <div>
          <Link className="library-card-characters" href="/codex/library/characters"><UsersRound aria-hidden="true" /><span><small>{characters.length} characters</small><strong>Characters</strong><p>Voice, relationships, factions, quests, and game models.</p></span><ArrowRight aria-hidden="true" /></Link>
          <Link className="library-card-factions" href="/codex/library/factions"><Shield aria-hidden="true" /><span><small>{factions.length} factions</small><strong>Factions</strong><p>Leadership, territory, goals, allies, enemies, and influence.</p></span><ArrowRight aria-hidden="true" /></Link>
          <Link className="library-card-regions" href="/codex/library/regions"><Map aria-hidden="true" /><span><small>{regions.length} regions</small><strong>Regions</strong><p>World hierarchy, control, travel connections, and game tags.</p></span><ArrowRight aria-hidden="true" /></Link>
          <Link className="library-card-atlas" href="/codex/map"><MapPinned aria-hidden="true" /><span><small>Living world map</small><strong>World Atlas</strong><p>Explore biomes, cities, POIs, factions, and quest locations on the interactive Codex map.</p></span><ArrowRight aria-hidden="true" /></Link>
          <Link className="library-card-systems" href="/codex/library/systems"><Cog aria-hidden="true" /><span><small>{systems.length} systems</small><strong>Game systems</strong><p>The mechanics the game will ship, and when the story hands each one to the player.</p></span><ArrowRight aria-hidden="true" /></Link>
          <Link className="library-card-stories" href="/codex/stories"><GitBranch aria-hidden="true" /><span><small>{arcs.length} stories</small><strong>Stories &amp; quests</strong><p>The campaign, side quests, contracts, companion roads, and everything that comes through.</p></span><ArrowRight aria-hidden="true" /></Link>
        </div>
      </section>

      <div className="codex-quicklinks">
        <Link className="codex-quicklink" href="/codex/bible"><BookOpen aria-hidden="true" size={18} /><span><strong>All lore</strong><small>Creatures, items, events, rules, flags, and every world entry in one searchable archive.</small></span></Link>
        <Link className="codex-quicklink" href="/codex/timeline"><History aria-hidden="true" size={18} /><span><strong>The timeline</strong><small>Ten thousand years of the long hunt on one golden line — and where the present sits on it.</small></span></Link>
        <Link className="codex-quicklink" href="/codex/stories"><GitBranch aria-hidden="true" size={18} /><span><strong>Stories &amp; quests</strong><small>Canon, story threads, promises, and the road between them — all in one room.</small></span></Link>
      </div>

      <div className="codex-audit">
        <div className="section-heading"><h2>The audit log</h2></div>
        <p className="codex-audit-intro">Everything anyone changed, newest first. <span className="audit-chip tone-added">added</span> <span className="audit-chip tone-edited">edited</span> <span className="audit-chip tone-removed">removed</span> <span className="audit-chip tone-linked">linked</span></p>
        {activity.length === 0 ? <p className="story-inspector-hint">Nothing has been written yet.</p> : (
          <ul className="codex-audit-list">
            {activity.map((entry) => {
              const { label, tone } = auditTone(entry.action, entry.statusTo);
              return (
                <li key={entry.id}>
                  <time>{auditStamp(entry.createdAt)}</time>
                  <span className={`audit-chip tone-${tone}`}>{label}</span>
                  <p><strong>{entry.actor}</strong> {entry.summary.toLowerCase()}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <StoryWarden arcId={null} available={isStoryAssistantAvailable()} nodeId={null} />
    </section>
  );
}
