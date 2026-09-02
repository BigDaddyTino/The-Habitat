import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/authorization";
import { findCodexArt } from "@/lib/codex-art";
import { affinityLabel, getClassDossier, weaponFamilies } from "@/lib/class-dossiers";
import { storyReadRole } from "@/lib/story-codex";
import { describeEffects, effectsForNode } from "@/lib/talent-effects";
import { trainerSlugs } from "@/lib/talent-trainers";
import { getTalentClass, talentClasses } from "@/lib/talent-trees";
import "../classes.css";

export function generateStaticParams() {
  return talentClasses.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getTalentClass(slug);
  return { title: entry ? `${entry.name} — Class Dossier | Story Codex` : "Class | Story Codex" };
}

/**
 * One class, opened like a title card: the plate, the pitch, the growth, the
 * weapons it reaches for, its signature builds, the whole skill list with
 * costs and plain mechanic lines, the people who open its ceilings, and the
 * corrupted branch. Every number comes from the same data the calculator
 * runs on.
 */
export default async function ClassDossierPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireRole(storyReadRole);
  const { slug } = await params;
  const entry = getTalentClass(slug);
  const dossier = getClassDossier(slug);
  if (!entry || !dossier) notFound();

  const keyArt = findCodexArt("classes", entry.slug);
  const constellation = findCodexArt("talents", entry.slug);
  const heroArt = keyArt ?? constellation;
  const [core, ...branches] = [...entry.branches].sort((a, b) => (b.core ? 1 : 0) - (a.core ? 1 : 0));

  const ceilings = entry.branches.flatMap((branch) => branch.nodes.filter((node) => node.ceiling).map((node) => ({ branch: branch.name, node })));
  const spells = entry.branches.flatMap((branch) => branch.nodes.filter((node) => node.spell)).length;
  const totalNodes = entry.branches.reduce((sum, branch) => sum + branch.nodes.length, 0);
  const growth = entry.growth.replace(" per level", "").split(" / ");

  return (
    <section className="page-shell codex-shell cls-shell">
      <Link className="cls-back" href="/codex/classes">← All classes</Link>

      <header className="cls-title">
        <div className="cls-title-copy">
          <p className="eyebrow">Class dossier · {entry.constellation}</p>
          <h1>{entry.name}</h1>
          <p className="cls-archetype">{entry.archetype}</p>
          <p className="cls-pitch">{dossier.pitch}</p>
          <div className="cls-stats">
            {growth.map((line) => <span key={line}><b>growth</b>{line}</span>)}
            <span><b>nodes</b>{totalNodes}</span>
            <span><b>spells</b>{spells}</span>
            <span><b>ceilings</b>{ceilings.length}</span>
          </div>
        </div>
        <div className={`cls-title-art${keyArt ? "" : " is-constellation"}`}>
          {heroArt ? <img alt={`${entry.name} — ${keyArt ? "key art" : entry.constellation}`} src={heroArt} /> : null}
          {keyArt ? null : (
            <div className="cls-title-slot">
              <span>key art slot — Sol</span>
              <code>private/codex-art/classes/{entry.slug}.png</code>
              <span>{constellation ? "constellation chart standing in" : "no chart delivered"}</span>
            </div>
          )}
        </div>
      </header>

      <div className="cls-actions">
        <Link href={`/codex/talents#${entry.slug}|1|0|`}>Open in the Talent Calculator</Link>
        <Link className="is-quiet" href="/codex/bible/the-six-pillars">The Six Pillars</Link>
        <Link className="is-quiet" href="/codex/bible/kit">Kit &amp; weapon families</Link>
        <Link className="is-quiet" href="/codex/bible/character-classes">Backgrounds</Link>
        <Link className="is-quiet" href="/codex/bible/cybernetics">Cybernetics</Link>
      </div>

      <section className="cls-law">
        <h2>Weapon usage</h2>
        <p className="cls-lede">{dossier.weaponNote}</p>
        <div className="cls-weapons">
          {weaponFamilies.map((family) => {
            const affinity = dossier.weapons[family];
            return (
              <div className={`cls-weapon is-${affinity}`} key={family}>
                <b>{family}</b>
                <div className="cls-meter" aria-hidden="true"><span /><span /><span /></div>
                <i>{affinityLabel[affinity]}</i>
              </div>
            );
          })}
        </div>
      </section>

      <section className="cls-law">
        <h2>How it plays: signature builds</h2>
        <p className="cls-lede">{entry.plays}</p>
        <div className="cls-builds">
          {dossier.builds.map((build) => (
            <div className="cls-build" key={build.name}><b>{build.name}</b><span>{build.line}</span></div>
          ))}
        </div>
      </section>

      <section className="cls-law">
        <h2>The skill list: {entry.constellation}</h2>
        <p className="cls-lede">{entry.constellationNote} Every node below is what you get and what it costs; the green line is the plain arithmetic the game applies. Weaves bridge branches, forks lock forever, ceilings open only when a teacher signs.</p>
        <div className="cls-tree">
          {[core!, ...branches].map((branch) => (
            <section className={`cls-branch${branch.core ? " is-core" : ""}`} key={branch.name}>
              <h3>{branch.core ? `Core · ${branch.name}` : branch.name}</h3>
              <ul className="cls-nodes">
                {branch.nodes.map((node) => {
                  const effect = effectsForNode(entry.slug, node.id);
                  const lines = effect ? describeEffects(effect) : [];
                  const teacher = node.ceiling ? trainerSlugs[node.ceiling] : undefined;
                  return (
                    <li className="cls-node" key={node.id}>
                      <span className="cls-cost">{node.cost}</span>
                      <b>{node.name}</b>
                      <small>{node.desc}</small>
                      {lines[0] ? <em>{lines[0]}</em> : null}
                      {node.spell || node.ceiling || node.weave || node.fork ? (
                        <span className="cls-chips">
                          {node.spell ? <i className="is-spell">{node.spell}</i> : null}
                          {node.ceiling ? <i className="is-ceiling">ceiling · {teacher ? <Link href={`/codex/bible/${teacher}`}>{node.ceiling}</Link> : node.ceiling}</i> : null}
                          {node.weave ? <i className="is-weave">weave ↔ {node.weave.replaceAll("-", " ")}</i> : null}
                          {node.fork ? <i className="is-fork">fork · locks {node.fork.replaceAll("-", " ")}</i> : null}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </section>

      <section className="cls-law">
        <h2>Ceilings and the people who open them</h2>
        <p className="cls-lede">{dossier.teachersNote}</p>
        <div className="cls-teachers">
          {ceilings.map(({ branch, node }) => {
            const teacher = trainerSlugs[node.ceiling!];
            return (
              <div className={`cls-teacher${teacher ? "" : " is-reserved"}`} key={node.id}>
                <b>{node.name}</b>
                <i>{branch} · {node.cost} pts</i>
                <span>{teacher ? <Link href={`/codex/bible/${teacher}`}>{node.ceiling}</Link> : `${node.ceiling} — a seat still reserved`}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="cls-corrupt">
        <h2>{entry.corrupted.title}</h2>
        <p>{entry.corrupted.tagline}</p>
        <div className="cls-corrupt-row">
          {entry.corrupted.nodes.map((node) => (
            <div className={`cls-corrupt-node${node.phase >= 7 ? " is-terminal" : ""}`} key={node.name}>
              <i>phase {node.phase}</i>
              <b>{node.name}</b>
              <small>{node.desc}</small>
            </div>
          ))}
        </div>
      </section>

      <p className="cls-foot">
        Same data as the calculator: <Link href={`/codex/talents#${entry.slug}|1|0|`}>build this class</Link> · the rules it runs on:{" "}
        <Link href="/codex/bible/attributes">Attributes</Link> · <Link href="/codex/bible/skills">Skills</Link> ·{" "}
        <Link href="/codex/bible/the-corruption-system">Corruption</Link> · <Link href="/codex/bible/combat">Combat</Link>
      </p>
    </section>
  );
}
