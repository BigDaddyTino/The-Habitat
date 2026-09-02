import Link from "next/link";
import { notFound } from "next/navigation";
import { AbilityCardView } from "@/components/ability-card";
import { requireRole } from "@/lib/authorization";
import { findCodexArt, listCodexArt } from "@/lib/codex-art";
import { affinityLabel, getClassDossier, weaponFamilies } from "@/lib/class-dossiers";
import { skills } from "@/lib/skills";
import { spellsForClass } from "@/lib/spell-unlocks";
import { storyReadRole } from "@/lib/story-codex";
import { cardForCorruptedPhase, cardForNode } from "@/lib/talent-cards";
import { trainerSlugs } from "@/lib/talent-trainers";
import { getTalentClass, talentClasses } from "@/lib/talent-trees";
import "../../play.css";
import "../classes.css";

export function generateStaticParams() {
  return talentClasses.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getTalentClass(slug);
  return { title: entry ? `${entry.name} — Class Guide | Story Codex` : "Class | Story Codex" };
}

/**
 * One class, laid out like a job guide: the title card, what it is at a
 * glance, how it plays, then every node of the tree as an ability card
 * grouped by branch (the same cards the calculator's hover shows), the
 * spells its tree reaches, the techniques it shares with the skill list,
 * the people who open its capstones, and the corrupted branch. Every
 * number comes from the same data the calculator runs on.
 */
export default async function ClassGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  await requireRole(storyReadRole);
  const { slug } = await params;
  const entry = getTalentClass(slug);
  const dossier = getClassDossier(slug);
  if (!entry || !dossier) notFound();

  const keyArt = findCodexArt("classes", entry.slug);
  const constellation = findCodexArt("talents", entry.slug);
  const heroArt = keyArt ?? constellation;
  const icons = listCodexArt("talent-icons");
  const [core, ...branches] = [...entry.branches].sort((a, b) => (b.core ? 1 : 0) - (a.core ? 1 : 0));
  const allNodes = entry.branches.flatMap((branch) => branch.nodes);

  const ceilings = entry.branches.flatMap((branch) => branch.nodes.filter((node) => node.ceiling).map((node) => ({ branch: branch.name, node })));
  const reachableSpells = spellsForClass(entry.slug);
  const totalNodes = allNodes.length;
  const totalPoints = allNodes.reduce((sum, node) => sum + node.cost, 0);
  const growth = entry.growth.replace(" per level", "").split(" / ");
  const kinds = allNodes.reduce<Record<string, number>>((tally, node) => {
    const kind = cardForNode(entry.slug, node.id)?.kind ?? "Passive";
    tally[kind] = (tally[kind] ?? 0) + 1;
    return tally;
  }, {});
  const sharedTechniques = skills.flatMap((skill) => skill.techniques.filter((technique) => technique.talentNode?.startsWith(`${entry.slug}/`)).map((technique) => ({ skill, technique })));
  const primaryWeapons = weaponFamilies.filter((family) => dossier.weapons[family] === 3);

  return (
    <section className="page-shell codex-shell play-shell cls-shell">
      <Link className="cls-back" href="/codex/classes">← All classes</Link>

      <header className="cls-title">
        <div className="cls-title-copy">
          <p className="eyebrow">Class guide · {entry.constellation}</p>
          <h1>{entry.name}</h1>
          <p className="cls-archetype">{entry.archetype}</p>
          <p className="cls-pitch">{dossier.pitch}</p>
          <div className="cls-stats">
            {growth.map((line) => <span key={line}><b>growth</b>{line}</span>)}
            <span><b>nodes</b>{totalNodes}</span>
            <span><b>points to own all</b>{totalPoints} of 144</span>
            <span><b>spells</b>{reachableSpells.length}</span>
            <span><b>capstones</b>{ceilings.length}</span>
          </div>
        </div>
        <div className={`cls-title-art${keyArt ? "" : " is-constellation"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
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
        <Link className="is-quiet" href="/codex/character">Your character</Link>
        <Link className="is-quiet" href="/codex/spells">Spellbook</Link>
        <Link className="is-quiet" href="/codex/skills">Skills</Link>
        <Link className="is-quiet" href="/codex/bible/kit">Kit &amp; weapon families</Link>
      </div>

      <div className="play-jump">
        <a href="#glance">At a glance</a><a href="#builds">Builds</a><a href="#tree">The tree</a><a href="#spells">Spells</a><a href="#techniques">Techniques</a><a href="#teachers">Teachers</a><a href="#corrupted">Corrupted branch</a>
      </div>

      {/* --------------------------------------------------------- glance */}
      <section className="play-law" id="glance">
        <h2>At a glance</h2>
        <dl className="cls-glance">
          <dt>Role</dt><dd>{entry.archetype}</dd>
          <dt>Growth</dt><dd>{entry.growth}</dd>
          <dt>Primary weapons</dt><dd>{primaryWeapons.length ? primaryWeapons.join(", ") : "None — the pool is the weapon"}</dd>
          <dt>The tree</dt><dd>{entry.branches.length - 1} branches around a core of {core!.nodes.length}: {Object.entries(kinds).map(([kind, count]) => `${count} ${kind.toLowerCase()}`).join(" · ")}</dd>
          <dt>Choice nodes</dt><dd>{allNodes.filter((node) => node.fork).length / 2} pair{allNodes.filter((node) => node.fork).length === 2 ? "" : "s"} — taking one locks the other for good</dd>
          <dt>Capstones</dt><dd>{ceilings.length}, each opened by a person, never by points alone</dd>
          <dt>Spells reachable</dt><dd>{reachableSpells.length} of the 108, through {allNodes.filter((node) => node.spell).length} nodes</dd>
        </dl>
        <p className="cls-lede"><b>Weapon usage.</b> {dossier.weaponNote}</p>
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

      {/* --------------------------------------------------------- builds */}
      <section className="play-law" id="builds">
        <h2>How it plays: signature builds</h2>
        <p className="play-lede">{entry.plays}</p>
        <div className="cls-builds">
          {dossier.builds.map((build) => (
            <div className="cls-build" key={build.name}><b>{build.name}</b><span>{build.line}</span></div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------- tree */}
      <section className="play-law" id="tree">
        <h2>The tree: {entry.constellation}</h2>
        <p className="play-lede">{entry.constellationNote} Nodes open top to bottom in each branch. Every card is what you get and what it costs; the green line is the arithmetic the game applies. <b>Weaves</b> bridge two branches (owning either end opens the other), <b>choice nodes</b> lock their partner forever, <b>capstones</b> open only when a teacher signs.</p>
        <div className="play-legend">
          <span><i className="ability-kind is-kind-passive">Passive</i> always on</span>
          <span><i className="ability-kind is-kind-active">Active</i> has a cooldown</span>
          <span><i className="ability-kind is-kind-spell">Spell unlock</i> opens a licensed spell</span>
          <span><i className="ability-kind is-kind-choice">Choice node</i> locks its partner</span>
          <span><i className="ability-kind is-kind-capstone">Capstone</i> needs a teacher</span>
          <span><i className="ability-kind is-kind-unlock">Unlock</i> opens a system or slot</span>
        </div>
        <div className="cls-guide">
          {[core!, ...branches].map((branch) => (
            <section className={`cls-guide-branch${branch.core ? " is-core" : ""}`} key={branch.name}>
              <h3>{branch.core ? `Core · ${branch.name}` : branch.name} <small>{branch.nodes.reduce((sum, node) => sum + node.cost, 0)} pts to own the branch</small></h3>
              <div className="cls-guide-nodes">
                {branch.nodes.map((node, index) => {
                  const card = cardForNode(entry.slug, node.id);
                  const teacher = node.ceiling ? trainerSlugs[node.ceiling] : undefined;
                  const links = [
                    node.weave ? { label: `Weave ↔ ${allNodes.find((other) => other.id === node.weave)?.name ?? node.weave}`, href: `#${node.weave}`, kind: "weave" } : null,
                    node.fork ? { label: `Locks ${allNodes.find((other) => other.id === node.fork)?.name ?? node.fork}`, href: `#${node.fork}`, kind: "fork" } : null,
                    node.requiresAny ? { label: `Needs ${node.requiresAny.map((id) => allNodes.find((other) => other.id === id)?.name ?? id).join(" or ")}`, href: `#${node.requiresAny[0]}`, kind: "needs" } : null,
                  ].filter((link): link is { label: string; href: string; kind: string } => Boolean(link));
                  return (
                    <div className="cls-guide-node" id={node.id} key={node.id}>
                      <span className="cls-guide-step">{index + 1}</span>
                      {card ? (
                        <AbilityCardView card={card} cost={node.cost} eyebrow={branch.name} flavor={node.desc} icon={icons.get(`${entry.slug}-${node.id}`) ?? null} name={node.name}>
                          {links.length || node.ceiling ? (
                            <p className="cls-guide-links">
                              {node.ceiling ? <span className="is-ceiling">Teacher: {teacher ? <Link href={`/codex/bible/${teacher}`}>{node.ceiling}</Link> : `${node.ceiling} (seat reserved)`}</span> : null}
                              {links.map((link) => <a className={`is-${link.kind}`} href={link.href} key={link.label}>{link.label}</a>)}
                            </p>
                          ) : null}
                        </AbilityCardView>
                      ) : (
                        <div className="ability-card"><b className="ability-name">{node.name}</b><p className="ability-flavor">{node.desc}</p></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- spells */}
      <section className="play-law" id="spells">
        <h2>Spells this tree reaches</h2>
        <p className="play-lede">{reachableSpells.length ? <>The licensed spells a {entry.name} can open through talent nodes. Each links to its full card in the <Link href="/codex/spells">Spellbook</Link>; a licence alone opens the rest, subject to the three-classes rule.</> : <>This class opens no spells through its tree. Licences are still yours to hold — see the <Link href="/codex/spells">Spellbook</Link>.</>}</p>
        {reachableSpells.length ? (
          <div className="cls-spells">
            {reachableSpells.map(({ spell, via }) => (
              <Link className={`cls-spell is-${spell.tier.toLowerCase()}`} href={`/codex/spells#${spell.id}`} key={spell.id}>
                <i>{spell.licence} · {spell.tier}</i>
                <b>{spell.name}</b>
                <span>{spell.card.effect}</span>
                <small>via {via.map((unlock) => unlock.nodeName).join(", ")}{via.some((unlock) => unlock.choice) ? " (one of a choice)" : ""}</small>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      {/* ------------------------------------------------------ techniques */}
      <section className="play-law" id="techniques">
        <h2>Techniques shared with the skill list</h2>
        <p className="play-lede">{sharedTechniques.length ? <>Moves that exist both as a node here and as a technique on the <Link href="/codex/skills">Skills</Link> page — the same numbers either way. A player can reach them by points or by rank.</> : <>No node of this tree doubles as a skill technique.</>}</p>
        {sharedTechniques.length ? (
          <div className="cls-techniques">
            {sharedTechniques.map(({ skill, technique }) => (
              <Link className="cls-technique" href={`/codex/skills#${skill.slug}`} key={`${skill.slug}/${technique.name}`}>
                <i>{skill.name} · {technique.rank}</i>
                <b>{technique.name}</b>
                <span>{technique.card.effect}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      {/* -------------------------------------------------------- teachers */}
      <section className="play-law" id="teachers">
        <h2>Capstones and the people who open them</h2>
        <p className="play-lede">{dossier.teachersNote}</p>
        <div className="cls-teachers">
          {ceilings.map(({ branch, node }) => {
            const teacher = trainerSlugs[node.ceiling!];
            return (
              <div className={`cls-teacher${teacher ? "" : " is-reserved"}`} key={node.id}>
                <b><a href={`#${node.id}`}>{node.name}</a></b>
                <i>{branch} · {node.cost} pts</i>
                <span>{teacher ? <Link href={`/codex/bible/${teacher}`}>{node.ceiling}</Link> : `${node.ceiling} — a seat still reserved`}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------- corrupted */}
      <section className="cls-corrupt" id="corrupted">
        <h2>{entry.corrupted.title}</h2>
        <p>{entry.corrupted.tagline}</p>
        <div className="cls-corrupt-cards">
          {entry.corrupted.nodes.map((node) => {
            const card = cardForCorruptedPhase(entry.slug, node.phase);
            return card ? (
              <AbilityCardView card={card} eyebrow={`Lights at phase ${node.phase}`} flavor={node.desc} icon={icons.get(`${entry.slug}-corrupt-${node.phase}`) ?? null} key={node.name} name={node.name} />
            ) : (
              <div className={`cls-corrupt-node${node.phase >= 7 ? " is-terminal" : ""}`} key={node.name}><i>phase {node.phase}</i><b>{node.name}</b><small>{node.desc}</small></div>
            );
          })}
        </div>
      </section>

      <p className="cls-foot">
        Same data as the calculator: <Link href={`/codex/talents#${entry.slug}|1|0|`}>build this class</Link> · the rules it runs on:{" "}
        <Link href="/codex/bible/attributes">Attributes</Link> · <Link href="/codex/bible/skills">Skills</Link> ·{" "}
        <Link href="/codex/bible/the-corruption-system">Corruption</Link> · <Link href="/codex/bible/combat">Combat</Link> · <Link href="/codex/bible/the-wound-model">The wound model</Link>
        {" "}· icons: <code>private/codex-art/talent-icons/{entry.slug}-&lt;node&gt;.png</code>
      </p>
    </section>
  );
}
