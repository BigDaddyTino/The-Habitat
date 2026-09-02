import { spells, type Spell } from "./spellbook";
import { talentClasses } from "./talent-trees";

/**
 * Which talent nodes open which of the 108 licensed spells — derived, not
 * hand-kept, so a renamed node or spell fails the test instead of silently
 * orphaning a link. A node with a `spell` chip unlocks the spell of the
 * same name (filtered by the chip's licence class when it names one); the
 * aliases below cover the nodes that open a pair, a choice of classes, or a
 * spell under a different name (First Ward → Seal).
 *
 * `choice: true` marks nodes where the player picks one of the listed
 * classes at buy time (War Licence and its Certified/Master follow-ups).
 */

type Alias = { names: string[]; choice?: boolean };

/** `<class>/<node id>` → the spells it opens, as "Name" or "Name@Licence". */
const aliases: Record<string, Alias> = {
  "bastion/first-ward": { names: ["Seal"] },
  "bastion/quiet-ground": { names: ["Quiet"] },
  "cypherist/shield-pylon": { names: ["Seal"] },
  "conduit/war-licence": { names: ["Ignition", "Warmth", "Freeze the Ground", "Cold Store", "Shove", "Catch", "Correct", "Carry"], choice: true },
  "conduit/field-control": { names: ["Freeze the Ground", "Weight"], choice: true },
  "conduit/certified-strike": { names: ["Flashover", "Brittle", "Arrest", "Curve"], choice: true },
  "conduit/master-of-war": { names: ["Sublimation", "Vitrify", "Return", "Convoy"], choice: true },
  "conduit/healers-licence": { names: ["Close", "Knit"] },
  "conduit/shapers-licence": { names: ["Patch", "Set@Tensile"] },
  "conduit/certified-boundary": { names: ["Brace@Tensile", "Shroud", "Unbind"], choice: true },
  "conduit/empaths-licence": { names: ["Steady", "Read"] },
  "conduit/presence": { names: ["Presence", "Register"] },
  "maverick/snap-cast": { names: ["Ignition", "Warmth"] },
  "maverick/certified-spark": { names: ["Flashover"] },
  "maverick/left-hand-law": { names: ["Sublimation"] },
  "surger/brace": { names: ["Brace@Inertial"] },
};

export type SpellUnlock = {
  spellId: string;
  classSlug: string;
  className: string;
  nodeId: string;
  nodeName: string;
  branch: string;
  cost: number;
  /** The node opens one of several classes; this spell is one option. */
  choice: boolean;
};

function licenceFromChip(chip: string): string | null {
  // "Spell · Containment", "Spell · Regenerative ×2", "Ward-tech · Containment" → the class;
  // "Spell", "Spell · Certified", "Spell · Licensed ×2", "Master spell" → none.
  const match = /·\s*([A-Z][a-z]+)/.exec(chip);
  if (!match) return null;
  const word = match[1];
  return ["Certified", "Licensed", "Master"].includes(word) ? null : word;
}

function findSpells(name: string, licence: string | null): Spell[] {
  const [bare, at] = name.split("@");
  const wanted = (at ?? licence)?.toLowerCase() ?? null;
  const matches = spells.filter((spell) => spell.name.toLowerCase() === bare.toLowerCase() && (!wanted || spell.licence.toLowerCase() === wanted));
  return matches;
}

function build() {
  const bySpell = new Map<string, SpellUnlock[]>();
  const byNode = new Map<string, string[]>();
  const unresolved: string[] = [];
  for (const tree of talentClasses) {
    for (const branch of tree.branches) {
      for (const node of branch.nodes) {
        if (!node.spell) continue;
        const key = `${tree.slug}/${node.id}`;
        const alias = aliases[key];
        const licence = licenceFromChip(node.spell);
        const targets = alias?.names ?? [node.name];
        const found = targets.flatMap((target) => findSpells(target, licence));
        if (!found.length) { unresolved.push(key); continue; }
        byNode.set(key, found.map((spell) => spell.id));
        for (const spell of found) {
          const list = bySpell.get(spell.id) ?? [];
          list.push({ spellId: spell.id, classSlug: tree.slug, className: tree.name, nodeId: node.id, nodeName: node.name, branch: branch.name, cost: node.cost, choice: Boolean(alias?.choice) });
          bySpell.set(spell.id, list);
        }
      }
    }
  }
  return { bySpell, byNode, unresolved };
}

const index = build();

/** Every node that opens this spell. */
export function unlocksForSpell(spellId: string): SpellUnlock[] {
  return index.bySpell.get(spellId) ?? [];
}

/** The spell ids a node opens (empty for nodes without a spell chip). */
export function spellsForNode(classSlug: string, nodeId: string): Spell[] {
  return (index.byNode.get(`${classSlug}/${nodeId}`) ?? []).map((id) => spells.find((spell) => spell.id === id)).filter((spell): spell is Spell => Boolean(spell));
}

/** Every spell a class can reach through its tree, with the node that opens it. */
export function spellsForClass(classSlug: string): Array<{ spell: Spell; via: SpellUnlock[] }> {
  const seen = new Map<string, SpellUnlock[]>();
  for (const [spellId, unlocks] of index.bySpell) {
    const mine = unlocks.filter((unlock) => unlock.classSlug === classSlug);
    if (mine.length) seen.set(spellId, mine);
  }
  return spells.filter((spell) => seen.has(spell.id)).map((spell) => ({ spell, via: seen.get(spell.id)! }));
}

/** Spell-chip nodes that matched nothing — the test holds this at zero. */
export const unresolvedSpellNodes: string[] = index.unresolved;

/** Plain-object form for client components. */
export function unlockIndexForClient(): Record<string, SpellUnlock[]> {
  return Object.fromEntries(index.bySpell);
}
