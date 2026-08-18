/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, BookOpen, CircleHelp, Compass, Crown, GitBranch, MapPin, Network, Shield, Sparkles, Swords, UserRound } from "lucide-react";
import { storyEntryKindLabels, type StoryEntryKind, type StoryStatus } from "@habitat/shared";
import { modelPreview } from "@/lib/story-library";

type Connection = { slug: string; title: string; kind: StoryEntryKind; relation: string };
type Appearance = { id: string; title: string; via: "referenced" | "speaks"; arc: { slug: string; title: string } };

const record = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
const rows = (value: unknown): Array<Record<string, unknown>> => Array.isArray(value) ? value.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null) : [];
const words = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
const label = (value: unknown) => typeof value === "string" && value.trim() ? value : null;

function Fact({ label: name, value }: { label: string; value: unknown }) {
  const shown = label(value);
  return <div><dt>{name}</dt><dd>{shown ?? "Not decided"}</dd></div>;
}

function LoreLink({ slug, children }: { slug: string; children: React.ReactNode }) {
  return <Link href={`/codex/bible/${slug}`}>{children}<ArrowRight aria-hidden="true" size={11} /></Link>;
}

export function StoryEntityProfile({ entry }: { entry: {
  kind: StoryEntryKind;
  slug: string;
  title: string;
  summary: string | null;
  body: string | null;
  meta: Record<string, unknown> | null;
  status: StoryStatus;
  author: string;
  lastEditor: string | null;
  appearances: Appearance[];
  connections: Connection[];
} }) {
  const meta = record(entry.meta);
  const magic = record(meta.magic);
  const status = record(meta.status);
  const preview = modelPreview(meta.model);
  const isCharacter = entry.kind === "CHARACTER";
  const isFaction = entry.kind === "FACTION";
  const isRegion = entry.kind === "REGION";
  const questions = words(meta.openQuestions);
  const entityLinks: Array<{ slug: string; detail: string }> = [];

  if (isCharacter) {
    for (const row of rows(meta.factions)) if (label(row.faction)) entityLinks.push({ slug: String(row.faction), detail: label(row.role) ?? "Faction membership" });
    for (const row of rows(meta.relationships)) if (label(row.character)) entityLinks.push({ slug: String(row.character), detail: label(row.type) ?? "Character relationship" });
    if (label(meta.home)) entityLinks.push({ slug: String(meta.home), detail: "Home" });
  }
  if (isFaction) {
    for (const leader of words(meta.leaders)) entityLinks.push({ slug: leader, detail: "Leader" });
    for (const row of rows(meta.relations)) if (label(row.faction)) entityLinks.push({ slug: String(row.faction), detail: label(row.stance) ?? "Faction relationship" });
    if (label(meta.seat)) entityLinks.push({ slug: String(meta.seat), detail: "Seat of power" });
  }
  if (isRegion) {
    for (const row of rows(meta.control)) if (label(row.faction)) entityLinks.push({ slug: String(row.faction), detail: `${label(row.kind) ?? "influences"} this place` });
    for (const row of rows(meta.connections)) if (label(row.to)) entityLinks.push({ slug: String(row.to), detail: label(row.by) ?? "Connected region" });
    if (label(meta.parent)) entityLinks.push({ slug: String(meta.parent), detail: "Parent region" });
  }

  return (
    <>
      <header className={`entity-profile-hero entity-profile-${entry.kind.toLowerCase()}`}>
        <div className="entity-profile-art">
          {preview ? <img alt={`${entry.title} selected in-game model`} src={`/model-gallery/${preview.image}`} /> : <div className="entity-profile-placeholder">{isFaction ? <Shield aria-hidden="true" /> : isRegion ? <Compass aria-hidden="true" /> : <UserRound aria-hidden="true" />}<span>{entry.title.slice(0, 1)}</span></div>}
          {preview ? <span>In-game model · {preview.asset}</span> : isCharacter ? <span>No in-game model cast yet</span> : null}
        </div>
        <div className="entity-profile-copy">
          <p className="eyebrow">{storyEntryKindLabels[entry.kind]} dossier · {entry.status === "CANON" ? "Canon" : entry.status}</p>
          <h1>{entry.title}</h1>
          <p className="entity-profile-summary">{entry.summary ?? "This entry still needs its one-line pitch."}</p>
          <p className="entity-profile-byline">Created by {entry.author}{entry.lastEditor && entry.lastEditor !== entry.author ? ` · last shaped by ${entry.lastEditor}` : ""}</p>
        </div>
      </header>

      {(isCharacter || isFaction || isRegion) ? <dl className="entity-fact-ribbon">
        {isCharacter ? <><Fact label="Full name" value={meta.fullName} /><Fact label="Species" value={meta.species} /><Fact label="Pronouns" value={meta.pronouns} /><Fact label="Magic" value={magic.origin} /><Fact label="Known status" value={status.known} /></> : null}
        {isFaction ? <><Fact label="Power" value={meta.scope} /><Fact label="Seat" value={meta.seat} /><Fact label="Game tag" value={meta.gameTag} /><Fact label="Leaders" value={words(meta.leaders).length ? `${words(meta.leaders).length} named` : null} /></> : null}
        {isRegion ? <><Fact label="Place type" value={meta.type} /><Fact label="Biome" value={meta.biome} /><Fact label="Population" value={meta.population} /><Fact label="World state" value={meta.status} /><Fact label="Game tag" value={meta.gameTag} /></> : null}
      </dl> : null}

      <div className="entity-profile-layout">
        <article className="entity-profile-narrative">
          <p className="eyebrow"><BookOpen aria-hidden="true" size={12} /> Writer briefing</p>
          {entry.body ? entry.body.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p className="story-inspector-hint">No briefing has been written yet. Open the editing workspace below and give the next writer a foundation.</p>}
          {isCharacter && label(meta.storyRole) ? <blockquote><Sparkles aria-hidden="true" size={16} /><div><strong>Why this character exists</strong><p>{String(meta.storyRole)}</p></div></blockquote> : null}
          {isFaction && words(meta.goals).length ? <div className="entity-goals"><p className="eyebrow">What they want</p><ul>{words(meta.goals).map((goal) => <li key={goal}><Swords aria-hidden="true" size={12} />{goal}</li>)}</ul></div> : null}
        </article>

        <aside className="entity-connections">
          <section>
            <p className="eyebrow"><GitBranch aria-hidden="true" size={12} /> Story & quest connections</p>
            {entry.appearances.length ? <ul>{entry.appearances.map((node) => <li key={node.id}><Link href={`/codex/arc/${node.arc.slug}`}>{node.title}<ArrowRight aria-hidden="true" size={11} /></Link><span>{node.arc.title}{node.via === "speaks" ? " · dialogue speaker" : " · referenced"}</span></li>)}</ul> : <p className="story-inspector-hint">No written scene touches this yet.</p>}
            {isCharacter ? rows(meta.involvement).map((row) => label(row.arc) ? <div className="planned-connection" key={String(row.arc)}><Link href={`/codex/arc/${row.arc}`}><GitBranch aria-hidden="true" size={12} /> {String(row.arc).replaceAll("-", " ")}</Link>{label(row.how) ? <p>{String(row.how)}</p> : null}<span>Planned involvement</span></div> : null) : null}
          </section>

          <section>
            <p className="eyebrow"><Network aria-hidden="true" size={12} /> World connections</p>
            {entityLinks.length || entry.connections.length ? <ul>
              {entityLinks.map((connection, index) => <li key={`${connection.slug}-${index}`}><LoreLink slug={connection.slug}>{connection.slug.replaceAll("-", " ")}</LoreLink><span>{connection.detail}</span></li>)}
              {entry.connections.map((connection) => <li key={`${connection.slug}-${connection.relation}`}><LoreLink slug={connection.slug}>{connection.title}</LoreLink><span>{connection.relation}</span></li>)}
            </ul> : <p className="story-inspector-hint">Nothing else in the world points here yet.</p>}
          </section>

          {questions.length ? <section className="entity-open-questions"><p className="eyebrow"><CircleHelp aria-hidden="true" size={12} /> Open writing</p><ul>{questions.map((question) => <li key={question}>{question}</li>)}</ul></section> : null}
          {isRegion && label(meta.parent) ? <p className="entity-map-note"><MapPin aria-hidden="true" size={13} /> Nested inside <strong>{String(meta.parent).replaceAll("-", " ")}</strong></p> : null}
          {isFaction && words(meta.leaders).length ? <p className="entity-map-note"><Crown aria-hidden="true" size={13} /> {words(meta.leaders).length} named leader{words(meta.leaders).length === 1 ? "" : "s"}</p> : null}
        </aside>
      </div>
    </>
  );
}
