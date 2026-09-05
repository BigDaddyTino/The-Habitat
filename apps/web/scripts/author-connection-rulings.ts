import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { metaSchemasByKind } from "../lib/story-meta-schemas";
import { auditWorldConnections } from "../lib/story-world-connections";

/**
 * THE 56 CONNECTION RULINGS — the owner's answers to the one-sided half of
 * the world-connection audit, woven into the sheets they belong to.
 *
 * Source: the Connection Rulings Ledger artifact (2026-09-05), collection
 * `rulings`, 56 documents. Every item there was one end of a connection the
 * other end had never written: a character who names somebody who does not
 * name them back, an event whose cast does not record being in it, a faction
 * stance nobody returns, a Forge with no note on the system that governs it.
 *
 * The owner ruled every one, in the OTHER party's voice — Kane on Vasque,
 * Tino on NAG, the Church on the Congregation. This pass writes those rulings
 * onto the silent end. The words are the codex's; the substance is his. Two
 * things are recorded here rather than guessed at:
 *
 *   - `the-route-that-moves > mara-quill` came back with Tomas Vey's Mender
 *     text pasted in by mistake; Quill's row is written from the event's own
 *     excerpt (she reads the animal and root signs) and flagged in the report.
 *   - `crimson-choir > the-nation-state-of-arcadia` was ruled `unknown` in the
 *     ledger and `enemy` when asked; the row carries `enemy`.
 *
 * Idempotent: an end that already answers is left alone; a source row whose
 * `who` was blank gets the counterpart's name. Meta is validated against the
 * sheet schema before any write, and written merged so server-owned keys
 * survive.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-connection-rulings.ts
 *   pnpm --filter @habitat/web exec tsx scripts/author-connection-rulings.ts --apply
 */
const db = getPrismaClient();
const apply = process.argv.includes("--apply");
const PASS = "Connection rulings (2026-09-05)";
const revisionSummary = (reasons: string[]) => {
  const full = `${PASS}: ${reasons.join("; ")}. Sheet fields only — no prose changed.`;
  return full.length <= 300 ? full : `${full.slice(0, 299)}…`;
};

type Row = Record<string, unknown>;
const rows = (value: unknown): Row[] => (Array.isArray(value) ? value.filter((row): row is Row => typeof row === "object" && row !== null) : []);
const slug = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);

// ------------------------------------------------------------ relationships
// `on` gets a row pointing back at `to`. `who` ≤160, `type` ≤300.
const relationships: Array<{ on: string; to: string; who: string; type: string }> = [
  { on: "tino", to: "amanda", who: "Amanda — his wife",
    type: "Soulmate and wife. When their children were taken they searched together, until he decided the road ahead was his to walk alone — too dangerous to put her on it. He left with a heavy heart, to bring their children home for both of them. She has never been told that." },
  { on: "tino", to: "the-infuser-tech", who: "Yusuf Halloran — a brother in arms",
    type: "They trained together under Helix, young and greedy, and did things for Helix that neither has spoken of since. They care for each other the way men do who share one silence; the training and those years are the one subject both of them refuse." },
  { on: "steve", to: "wendy", who: "Wendy — friend, occasional hookup",
    type: "They get along, blow off steam when the mood hits, and neither mistakes it for anything more. He stands guard at her table and she sends him to Tino with the new recruits, which he has opinions about." },
  { on: "tino", to: "wendy", who: "Wendy — the clerk he pulled out alive",
    type: "He pulled her out alive once and she has never let him forget it. She flirted, pushed, made it obvious what she wanted; he shut it down every time. He trusts her and would bleed for her, and that part of him was already spoken for." },
  { on: "tomas-vey", to: "elias-vey", who: "Elias Vey — his brother",
    type: "They survived the same night and got out by different routes. He knows Elias's handwriting on the prototype requisition and knows what it means. Twenty years on, he has not found a way to say his brother's name without going back there." },
  { on: "keira-ansel", to: "elias-vey", who: "Dr. Elias Vey — the other half of an argument she has never had in person",
    type: "He measures organisms moving together under pressure and calls it agreement; she calls it survival — a system can coordinate perfectly while every living thing inside it is trying to escape. He has her data. He does not have her conclusion." },
  { on: "ilse-vetch", to: "ivo-crane", who: "Radiant Ivo Crane — above her on the Path's own ladder",
    type: "By the movement's arithmetic he outranks her, and neither has ever said it out loud. She hears his testimony and respects his office, and does not mistake either for proof that he is right. A quiet resistance to a hierarchy she started." },
  { on: "wren-salloway", to: "ivo-crane", who: "Radiant Ivo Crane — the one account she never leaves waiting",
    type: "When he asks, she finds the money before anyone can explain why it matters. He has never asked why he is the exception. She knows exactly why, and prefers that he never asks — it is one of the reasons she still can." },
  { on: "tomas-vey", to: "maintenance-unit-m-17", who: "Mender — the unit he worked beside",
    type: "He worked shifts beside it before Southreach came apart. It knew his credentials, his routines, which instructions he shortened because it already knew the rest — and it still answers him the same way. He remembers them. He cannot prove that it does." },
  { on: "tino", to: "nag", who: "NAG — his armour, his second skin, and the mouth he has been trying to shut for ten years",
    type: "He named the bastard, so some of this is his fault. It keeps him alive, he keeps it functional, and they express gratitude by telling each other to fuck off — a ten-year marriage in which neither party would admit there is affection under the abuse." },
  { on: "amanda", to: "nag", who: "NAG — made his on her bench",
    type: "She made it Tino's: every plate, every safeguard, every bad habit in its voice was fitted on her bench, and what she poured into it woke something. It used to argue with everyone. Around her it goes quiet, and she has never asked why. She is not sure she wants the answer." },
  { on: "abraham-islay-kane", to: "ottoline-vasque", who: "Representative Ottoline Vasque — the one who moved against him and survived the correction",
    type: "She was right about the numbers, and he told her so while she could still hear him. In his mind the violence is settled; her competence is not. He does not confuse insubordination with stupidity, and has never needed to like somebody to recognise when they are correct." },
  { on: "abraham-islay-kane", to: "the-asis-officer", who: "Inspector Cassia Merrow — more protective of him than her office requires",
    type: "She handles threats before they become requests and calls it procedure afterwards. He has not ordered her to stop, and she has been intelligent enough never to ask whether that means he approves. He recognises the loyalty and will not reward it openly." },
  { on: "corrin-ade", to: "the-asis-officer", who: "Inspector Cassia Merrow — reading about him without introducing herself",
    type: "People in her line of work do not get curious by accident. If she wants a meeting she already has a theory, a file, and at least one reason not to tell him what either contains. Her interest is investigative, not social, and he reads it as exactly that." },
  { on: "the-kestrel-commander", to: "the-kestrel-medic", who: "Priya Castellan — their medic",
    type: "Her hands tell Rook something is wrong long before her mouth ever will. Rook has noticed. Rook has also noticed that she still does the work. Until one of those two things changes, what Rook knows stays Rook's." },
  { on: "ilse-vetch", to: "the-marker", who: "The Marker — the one witness she cannot question",
    type: "They have never argued, because the Marker has never offered her an argument to answer. She speaks; the Marker remains; and that silence carries more authority than testimony. She does not know whether it agrees with her. She is more afraid that it does not need to." },
  { on: "alder-wade", to: "cassia-verne", who: "Factor Cassia Verne — his favourite argument, written as a tariff schedule",
    type: "She turns a principle into a price before he has finished defending it; he tells her exactly what that price will cost the city. They rarely agree. He trusts her because neither of them needs to — respect disguised as bureaucratic combat." },
  { on: "ilse-vetch", to: "del-anwar", who: "Del Anwar — the man she fed",
    type: "She found him starving and told him he did not have to believe a word she said: eat, sleep, survive the night. By morning she promised a clean shirt, another meal, and a place where nobody made him earn either first. She stayed until he finished the bowl. That is the part she calls real." },
];

/** Source rows whose `who` was blank — the counterpart's name goes in. */
const whoFills: Array<{ on: string; to: string; who: string }> = [
  { on: "amanda", to: "tino", who: "Tino — her husband" },
  { on: "nag", to: "tino", who: "Tino" },
  { on: "nag", to: "amanda", who: "Amanda" },
  { on: "maintenance-unit-m-17", to: "tomas-vey", who: "Tomas Vey" },
];

// -------------------------------------------------------------- involvement
// The character's own ledger gets the event, with `how` ≤300.
const involvements: Array<{ on: string; event: string; how: string }> = [
  { on: "tomas-vey", event: "the-last-safe-reading", how: "Identified and preserved Southreach's last coherent telemetry state, then traced its surviving record through Ashline Exchange and the Complex. His work fixes when the record failed — never who or what caused it." },
  { on: "tomas-vey", event: "three-failure-reports", how: "Was present when the three reports were compared; authenticated their terminology and confirmed each as genuine. He saw that their timestamps cannot share one clock, and made no finding of motive or cause." },
  { on: "jaro-fen", event: "reserve-twelve", how: "Surveyed the vault under his salvage claim, marked which reserve glass, essence and records could be recovered, and advised against any extraction likely to carry resonance into adjacent sectors. Safety authority stayed with Ward." },
  { on: "selene-ward", event: "reserve-twelve", how: "Held security authority at the vault, set the containment limits for recovery, and could halt any extraction that risked spreading resonance into adjacent sectors. Salvage was allowed only where her conditions were met." },
  { on: "nalia-reed", event: "root-of-the-bargain", how: "Recorded the biomass returned to the sacrifice bed, the channel that opened afterwards, where and how long it held, and the conditions around each repeat. She logged it as reproducible behaviour — never as speech or intent." },
  { on: "keira-ansel", event: "root-of-the-bargain", how: "Instrumented the Heartfen trials: measured each response after contaminated biomass went back, compared when channels opened, how long they held and whether the exchange repeated — and refused to call the pattern negotiation." },
  { on: "mara-quill", event: "the-bellwether-event", how: "Tracked the Bellwether into Long Graze, mapped how the herds around it changed route and mutation behaviour, and set the hunt's limits: observe first, redirect second, and kill only for an immediate threat to travellers." },
  { on: "maintenance-unit-m-17", event: "menders-work", how: "Grafted living tissue into Splicefield Substation and brought part of the Southreach circuit back. The repair risked re-energising the sealed reserve feed, carrying resonance into neighbouring sectors, and altering whatever was fused into the work." },
  { on: "tomas-vey", event: "menders-work", how: "Read Mender's living junction as a bridge between Splicefield's local circuit and the sealed Southreach reserve feed, and warned that finishing the repair would not only restore the substation — it could energise the isolated line through the graft." },
  // The ruling for this row carried Vey's Mender text by mistake; written from the event's own excerpt instead.
  { on: "mara-quill", event: "the-route-that-moves", how: "Read the animal and root signs behind Walking Orchard that said the gap was opening, and judged how long the corridor would hold before the behaviour that made it moved on. She would not mark it: a marked route is a route that stops moving." },
  { on: "nalia-reed", event: "the-route-that-moves", how: "Tested the Reedless Mile crossing a step at a time — depth and footing probed ahead, weight placed on suspect ground, short repeated passes as water and root moved — and recorded where it held, shifted or failed without ever marking it." },
  { on: "tomas-vey", event: "the-purge-window", how: "Used surviving reactor telemetry to predict the purge cycle, name which sectors would briefly open, and time when saturation would vent toward the old drainage. His window is the only one the expedition gets to enter, recover, redirect or seal." },
  { on: "selene-ward", event: "the-purge-window", how: "Turned Vey's prediction into an access plan — which sectors could be entered, what could be recovered, and when teams had to be out before saturation reached the old drainage — and held the authority to close the window early." },
  { on: "keira-ansel", event: "the-purge-window", how: "Disputed treating the purge as a clean access window: her models showed vented saturation could pool, rebound or shift into the old drainage, so a sector could read safe while the load was only moving somewhere else." },
  { on: "jaro-fen", event: "a-ledger-with-two-owners", how: "Matched crate seals, lot stamps, broken inventory tags and reserve-glass assay marks inside the vault against both ownership chains, and proved the NDD and Aegis ledgers claimed the same stock. Some lots matched neither record cleanly." },
  { on: "selene-ward", event: "a-ledger-with-two-owners", how: "Halted release of the disputed stock once both chains produced authentic custody, and put the material under security hold until the conflicting records and Meridian's assays could be reconciled." },
];

// ------------------------------------------------------------------ stances
// The target faction gets a row toward the source, in its own voice. notes ≤500.
const stances: Array<{ on: string; toward: string; stance: string | null; notes: string }> = [
  { on: "meridian-arcane-institute", toward: "desert-nomad-compact", stance: "client",
    notes: "We need the Compact to reach sites our own expeditions cannot safely enter, and the dependence is not comfortable. Their guides bring our scholars back alive; they also decide what gets seen, recorded, or quietly omitted. We pay for access knowing the record may have been edited before it reaches us." },
  { on: "national-defense-directorate", toward: "drifter-renegade-camps", stance: "enemy",
    notes: "Deserters do not become civilians because they paint over the unit numbers. Some of those camps run Directorate drills, Directorate convoy doctrine and Directorate-trained fighters under new flags. We treat them as armed breakaways, and we treat them accordingly." },
  { on: "peninsula-coast-guard-authority", toward: "free-islander-league", stance: null,
    notes: "We let League ferries run because they move people and cargo through channels we would otherwise have to police ourselves. Their routes are known, their captains predictable, and watching them is cheaper than breaking a system that currently works. The tolerance is deliberate, not friendly." },
  { on: "stormglass-cartel", toward: "free-islander-league", stance: "enemy",
    notes: "They made Ignit into a flag and put our name on the fire. Every ferry, speech and recruit they pull out of that wreckage turns an old battlefield into a new problem for us. Pearl may have finished the island, but the League has decided we belong in the indictment too." },
  { on: "tropic-pearl-trade-house", toward: "free-islander-league", stance: "enemy",
    notes: "They built a movement on the ruins of Ignit and made us half the reason it exists. We will not apologise for winning a war Stormglass helped start, and we will not indulge anyone who turns that battlefield into a licence to attack our people, our contracts or our trade." },
  { on: "national-defense-directorate", toward: "iron-saints-pmc", stance: "client",
    notes: "Clause 12 lets the Saints carry arms, hold assigned ground, escort Directorate assets and use force within the contracted operation. It does not let them arrest civilians, issue military orders outside that mission, seize property on their own authority, or remain in command once the contract ends." },
  { on: "aegis-extraction-consortium", toward: "the-congregation-of-the-bound", stance: "client",
    notes: "We pay their Sextons because crews work longer, recover faster and cause fewer incidents when somebody knows what to do with grief. Accounting calls it safety support. If the Congregation believes we are financing something holier than that, they have never put it on an invoice." },
  { on: "church-of-the-first-gift", toward: "the-congregation-of-the-bound", stance: "rival",
    notes: "They mistake endurance for holiness. Suffering may bind people together, but pain does not become sacred because it was survived, and deprivation creates no debt the world is entitled to collect. The First Gift was given freely; turning hurt into covenant profanes the gift by making loss itself an altar." },
  { on: "national-defense-directorate", toward: "the-congregation-of-the-bound", stance: null,
    notes: "The Directorate permits Bound chapels in selected barracks because they keep some soldiers functional, disciplined and easier to retain after hard deployments. That tolerance is deliberate, local and revocable. We do not endorse the faith; we allow a useful institution, under watch." },
  { on: "aegis-extraction-consortium", toward: "the-nation-state-of-arcadia", stance: "client",
    notes: "Arcadia licenses our recovery work, accepts our freight, and pays for material it would rather not harvest itself. The Chamber may argue over every burned wagon and every precedent, but until it closes its roads or stops signing contracts, Arcadia remains a client." },
  // Ruled `unknown` in the ledger, then `enemy` when asked — the note was never anything else.
  { on: "crimson-choir", toward: "the-nation-state-of-arcadia", stance: "enemy",
    notes: "Arcadia has no file on us. Let ASIS keep calling that ignorance safety. By the time they learn the difference, we intend the lesson to have a body count." },
  { on: "stormglass-cartel", toward: "the-nation-state-of-arcadia", stance: "client",
    notes: "Arcadia sells us soldiers by the squad and calls the arrangement somebody else's problem once they cross the line. We pay, they provide trained bodies, and everyone keeps the flags out of it. Southside blood has been on our payroll long enough to make the relationship useful." },
  { on: "crimson-choir", toward: "the-radiant-path", stance: "client",
    notes: "The Path supplies converts. We finance the bindings. Their people receive service with nothing paid up front; we receive a claim on the bound individual until the debt is satisfied. They call it mercy. We call it a contract with unusually reliable collateral." },
];

// -------------------------------------------------------------- forge notes
// Region notes on the Soul Forge system, one per place that carries a Forge. note ≤300.
const forgeNotes: Array<{ region: string; note: string }> = [
  { region: "charnel-lock", note: "A Forge stands inside the Bone Market's lock-castle. Its presence is established and nothing else is: who built it, who keeps it, what state it is in, and whether it behaves like any other Forge are deliberately unassigned — the Families' to answer." },
  { region: "clearinghouse", note: "Aegis's customs fort keeps a working Forge: a fixed return point for whoever is bound to its Core, reclaiming the dead through its platform. No local history, operator, condition or peculiarity is written beyond that function." },
  { region: "forward-camp-kestrel", note: "The party's first Forge. Rook binds them to it personally, and its Core shows the campaign's first absence — no Echo of Tino. Destroyed with the island, which leaves every survivor bound to a machine on the sea floor until Arcadia." },
  { region: "heartland", note: "The Forgefaith's working parish, beneath the courthouse: the Sexton keeps the platform ledger — who returned, how often — while Brother Aster tends the Core from inside it. Here alone the faith records the reclaimed at the altar that brings them back." },
  { region: "port-arcadia", note: "Where the party binds again. They arrive bound to Kestrel's dead Forge and every death is final until they reach a working Core; securing that return point is the mainland's first true objective, and whoever controls it controls survival." },
  { region: "regulator-station", note: "Meridian's pylon fortress holds a Forge. The record establishes that it is there and nothing more — origin, operator, condition, purpose and any local variation in how it works remain unassigned." },
  { region: "standing-camp", note: "The camp exists because its Forge is fixed to the ground it anchors; move the Core and the return point dies. Caravans come and go around it and the Forge never can — their dead made this the desert's only permanent congregation." },
  { region: "the-lamp-chapel", note: "The Southside's busiest working Forge: one Core, one platform, one table, and a ledger packed with names. Its specialty is throughput — when deaths outpace the platform the Sexton sequences the returns, sits with the reclaimed through the first hour, and asks nothing." },
  { region: "winchworks", note: "The Holdfasts' lift-yard fortress keeps a Forge: a fixed return point for souls bound to its Core, reclaiming the dead through its platform. No operator, history, condition or local behaviour is written beyond that." },
];

const flagged = [
  "the-route-that-moves > mara-quill: the ledger carried Tomas Vey's Mender text by mistake; Quill's row is written from the event's excerpt — please read it.",
  "amanda > nag: the ruling says she built it; the earlier ruling says NAG is an ancient artifact her gift woke. The row says she fitted it on her bench and what she poured in woke something — both stand.",
];

async function main() {
  const identity = await db.$queryRawUnsafe<Array<{ database: string }>>("select current_database() as database");
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  const entries = await db.storyEntry.findMany({ where: { status: { in: ["DRAFT", "PROPOSED", "CANON"] } }, select: { id: true, slug: true, kind: true, title: true, meta: true } });
  const arcs = await db.storyArc.findMany({ where: { status: { in: ["DRAFT", "PROPOSED", "CANON"] } }, select: { slug: true } });
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  const before = auditWorldConnections(entries, arcs);

  const staged = new Map<string, { meta: Row; reasons: string[] }>();
  const metaFor = (entrySlug: string): Row => ({ ...(staged.get(entrySlug)?.meta ?? ((bySlug.get(entrySlug)?.meta ?? {}) as Row)) });
  const stage = (entrySlug: string, meta: Row, reason: string) => {
    const existing = staged.get(entrySlug);
    staged.set(entrySlug, { meta, reasons: [...(existing?.reasons ?? []), reason] });
  };
  const need = (entrySlug: string, kind: string) => {
    const entry = bySlug.get(entrySlug);
    if (!entry) throw new Error(`No entry "${entrySlug}".`);
    if (entry.kind !== kind) throw new Error(`"${entrySlug}" is a ${entry.kind}, not a ${kind}.`);
    return entry;
  };

  for (const rel of relationships) {
    need(rel.on, "CHARACTER"); need(rel.to, "CHARACTER");
    const meta = metaFor(rel.on);
    const current = rows(meta.relationships);
    if (current.some((row) => slug(row.character) === rel.to)) continue;
    stage(rel.on, { ...meta, relationships: [...current, { character: rel.to, who: rel.who, type: rel.type }] }, `answers ${rel.to}'s relationship`);
  }
  for (const fill of whoFills) {
    const meta = metaFor(fill.on);
    const current = rows(meta.relationships);
    const row = current.find((candidate) => slug(candidate.character) === fill.to);
    if (!row || slug(row.who)) continue;
    stage(fill.on, { ...meta, relationships: current.map((candidate) => candidate === row ? { ...candidate, who: fill.who } : candidate) }, `names ${fill.to} on the row that pointed at them`);
  }
  for (const inv of involvements) {
    need(inv.on, "CHARACTER"); need(inv.event, "EVENT");
    const meta = metaFor(inv.on);
    const current = rows(meta.involvement);
    if (current.some((row) => row.kind === "EVENT" && (slug(row.ref) ?? slug(row.arc)) === inv.event)) continue;
    stage(inv.on, { ...meta, involvement: [...current, { ref: inv.event, kind: "EVENT", how: inv.how }] }, `records being in ${inv.event}`);
  }
  for (const st of stances) {
    need(st.on, "FACTION"); need(st.toward, "FACTION");
    const meta = metaFor(st.on);
    const current = rows(meta.relations);
    const have = current.find((row) => slug(row.faction) === st.toward);
    if (have && slug(have.stance) === st.stance && slug(have.notes) === st.notes) continue;
    // A row this pass wrote is this pass's to correct when a ruling changes.
    const relations = have ? current.map((row) => row === have ? { ...row, stance: st.stance, notes: st.notes } : row) : [...current, { faction: st.toward, stance: st.stance, notes: st.notes }];
    stage(st.on, { ...meta, relations }, ` a stance toward `);
  }
  {
    need("the-soul-forge", "SYSTEM");
    const meta = metaFor("the-soul-forge");
    let notes = rows(meta.regionNotes);
    const added: string[] = [];
    for (const forge of forgeNotes) {
      need(forge.region, "REGION");
      if (notes.some((row) => slug(row.region) === forge.region)) continue;
      notes = [...notes, { region: forge.region, note: forge.note }];
      added.push(forge.region);
    }
    if (added.length) stage("the-soul-forge", { ...meta, regionNotes: notes }, `region notes for ${added.join(", ")}`);
  }

  const plan: string[] = [];
  const invalid: string[] = [];
  for (const [entrySlug, change] of staged) {
    const entry = bySlug.get(entrySlug)!;
    const schema = metaSchemasByKind[entry.kind as keyof typeof metaSchemasByKind];
    const parsed = schema ? schema.safeParse(change.meta) : { success: true as const };
    if (!parsed.success) { invalid.push(`${entrySlug}: ${JSON.stringify((parsed as { error: { issues: unknown } }).error.issues)}`); continue; }
    plan.push(`${entry.kind} ${entrySlug}\n    - ${change.reasons.join("\n    - ")}`);
  }
  if (invalid.length) {
    console.error("Refusing to write — these sheets would not validate:\n" + invalid.join("\n"));
    process.exitCode = 2;
    return;
  }
  const after = auditWorldConnections(entries.map((entry) => staged.has(entry.slug) ? { ...entry, meta: staged.get(entry.slug)!.meta } : entry), arcs);
  console.log(`${identity[0]?.database} — ${apply ? "APPLY" : "PREVIEW"} — ${staged.size} entr${staged.size === 1 ? "y" : "ies"} to update`);
  console.log(`audit before: ${before.defects} defects, ${before.gaps} gaps, ${before.notes} notes`);
  console.log(`audit after:  ${after.defects} defects, ${after.gaps} gaps, ${after.notes} notes`);
  console.log(plan.length ? plan.join("\n") : "nothing to do");
  console.log("\nFlagged for the owner:\n  - " + flagged.join("\n  - "));

  if (!apply) return;
  for (const [entrySlug, change] of staged) {
    const entry = bySlug.get(entrySlug)!;
    await db.$transaction([
      db.storyEntry.update({ where: { id: entry.id }, data: { meta: change.meta as unknown as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: actor.id } }),
      db.storyRevision.create({ data: { entityType: "ENTRY", entityId: entry.id, action: "UPDATED", actorUserId: actor.id, summary: revisionSummary(change.reasons) } }),
    ]);
  }
  console.log(`applied ${staged.size} update${staged.size === 1 ? "" : "s"}`);
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(2)); });
