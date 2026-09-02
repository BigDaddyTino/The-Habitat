import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Compass, GitBranch, Inbox, Undo2, Waves } from "lucide-react";
import { canonicalStoryEntryRouteSlug, storyArcCategories, storyArcCategoryLabels, storyCanonPacketTargetLabels, storyEntrySlugAliases, type StoryArcCategory } from "@habitat/shared";
import { requireRole } from "@/lib/authorization";
import { getCanonInbox, getCanonNavigator, getStoryRipples, listStoryArcs, listStoryEntries, storyReadRole, type StoryCanonPacketRow } from "@/lib/story-codex";
import { isStoryAssistantAvailable } from "@/lib/story-assistant-service";
import { StoryLiveSync } from "@/components/story-live-sync";
import { StoryWarden } from "@/components/story-warden";
import { CanonNavigator } from "@/components/canon-navigator";
import { RippleOverview } from "@/components/story-ripples";
import { StoryProse } from "@/components/story-prose";
import { markCanonPacketWoven, withdrawCanonPacket } from "@/app/codex/actions";

export const metadata = { title: "Canon | Story Codex" };

/**
 * The canon workspace: the navigator down the left, every story board filed
 * under the section it belongs to on the right, the inbox of settled material
 * waiting to be woven in, and the web of everything one quest does that
 * another quest can see.
 *
 * Nothing on this page freezes anything. The padlock on a board is still the
 * only thing that settles story — this is where a writer finds the board.
 */
export default async function CanonWorkspacePage({ searchParams }: { searchParams: Promise<{ target?: string }> }) {
  await requireRole(storyReadRole);
  const [{ target }, nav, inbox, arcs, web, allEntries] = await Promise.all([
    searchParams,
    getCanonNavigator(),
    getCanonInbox(),
    listStoryArcs(),
    getStoryRipples(),
    listStoryEntries({}),
  ]);

  const titleOf = new Map(allEntries.flatMap((entry) => storyEntrySlugAliases(entry.slug).map((alias) => [alias, entry.title] as const)));
  const arcTitleOf = new Map(arcs.map((arc) => [arc.slug, arc.title]));

  // The bubbles in the navigator deep-link here with a filter. Anything the
  // filter does not recognise shows the whole inbox rather than an empty page.
  const matchesTarget = (packet: StoryCanonPacketRow) => {
    if (!target) return true;
    if (target === "campaign" || target === "incursions" || target === "events") return packet.targetKind === target;
    if (target === "companions") return packet.targetKind === "companions";
    if (target === "factions") return packet.targetKind === "factions";
    if (target.startsWith("region:")) return packet.targetKind === "region" && packet.targetRegion === target.slice(7);
    if (target.startsWith("companion:")) return packet.targetKind === "companions" && packet.targetCompanion === target.slice(10);
    if (target.startsWith("faction:")) return packet.targetKind === "factions" && packet.targetFaction === target.slice(8);
    return true;
  };

  const pending = inbox.packets.filter((packet) => packet.status === "pending" && matchesTarget(packet));
  const woven = inbox.packets.filter((packet) => packet.status === "woven" && matchesTarget(packet));
  const filtered = Boolean(target) && pending.length + woven.length !== inbox.packets.length;

  const destinationOf = (packet: StoryCanonPacketRow) =>
    packet.targetKind === "region" && packet.targetRegion
      ? (titleOf.get(packet.targetRegion) ?? packet.targetRegion.replaceAll("-", " "))
      : packet.targetKind === "companions" && packet.targetCompanion
        ? (titleOf.get(packet.targetCompanion) ?? packet.targetCompanion.replaceAll("-", " "))
        : packet.targetKind === "factions" && packet.targetFaction
          ? (titleOf.get(packet.targetFaction) ?? packet.targetFaction.replaceAll("-", " "))
          : storyCanonPacketTargetLabels[packet.targetKind];

  // Every section of the right-hand column, in the same order as the navigator
  // — so scrolling the boards and scanning the sidebar are the same journey.
  const sections: Array<{ category: StoryArcCategory; title: string; empty: string }> = [
    { category: "MAINLINE", title: "The campaign", empty: "The spine has not been written yet. Open the first chapter →" },
    { category: "SIDE_QUEST", title: "Side quests", empty: "No side quests yet. Write one the party can stumble into →" },
    { category: "CONTRACT", title: "Contracts", empty: "No contracts posted yet. Post the first bounty →" },
    { category: "COMPANION_QUEST", title: "Companion quests", empty: "No companion has their own story yet. Give one to a companion →" },
    { category: "FACTION_QUEST", title: "Faction quests", empty: "No power runs its own operation yet. Fly the first banner →" },
    { category: "INCURSION", title: "Incursions", empty: "Nothing has come through yet. Open the first incursion →" },
    { category: "WORLD_EVENT", title: "World events", empty: "Nothing happens to the world on its own yet. Write the first one →" },
  ];
  const known = new Set(storyArcCategories);
  const sectionRows = sections
    .filter((section) => known.has(section.category))
    .map((section) => ({ ...section, arcs: arcs.filter((arc) => arc.category === section.category) }));
  const writtenSections = sectionRows.filter((section) => section.arcs.length > 0);
  const openSections = sectionRows.filter((section) => section.arcs.length === 0);

  return (
    <section className="page-shell codex-shell codex-canon-shell">
      <StoryLiveSync />
      <div className="page-intro">
        <Link className="codex-back" href="/codex/stories"><ArrowLeft aria-hidden="true" size={13} /> Stories &amp; quests</Link>
        <p className="eyebrow"><Compass aria-hidden="true" size={12} /> Martino — canon</p>
        <h1>The settled story, end to end</h1>
        <p>Open any board from the navigator. A board with a padlock is finished — an admin lifts the lock before anything on it changes.</p>
      </div>

      <div className="canon-workspace">
        <CanonNavigator nav={nav} />

        <div className="canon-workspace-main">
          {writtenSections.map((section) => (
            <div className="codex-section" key={section.category}>
              <div className="section-heading"><h2>{section.category === "MAINLINE" ? <Link className="canon-section-overview-link" href="/codex/stories/campaign">{section.title}<ArrowRight aria-hidden="true" size={16} /></Link> : section.title}</h2></div>
              <div className="codex-arc-grid">
                {section.arcs.map((arc) => (
                  <Link className={`codex-arc-card status-${arc.status.toLowerCase()}${arc.locked ? " is-locked" : ""}`} href={`/codex/arc/${arc.slug}`} key={arc.id}>
                    <p className="eyebrow">{arc.locked ? "Settled" : storyArcCategoryLabels[arc.category]}</p>
                    <h3>{arc.title}</h3>
                    {arc.summary ? <p className="codex-arc-summary">{arc.summary}</p> : null}
                    <footer><span>{arc.nodeCount} scene{arc.nodeCount === 1 ? "" : "s"}</span><span>by {arc.author}</span><span className="codex-arc-open">Read the story →</span></footer>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {openSections.length > 0 ? (
            <div className="codex-section canon-open-roads">
              <div className="section-heading"><h2>Open roads</h2></div>
              <p className="canon-inbox-intro">These parts of the story have room for their first board. Pick one and the new-story form will already be waiting.</p>
              <div className="canon-open-road-grid">
                {openSections.map((section) => (
                  <Link href="/codex/stories#open-a-story" key={section.category}>
                    <GitBranch aria-hidden="true" size={18} />
                    <span><strong>{section.title}</strong><small>{section.empty.replace(/\s*→$/, "")}</small></span>
                    <ArrowRight aria-hidden="true" size={13} />
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div className="codex-section canon-inbox" id="canon-inbox">
            <div className="section-heading"><h2><Inbox aria-hidden="true" size={19} /> The canon inbox</h2></div>
            <p className="canon-inbox-intro">
              Settled pieces of story threads, waiting for somebody to build them into a board. Reading one does not change
              anything; weaving it in is you saying you have done that.
              {filtered ? <> Showing what is waiting for <strong>{target?.replace(/^(region|companion):/, "").replaceAll("-", " ") || "this section"}</strong>. <Link href="/codex/stories/canon#canon-inbox">Show everything</Link>.</> : null}
            </p>

            {pending.length === 0 ? (
              <div className="empty-data"><Inbox aria-hidden="true" size={22} /><div>
                <h2>Nothing is waiting to be woven in.</h2>
                <p>When part of a thread stops being an argument, <Link href="/codex/threads">open that thread</Link> and send that part here.</p>
              </div></div>
            ) : (
              <ul className="canon-packet-cards">
                {pending.map((packet) => (
                  <li key={packet.id}>
                    <header>
                      <p className="eyebrow">For {destinationOf(packet)}</p>
                      <h3>{packet.title}</h3>
                      <p className="canon-packet-source">
                        out of <Link href={`/codex/bible/${packet.thread.slug}`}>{packet.thread.title}</Link>, sent by {packet.pushedBy}
                      </p>
                    </header>

                    <div className="canon-packet-body"><StoryProse body={packet.body} resolve={(slug) => (titleOf.has(slug) ? { href: `/codex/bible/${canonicalStoryEntryRouteSlug(slug)}`, title: titleOf.get(slug) as string } : null)} /></div>

                    {packet.entries.length > 0 ? (
                      <p className="canon-packet-touches">
                        {packet.entries.map((slug) => <Link href={`/codex/bible/${canonicalStoryEntryRouteSlug(slug)}`} key={slug}>{titleOf.get(slug) ?? slug.replaceAll("-", " ")}</Link>)}
                      </p>
                    ) : null}

                    <div className="canon-packet-actions">
                      <form action={markCanonPacketWoven}>
                        <input name="entryId" type="hidden" value={packet.thread.entryId} />
                        <input name="version" type="hidden" value={packet.thread.version} />
                        <input name="packetId" type="hidden" value={packet.id} />
                        <label>Which story boards did this become?<select multiple name="wovenInto" size={4}>
                          {arcs.map((arc) => <option key={arc.slug} value={arc.slug}>{arc.title}</option>)}
                        </select></label>
                        <button className="save-server" type="submit"><Check aria-hidden="true" size={13} /> I wove this in</button>
                      </form>
                      <form action={withdrawCanonPacket}>
                        <input name="entryId" type="hidden" value={packet.thread.entryId} />
                        <input name="version" type="hidden" value={packet.thread.version} />
                        <input name="packetId" type="hidden" value={packet.id} />
                        <button className="icon-action reject" type="submit"><Undo2 aria-hidden="true" size={13} /> Send it back</button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {woven.length > 0 ? (
              <div className="canon-inbox-history">
                <p className="eyebrow">Already woven in</p>
                <ul>
                  {woven.map((packet) => (
                    <li key={packet.id}>
                      <strong>{packet.title}</strong>
                      <span>from <Link href={`/codex/bible/${packet.thread.slug}`}>{packet.thread.title}</Link>{packet.wovenBy ? `, by ${packet.wovenBy}` : ""}</span>
                      {packet.wovenInto.length > 0 ? (
                        <span>became {packet.wovenInto.map((slug) => <Link href={`/codex/arc/${slug}`} key={slug}>{arcTitleOf.get(slug) ?? slug.replaceAll("-", " ")}</Link>)}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="codex-section" id="connections">
            <div className="section-heading"><h2><Waves aria-hidden="true" size={19} /> How the quests touch each other</h2></div>
            <p className="canon-inbox-intro">
              Every crossing the story makes, in the order the campaign meets them. Nobody maintains this — it is read off
              the boards themselves. Amber rows are written down but not built yet.
            </p>
            <RippleOverview web={web} />
          </div>
        </div>
      </div>

      <StoryWarden arcId={null} available={isStoryAssistantAvailable()} guide nodeId={null} />
    </section>
  );
}
