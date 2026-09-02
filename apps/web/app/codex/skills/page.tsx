import Link from "next/link";
import { AbilityCardView } from "@/components/ability-card";
import { requireRole } from "@/lib/authorization";
import { listCodexArt } from "@/lib/codex-art";
import { codexArtSized } from "@/lib/codex-art-derivative";
import { skillRanks, skillsByCategory } from "@/lib/skills";
import { storyReadRole } from "@/lib/story-codex";
import { talentClasses } from "@/lib/talent-trees";
import "../play.css";
import "./skills.css";

export const metadata = { title: "Skills | Story Codex" };

const rankHow: Record<string, string> = { Practised: "self-taught, at Practised", Expert: "any competent teacher, at Expert", Ceiling: "one person only, at Ceiling" };

/**
 * Twenty skills, five ranks, sixty techniques — laid out the way a player
 * reads a skill tree: the ladder once, then each skill as a header over its
 * three technique cards, the capstone naming the one person who teaches it.
 * Canon lives on /codex/bible/skills; this is the same roster with cards.
 */
export default async function SkillsPage() {
  await requireRole(storyReadRole);
  // Plates show at 96px; 320 covers a retina screen.
  const art = new Map([...listCodexArt("skills")].map(([slug, url]) => [slug, codexArtSized(url, 320)]));
  const groups = skillsByCategory();
  const nodeName = (key: string) => {
    const [classSlug, nodeId] = key.split("/");
    const tree = talentClasses.find((entry) => entry.slug === classSlug);
    const node = tree?.branches.flatMap((branch) => branch.nodes).find((entry) => entry.id === nodeId);
    return tree && node ? `${tree.name} — ${node.name}` : key;
  };
  return (
    <section className="page-shell codex-shell play-shell skills-shell">
      <header className="play-hero">
        <p className="eyebrow">Character progression</p>
        <h1>Skills</h1>
        <p><b>20 skills · 5 ranks · 60 techniques.</b> Skills rise by use under pressure — a reload while being shot at counts, a reload on the range does not. Every skill has three techniques: the first comes with practice, the second from any competent teacher, and the third only from one named person, who never wants money. <b>Backgrounds give a head start, never a lock: anyone can learn anything.</b></p>
      </header>

      <div className="play-gamer">
        <b>In gamer terms</b>
        <span>Use-based skills, Valheim style. Rank up by doing the thing when it matters. Each skill unlocks three moves at Practised, Expert and Ceiling; the Ceiling move needs a trainer NPC and costs a favour. Many techniques are the same move a talent tree sells — the card says which node, and the numbers agree.</span>
      </div>

      <section className="play-law">
        <h2>The ladder</h2>
        <div className="skills-ladder">
          {skillRanks.map((step, index) => (
            <div className={`skills-rank${step.rank === "Ceiling" ? " is-ceiling" : ""}`} key={step.rank}>
              <i>{index}</i>
              <b>{step.rank}</b>
              <span>{step.how}</span>
              <small>{step.grants}</small>
            </div>
          ))}
        </div>
      </section>

      <div className="play-jump">
        {groups.map((group) => <a href={`#${group.category.toLowerCase()}`} key={group.category}>{group.category}</a>)}
        <Link href="/codex/bible/skills">Skills (canon)</Link>
        <Link href="/codex/talents">Talent calculator</Link>
      </div>

      {groups.map((group) => (
        <section className="skills-category" id={group.category.toLowerCase()} key={group.category}>
          <h2>{group.category}</h2>
          {group.skills.map((skill) => {
            const plate = art.get(skill.slug) ?? null;
            return (
              <article className="play-law skills-skill" id={skill.slug} key={skill.slug}>
                <header className="skills-skill-head">
                  {plate
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img alt="" className="skills-plate" src={plate} />
                    : <span className="skills-plate is-slot"><code>skills/{skill.slug}.png</code></span>}
                  <div>
                    <p className="eyebrow">{group.category} · {skill.attribute}</p>
                    <h3>{skill.name}</h3>
                    <p>{skill.summary}</p>
                  </div>
                </header>
                <div className="skills-techniques">
                  {skill.techniques.map((technique) => (
                    <AbilityCardView
                      card={technique.card}
                      eyebrow={`${technique.rank} · ${rankHow[technique.rank]}`}
                      flavor={technique.flavor}
                      key={technique.name}
                      name={technique.name}
                    >
                      {technique.teacher ? (
                        <p className="skills-teacher">
                          <b>Teacher:</b>{" "}
                          {technique.teacher.slug
                            ? <Link href={`/codex/bible/${technique.teacher.slug}`}>{technique.teacher.text}</Link>
                            : <span>{technique.teacher.text} — not yet written</span>}
                        </p>
                      ) : null}
                      {technique.talentNode ? (
                        <p className="skills-node"><b>Also a talent:</b> <Link href={`/codex/classes/${technique.talentNode.split("/")[0]}#${technique.talentNode.split("/")[1]}`}>{nodeName(technique.talentNode)}</Link></p>
                      ) : null}
                    </AbilityCardView>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      ))}

      <p className="play-artslot">skill plates — Sol · <code>private/codex-art/skills/&lt;skill-slug&gt;.png</code> · picked up on reload</p>
    </section>
  );
}
