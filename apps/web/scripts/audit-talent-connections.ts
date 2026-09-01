import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { talentClasses } from "../lib/talent-trees";

/**
 * The audit that ties the Eight Trees to the world they claim.
 *
 * The talent calculator is code, but everything it names is canon: trainers
 * are codex characters, spell nodes unlock abilities from the six pillars'
 * 108, and a reference that resolves nowhere is a promise the world cannot
 * keep. Three questions, asked of the database:
 *
 *  1. Does every ceiling trainer resolve — either to a codex entry that
 *     exists, or to a declared future write the roster already owns?
 *  2. Does every ability a spell node names exist, spelled identically, in
 *     the pillar dossiers' rosters?
 *  3. Is the roster of pending writes the one we think it is — nothing
 *     unaccounted for in either direction?
 *
 *   pnpm --filter @habitat/web exec tsx scripts/audit-talent-connections.ts
 */
const db = getPrismaClient();

type Fail = { check: string; detail: string };
const failures: Fail[] = [];
const fail = (check: string, detail: string) => failures.push({ check, detail });

/** Ceiling text → codex slug. Null means: a declared future write (PROPOSED
 *  at the next integration pass) or a deliberate non-person, never a typo. */
const trainerSlugs: Record<string, string | null> = {
  "Commander Rook": "the-kestrel-commander",
  "the Drill Master": "the-drill-master",
  "the Blast Foreman": "the-blast-foreman",
  "the Range Instructor": "the-range-instructor",
  "the Bureau Analyst": "the-bureau-analyst",
  "the Ashline Fixer": "the-ashline-fixer",
  "Mara Quill": "mara-quill",
  "the Paper-Hand": "the-paper-hand",
  "the hidden Concordance elder": null,
  "the Instructor of the Ninth": null,
  "the Kestrel Medic": "the-kestrel-medic",
  "ACA — slot reserved": null,
  "the Bureau Examiner": null,
  "the Resident — an Echo, in a Core": "brother-aster",
  "the Infuser-Tech": "the-infuser-tech",
  "the Phase-Five": null,
  "the Skinner of the Red Forest": null,
  "Nalia Reed": "nalia-reed",
  "the Clinic Surgeon": "the-clinic-surgeon",
  "the Choir does not teach — it collects. Sign the page.": null,
  "Keira Ansel": "keira-ansel",
  "the Captured Rider": "the-captured-rider",
  "the Unridden — a beast that consents": null,
  "Tomas Vey": "tomas-vey",
  "the Gate Clerk": null,
  "the Advocate of the Dead": null,
  "the Cordon Captain": null,
  "the Tempest Battery Officer": "the-tempest-battery-officer",
  "the Kestrel Quartermaster": "the-kestrel-quartermaster",
  "Jaro Fen": "jaro-fen",
  "the Pearl Factor": null,
  "reserved for the kingdom pass": null,
  "the Kestrel Mechanic": "the-kestrel-mechanic",
  "the Foundry-Master": "the-foundry-master",
  "NAG — yes, the watch": "nag",
  "the Fully Converted": null,
  "the Gun": null,
  "Serrat the Once": null,
  "a crossroads bargain, they say": null,
};

/** Spell nodes that name specific abilities — each name must exist verbatim
 *  in a pillar dossier's roster. Choice nodes ("pick a school") are listed
 *  with every name they can resolve to. Wrapper nodes map to the ability
 *  their prose names (First Ward wraps Seal; Quiet Ground wraps Quiet). */
const abilityClaims: Record<string, string[]> = {
  // Bastion — Aegis
  "bastion/first-ward": ["Seal"], "bastion/hold": ["Hold"], "bastion/quiet-ground": ["Quiet"], "bastion/muzzle": ["Muzzle"],
  // Spector
  "spector/blur": ["Blur"], "spector/static": ["Static"], "spector/dim": ["Dim"],
  "spector/kill-the-circuit": ["Kill the Circuit"], "spector/forget": ["Forget"], "spector/suggest": ["Suggest"],
  // Conduit
  "conduit/field-control": ["Freeze the Ground", "Weight"],
  "conduit/master-of-war": ["Sublimation", "Vitrify", "Conduction", "Return"],
  "conduit/healers-licence": ["Close", "Knit"], "conduit/debridement": ["Debridement"], "conduit/rebuild": ["Rebuild"],
  "conduit/shapers-licence": ["Patch", "Set"], "conduit/etch": ["Etch"],
  "conduit/certified-boundary": ["Brace", "Shroud", "Unbind"], "conduit/dissolution": ["Dissolution"],
  "conduit/empaths-licence": ["Steady", "Read"], "conduit/anchor": ["Anchor"], "conduit/seed": ["Seed"], "conduit/doctrine": ["Doctrine"],
  "conduit/presence": ["Presence", "Register"], "conduit/second-look": ["Second Look"], "conduit/echo-read": ["Echo Read"],
  "conduit/steady-the-hand": ["Steady the Hand"], "conduit/call": ["Call"],
  // Surger
  "surger/shove": ["Shove"], "surger/brace": ["Brace"], "surger/arrest": ["Arrest"], "surger/return": ["Return"],
  "surger/adjust": ["Adjust"], "surger/wear": ["Wear"], "surger/graft": ["Graft"], "surger/assume": ["Assume"],
  "surger/accept": ["Accept"], "surger/seat": ["Seat"],
  "surger/staunch": ["Staunch"], "surger/draw": ["Draw"], "surger/levy": ["Levy"], "surger/transfusion": ["Transfusion"],
  "surger/conversion": ["Conversion"],
  // Archon
  "archon/calm": ["Calm"], "archon/ask": ["Ask"], "archon/wake": ["Wake"],
  "archon/fetch": ["Fetch"], "archon/send": ["Send"], "archon/consignment": ["Consignment"], "archon/crossing": ["Crossing"],
  "archon/still": ["Still"], "archon/stand": ["Stand"], "archon/last-order": ["Last Order"], "archon/witness": ["Witness"],
  // Cypherist
  "cypherist/handshake": ["Handshake"], "cypherist/testimony": ["Testimony"], "cypherist/interface": ["Interface"],
  "cypherist/shield-pylon": ["Seal"],
  // Maverick — the unlicensed Thermal hand
  "maverick/snap-cast": ["Ignition", "Warmth"], "maverick/certified-spark": ["Flashover"], "maverick/left-hand-law": ["Sublimation"],
};

/** Spell-chipped nodes that deliberately name no single ability: pure choice
 *  nodes whose picks are covered elsewhere. Anything spell-chipped and in
 *  neither list is an audit failure, so a future node cannot slip through. */
const choiceNodes = new Set(["conduit/war-licence", "conduit/certified-strike", "cypherist/spell-in-a-can"]);

async function main() {
  const pillars = await db.storyEntry.findMany({
    where: { slug: { in: ["thermodynamics", "kinetics", "structure", "biologics", "cognition", "resonance"] } },
    select: { slug: true, body: true },
  });

  // 1 — every ceiling resolves, or is a declared future write
  console.log("1 · Every ceiling trainer resolves against the codex");
  const ceilingTexts = new Set<string>();
  for (const tree of talentClasses) for (const branch of tree.branches) for (const node of branch.nodes) {
    if (node.ceiling) ceilingTexts.add(node.ceiling);
  }
  const wantedSlugs = new Map<string, string>();
  let pending = 0;
  for (const text of ceilingTexts) {
    if (!(text in trainerSlugs)) { fail("trainer", `unmapped ceiling text: "${text}" — add it to the roster map`); continue; }
    const slug = trainerSlugs[text];
    if (slug) wantedSlugs.set(slug, text); else pending += 1;
  }
  for (const mapped of Object.keys(trainerSlugs)) {
    if (!ceilingTexts.has(mapped)) fail("trainer", `roster maps "${mapped}" but no ceiling uses it — stale entry`);
  }
  const found = await db.storyEntry.findMany({ where: { slug: { in: [...wantedSlugs.keys()] } }, select: { slug: true, kind: true } });
  const foundSlugs = new Set(found.map((row) => row.slug));
  for (const [slug, text] of wantedSlugs) {
    if (!foundSlugs.has(slug)) fail("trainer", `"${text}" should be codex entry ${slug}, which does not exist`);
  }
  console.log(`   ${ceilingTexts.size} distinct ceilings: ${wantedSlugs.size} resolve to codex entries, ${pending} are declared future writes.`);

  // 2 — every named ability exists in a pillar roster, spelled identically
  console.log("\n2 · Every spell node's abilities exist in the six pillars' 108");
  const abilityNames = new Set<string>();
  let abilityRows = 0;
  for (const pillar of pillars) {
    for (const match of (pillar.body ?? "").matchAll(/- \*\*(?:Licensed|Certified|Master) · ([^*]+?)\*\*/g)) {
      abilityNames.add(match[1].trim());
      abilityRows += 1;
    }
  }
  if (pillars.length !== 6) fail("pillars", `expected 6 pillar dossiers, found ${pillars.length}`);
  // 108 roster rows; three NAMES repeat across pillars by design (Brace and
  // Set in Tensile and Inertial, Anchor in Inertial and Empathic), so the
  // unique-name set reads 105.
  if (abilityRows !== 108) fail("pillars", `expected 108 ability rows across the pillars, parsed ${abilityRows}`);
  let claims = 0;
  for (const [key, names] of Object.entries(abilityClaims)) {
    for (const name of names) {
      claims += 1;
      if (!abilityNames.has(name)) fail("ability", `${key} claims "${name}", which no pillar dossier lists`);
    }
  }
  for (const tree of talentClasses) for (const branch of tree.branches) for (const node of branch.nodes) {
    if (!node.spell) continue;
    const key = `${tree.slug}/${node.id}`;
    if (!(key in abilityClaims) && !choiceNodes.has(key)) {
      fail("ability", `${key} carries a spell chip but claims no abilities and is not a declared choice node`);
    }
  }
  console.log(`   ${abilityRows} ability rows (${abilityNames.size} distinct names) parsed from the pillars; ${claims} claims across ${Object.keys(abilityClaims).length} spell nodes verified.`);

  // 3 — the pending roster, in one honest list
  console.log("\n3 · Writes the trees are still owed by the codex");
  const pendingTexts = [...ceilingTexts].filter((text) => trainerSlugs[text] === null);
  for (const text of pendingTexts.sort()) console.log(`   pending · ${text}`);
  console.log(`   ${pendingTexts.length} ceilings wait on the talent-system integration pass (new trainers, folklore, and two deliberate reserves).`);

  console.log("\n" + "=".repeat(70));
  if (failures.length === 0) {
    console.log("PASS — every trainer resolves or is declared, and every named ability is real.");
  } else {
    console.log(`${failures.length} problem${failures.length === 1 ? "" : "s"}:`);
    for (const problem of failures) console.log(`  [${problem.check}] ${problem.detail}`);
    process.exitCode = 1;
  }
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
