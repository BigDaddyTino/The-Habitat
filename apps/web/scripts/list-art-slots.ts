import { existsSync } from "node:fs";
import path from "node:path";
import { cardForCorruptedPhase, cardForNode } from "../lib/talent-cards";
import { talentClasses } from "../lib/talent-trees";
import { skills } from "../lib/skills";
import { spells } from "../lib/spellbook";

/**
 * The art brief's list: every icon, plate and backdrop the Play section
 * can wear, with the four lines an artist needs per file (name, type,
 * flavor, effect) and whether the file is already on disk.
 *
 *   npx tsx scripts/list-art-slots.ts            everything
 *   npx tsx scripts/list-art-slots.ts --missing  only what is not delivered
 *   npx tsx scripts/list-art-slots.ts --class bastion
 */
const args = process.argv.slice(2);
const onlyMissing = args.includes("--missing");
const classFilter = args.includes("--class") ? args[args.indexOf("--class") + 1] : null;
const root = path.join(process.cwd(), "private", "codex-art");
const present = (kind: string, slug: string) => ["png", "jpg", "jpeg", "webp"].some((ext) => existsSync(path.join(root, kind, `${slug}.${ext}`)));

type Row = { file: string; name: string; type: string; flavor: string; effect: string; have: boolean };
const rows: Row[] = [];

for (const tree of talentClasses) {
  if (classFilter && tree.slug !== classFilter) continue;
  rows.push({ file: `talent-backdrops/${tree.slug}.png`, name: `${tree.name} backdrop — ${tree.constellation}`, type: "Backdrop 1672x941", flavor: tree.constellationNote, effect: tree.plays, have: present("talent-backdrops", tree.slug) });
  for (const branch of tree.branches) {
    for (const node of branch.nodes) {
      const card = cardForNode(tree.slug, node.id);
      rows.push({ file: `talent-icons/${tree.slug}-${node.id}.png`, name: `${tree.name} · ${branch.name} · ${node.name}`, type: `${card?.kind ?? "Passive"} 256x256`, flavor: node.desc, effect: card?.effect ?? "", have: present("talent-icons", `${tree.slug}-${node.id}`) });
    }
  }
  for (const node of tree.corrupted.nodes) {
    const card = cardForCorruptedPhase(tree.slug, node.phase);
    rows.push({ file: `talent-icons/${tree.slug}-corrupt-${node.phase}.png`, name: `${tree.name} · ${tree.corrupted.title} · ${node.name}`, type: "Corrupted 256x256", flavor: node.desc, effect: card?.effect ?? "", have: present("talent-icons", `${tree.slug}-corrupt-${node.phase}`) });
  }
}
if (!classFilter) {
  for (const skill of skills) {
    rows.push({ file: `skills/${skill.slug}.png`, name: `${skill.name} (${skill.category})`, type: "Skill plate 512x512", flavor: skill.summary, effect: skill.techniques.map((technique) => technique.name).join(" · "), have: present("skills", skill.slug) });
  }
  for (const spell of spells) {
    rows.push({ file: `spells/${spell.id}.png`, name: `${spell.name} (${spell.licence}, ${spell.tier})`, type: `Spell icon 256x256 · ${spell.pillar}`, flavor: spell.flavor, effect: spell.card.effect, have: present("spells", spell.id) });
  }
}

const shown = onlyMissing ? rows.filter((row) => !row.have) : rows;
for (const row of shown) {
  console.log(`${row.have ? "[have]" : "[    ]"} ${row.file}`);
  console.log(`         ${row.name} — ${row.type}`);
  if (row.flavor) console.log(`         flavor: ${row.flavor}`);
  if (row.effect) console.log(`         effect: ${row.effect}`);
}
console.log(`\n${rows.filter((row) => row.have).length} delivered · ${rows.filter((row) => !row.have).length} open · ${rows.length} slots`);
