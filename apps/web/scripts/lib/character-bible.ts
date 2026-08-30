/**
 * The Price of a Person — the character bible, as codex content.
 *
 * The design pass that produced this covered ten character ledgers, six
 * attributes, twenty skills, six pillars of magic, nine professions, kit,
 * cybernetics, suspicion, and the whole of combat. It is written down here in
 * the shape the codex stores: new SYSTEM dossiers, design layers appended to
 * dossiers that already exist, and two amendments to locked rules.
 *
 * Nothing in this file writes. `scripts/integrate-character-bible.ts` is the
 * runner, it previews by default, and every append is proved by a word-level
 * loss check against the prose it lands under.
 *
 * The vocabulary law this whole pass obeys: near-future world, near-future
 * words. Engineering, not smithing. Chemistry, not alchemy. Background, not
 * class. Species, not race. Kit, not gear. Nothing in the career area is
 * allowed to sound like a fantasy character sheet, because nothing in this
 * world is one.
 */

export type SystemMeta = {
  category: string | null;
  buildStatus: "concept" | "designed" | "in-build" | "playable" | "live" | null;
  parent: string | null;
  unlockArc: string | null;
  unlockStage: string | null;
  dependsOn: string[];
  pillars: string[];
  regionNotes: Array<{ region: string; note: string | null }>;
  gameTag: string | null;
  openQuestions: string[];
};

export type NewSystem = { slug: string; title: string; summary: string; body: string; meta: SystemMeta };

/**
 * An append onto a body somebody else wrote. The marker below is how a re-run
 * finds its own layer and replaces it, instead of stacking a second copy under
 * the first — the same law every authoring script in this repo obeys.
 */
export type Layer = {
  slug: string;
  note: string;
  append: string;
  meta?: Partial<SystemMeta>;
  /** Where a re-run cuts back to. Defaults to DESIGN_MARKER. Set it wherever a
   *  body already carries a `## Designed` heading somebody else wrote — the
   *  Soul Forge pass left one on `reclamation` and a ripple on
   *  `lasting-wounds`, and neither may be eaten by this pass's re-runs. */
  marker?: string;
};

/**
 * One amendment to a locked RULE: the exact paragraph that exists today, and
 * the paragraph that replaces or follows it. Both halves are stored so the
 * runner can refuse to guess — if `from` is not found verbatim, nothing is
 * written and the mismatch is reported.
 */
export type RuleEdit = { slug: string; note: string; from: string; to: string };

const sys = (over: Partial<SystemMeta>): SystemMeta => ({
  category: null,
  buildStatus: "designed",
  parent: null,
  unlockArc: null,
  unlockStage: null,
  dependsOn: [],
  pillars: [],
  regionNotes: [],
  gameTag: null,
  openQuestions: [],
  ...over,
});

/** Every design layer starts with this line, and a re-run cuts back to it. */
export const DESIGN_MARKER = "\n\n---\n\n## Designed";

// ===========================================================================
// New systems — the shelves this design needed and the codex did not have.
// ===========================================================================

const enlistment = `A character is created at a desk, by a clerk, in the minutes before the game's first minute. [[stormglass-cartel]] is the player's employer, so there is no menu behind this: there is a woman who has done this four hundred times, a form, and a queue behind you.

She asks four questions.

**1 · "People?"** — your species. It sets attribute ceilings, a lifespan, one trait, one burden, how strangers read you across a room, and what a [[the-soul-forge]] makes of your pattern. It never changes. Choosing [[the-unregistered]] opens a warning at the desk — one life, [[true-death]] from minute one — and the clerk makes you say yes twice.

**2 · "Previous service?"** — your background. Starting kit, starting skill ranks and ceilings, your read, one contact, and one thing you do not discuss. It never changes and it always blurs: [[character-classes]] is the door you came in through, never the walls.

**3 · "Any of it yours?"** — your origin, and the biggest question on the form. Nothing, your own essence, a giver's, or a rig ([[the-three-origins-of-magic]]). Three of the four answers are doors that open one way only. It also sets your first corruption phase, which is where an infused character learns they did not start clean.

**4 · "Certified in what?"** — casters only: your first licence class, chosen if infused, expressed if born, decided for you if gifted. It grows into at most three classes across two pillars, one of them mastered ([[the-six-pillars]]).

**What you do not choose.** Attributes come from species ceilings, with two rungs placed where the training was. Skills come from the background — four at Practised, one at Reliable, and two ceilings set deliberately low. A profession is implied at apprentice rung; nobody is licensed on day one. Standing starts as *Cartel: enlisted*, plus one contact from the background and one hook from the species. Kit is issued and counted aloud. Cybernetics start at none for everybody except Salvage Engineering, which starts with one that was built for somebody else.

**The last enlistment question is not asked here.** Rook asks it at Kestrel, and it is the one that matters: *where are you bound?*

---

## The surfaces

[[the-look-of-the-world]] says first person, always, and this design adds no numbers anywhere. So the interface is a set of objects and people in the world, and this is the complete list of them. If a system needs a readout that is not on this list, the system is wrong.

- **The record** — your service file, kept by whoever employs you. Species, background, origin, licences, trade, contacts, and never a number. Anyone holding the drawer can read it.
- **The medic's note** — your attributes, as prose. *Slower on the second flight; left hand — watch it.* A forged one shows what you paid for.
- **The count** — the quartermaster's spoken number. Rounds, doses, cells, tonics, the reserve, and your reclamation quote. Said aloud on purpose, in front of everyone.
- **The rig** — pale light at the hip, valves, and a thing that can lie. Charges lit, charges delivered, and whether the two agree. Any Infusion Technician reads it across a room; so does any rifleman with a target.
- **The bag** — a born caster's tonics, and the dose they have not opened yet.
- **The wheel** — a radial on a hotkey, which is a soldier shouting. Orders and formations. Nothing pauses.
- **The map table** — a table you physically walk to. Drone feeds, reflections and windows are the only scale views canon allows.
- **The ledger** — a settlement's book in a quartermaster's shorthand. Who is short, who drew doses, and the order of the dead.
- **The Forge readout** — the Core's voice at binding and at reclamation. *Resonance detected. Biological pattern acquired.* Or: *unresolved*.
- **The lattice** — what [[drone-surveillance-bureau]] sees. You never open it. Somebody else does, having paid.
- **The diary** — a companion's notebook, found on a body, with the ladder written from the inside.

For writers: the desk is a scene, not a screen. The clerk has opinions, the queue has a mood, and the answers are consequences before the tutorial starts. Never write a creation moment that hands the player a slider, and never let a character state a number about themselves out loud — the only people in this world who say numbers are the ones selling you something.`;

const attributes = `Six attributes, each a rung from 0 to 9, and nobody in the game ever sees one. An attribute is not a bar; it is a way somebody moves, and the world reports it by behaving differently around you.

**Your level is the sum of your six rungs.** That is not a metaphor — it is [[the-soul-forge]]'s measure of how much body there is to rebuild, and [[reclamation]]'s arithmetic runs straight off it: 35 Essence to build a body at all, plus 11.7 for every level. A raw recruit is level 7 to 14. Canon's developed character at level 30 averages rung 5 and quotes at 386. Every ceiling at once would be 54, would cost 667, and has never happened to anybody.

**Conditioning** — load, output, endurance. Low reads as winded on a stair he used to take at a run. High reads as still working when the shift that relieved him has gone to bed. Driven by distance under load, real food, and a medic who makes you rest; falls with bad air, and with phase 2.

**Coordination** — precision and reaction. Low reads as a signature that has changed shape. High reads as reloading without looking down. Driven by precise action under stress — a reload while being shot at counts, a reload on the range does not. Phase 1 takes it first.

**Resilience** — trauma and toxin tolerance. Low reads as infections that should have cleared. High reads as wounds that should have put him down and did not. Driven by surviving things, by medicine, and by good prosthetics. Phase 6 raises it, which is the worst possible way to get it.

**Acuity** — senses and processing. Low reads as learning things when he is told them. High reads as answering a question nobody asked out loud. Driven by reads that turned out right, and by optics worth more than the rest of your kit. Phase 4 raises it, which is why a corrupted spotter is worth an argument.

**Composure** — nerve, and the capacity to refuse. Low reads as snapping at nothing and asking when the next issue is due. High reads as a room going quieter because you are. Driven by holding under fire, by rest, and by a real meal. Phase 3 takes it hardest — the debt eating the only thing that could refuse it.

**Conductivity** — how much Essence a body can carry and channel before it starts costing. Low reads as a dose making him sick, and a rig that leaks pale light down his ribs because he cannot hold the fifth charge. High reads as a rig running cool, a channel held that others drop, and an assay slip that lets a catcher price him before he has spoken. It is the one attribute read by an instrument rather than off behaviour, which is exactly why [[the-harvest-economy]] wants an assay on everybody.

**What Conductivity governs.** A born or gifted caster's pool is 8 + level + twice Conductivity. An infused rig holds Conductivity + 2 charges and vents the excess as light. The overcharge envelope sits where Conductivity puts it — Channelling's *Envelope* technique tells you where the line is; Conductivity is where the line *is*. The ceilings are the harvest economy's real map: humans 8, [[carriers]] and [[chartered]] 9, [[returnees]] 7, [[the-unregistered]] unreadable, and [[the-latent]] whatever their Surfacing turns out to be. Born casters start a rung higher; the Infusion Technician background places one.

---

## How a body levels

- **Rungs rise by driver.** Each attribute has exactly one, and pressure counts while safety does not. There is no bar — the world tells you, in a line of dialogue, a medic's note that reads differently, or a thing you can suddenly do.
- **Species sets the ceiling,** out of nine. Humans are eight across. A Chartered can reach Conditioning 9 and never Acuity 8, so a Returnee sniper and a Chartered sniper end up genuinely different people.
- **Background places two rungs** where the training was: Contract Security in Coordination and Conditioning, Field Medicine in Acuity and Composure, Infusion Technician in Coordination and Conductivity.
- **Teachers drill.** A ceiling relationship can drill one attribute — its driver counts double for a week — and it costs a favour, like everything a teacher does.
- **Food, rest and medicine are progression.** [[professions]]'s Culinary rung restores Composure with a real meal; medicine and grafts move Resilience. Canon asks that rewards be growth the fiction can see, and a cook is exactly that.
- **Augments add effective rungs above the pattern, never in it.** A sensory augment is Acuity +1 while it is in you, and the Forge does not know it exists — see [[cybernetics]].
- **Corruption trades current rungs, never ceilings.** Phase 1 takes Coordination, phase 2 takes Conditioning and pays Conductivity, phase 3 takes Composure hardest, phase 4 pays Acuity, phase 6 pays Resilience. See [[the-corruption-system]].
- **A shortfall costs a rung.** Every 11.7 Essence the Forge is short is one rung off the attribute it built worst. The first one is gone for good; the rest regrow at about one a day, faster with a cook and a medic.

## Two files, as the world would write them

**Merritt, Contract Security, level 12.** The medic's note reads: *carries well, hands are good, do not send him in alone after dark.* Nobody has written a number about Merritt in his life, and the quartermaster's quote at the Forge — one hundred and seventy-five — is the first one he ever hears.

**Oyelaran, Infusion Technician, level 19, phase 2.** The medic's note reads: *veining at the wrist, hides it well; rig runs cool on her, which is not luck.* The assay slip in her file states her Conductivity outright, in a way no note about anybody else's body ever does, and that slip is worth money to four separate organisations.

For writers: never state an attribute. Write the tell. A character with high Acuity is given information the world does not offer anyone else, and a character whose Coordination has slipped signs their name differently — that is the whole interface, and it is enough.`;

const skills = `Twenty skills, five ranks, and sixty techniques — and every technique in the game comes from a person. Canon's own example of a reward the fiction can see is *a veteran teaching a technique*, so that is the whole talent layer for everything that is not magic.

**The ranks.** Green is where a skill starts unless a background put you above it. **Practised** comes from use under pressure, because [[the-war-teaches]] and safe practice teaches nothing; it grants the first technique, self-taught. **Reliable** is more of the same with worse odds, and the skill stops failing at the moment it matters. **Expert** is as far as practice alone can carry anybody, and it grants the second technique, taught by any competent practitioner who owes you or likes you. **Ceiling** is a hard wall that only a person can lift, and it grants the third technique — the one only that teacher has, and the relationship it cost.

**The twenty.** Combat: Marksmanship, Close Quarters, Demolition, Suppression. Field: Infiltration, Traversal, Navigation, Survival Craft. Technical: Systems, Bypass, Rig Maintenance, Diagnostics. Social: Negotiation, Interrogation, Deception, Command. Applied: Channelling, Trauma, Fabrication, Handling.

**Every ceiling is a person, and almost none of them takes money.** They want a favour, a sample, a second job, a body to demonstrate on, or your presence somewhere you would rather not be. That is the mechanic doing its job: progression becomes obligation, and a character at the top of their skills is a person carrying a great many debts and a very precise map of who holds them.

---

## Designed

**The sixty techniques.** Three to a skill, and each one is a named move rather than a number.

- **Marksmanship** — Steady Breath, Double Tap, *Called Shot*: name the plate, and the round finds the hole.
- **Close Quarters** — Doorway, Disarm, *Three Seconds*: the fight ends in the three seconds before it starts.
- **Demolition** — Shaped Charge, Load Path, *Controlled Collapse*: choose where it lands, and on whom.
- **Suppression** — Walk the Fire, Danger Close, *Battery Voice*: the fire mission arrives a round early, because the guns know your name.
- **Infiltration** — Unhurried, Second Entry, *Blind Spot*: you know where the lattice cannot see, and you are standing in it.
- **Traversal** — Carry, Rooftop, *Rider's Eye*: read a route from above, the way a thing that flies would.
- **Navigation** — Dead Reckoning, Sign, *Agreement*: a route is a recent agreement with the ground, so you find the crossing that moved.
- **Survival Craft** — Dry Fire, Clean Water, *Marsh Sense*: predict a coordinated response before the instruments confirm it.
- **Systems** — Readout, Terminology, *Interlock*: reverse an isolation command that was meant to be final.
- **Bypass** — Quiet Lock, Ward Seam, *Credential*: a paper that works exactly once, anywhere.
- **Rig Maintenance** — Tighten, Honest Read, *Overrun*: push a rig past service once, safely, knowing you will never do it twice.
- **Diagnostics** — Glance, Two Phases Early, *The Recruit's Question*: see what an implant is really for, and who it reports to.
- **Negotiation** — Terms, What They'll Take, *Close*: a contract that holds afterwards, because both sides think they won.
- **Interrogation** — Silence, Tell, *Demonstration*: you will not enjoy learning this, and they will not enjoy you knowing it.
- **Deception** — Cover, Paper, *One Signature*: the mark that has kept born casters alive for twenty years.
- **Command** — Rally, Triage, *Written Defeat*: fall back with the line intact, after the horn. Canon's law is that defeat is written, never reloaded.
- **Channelling** — Envelope, Sustain, *Edge*: run at overcharge without crossing, for as long as your nerve holds.
- **Trauma** — Pressure, Four Minutes, *Field Surgery*: the thing that needed a table, done on the ground, while it is still being shot at.
- **Fabrication** — Patch, True, *History*: a piece good enough to be named, and to be taken.
- **Handling** — Calm, Sample, *Rung Read*: an animal's state on sight, and what your own party did to put it there.

**Who lifts each ceiling.** Six teachers already exist in the codex: [[mara-quill]] for Navigation, [[nalia-reed]] for Survival Craft, [[tomas-vey]] for Systems, [[jaro-fen]] for Negotiation, [[keira-ansel]] for Handling, and [[the-kestrel-commander]] for Command. Twelve more are written as [[the-range-instructor]], [[the-drill-master]], [[the-blast-foreman]], [[the-tempest-battery-officer]], [[the-bureau-analyst]], [[the-captured-rider]], [[the-ashline-fixer]], [[the-infuser-tech]], [[the-clinic-surgeon]], [[the-asis-officer]], [[the-paper-hand]], and [[the-foundry-master]] — each with a home that is either written or openly a placeholder, because the codex is still growing and a teacher can move to the region that eventually deserves them. Channelling's ceiling is a hidden Concordance elder who stays deliberately unnamed, and Trauma's sits with [[the-kestrel-medic]], who lifts it herself.

**No region owns a skill.** Six ceilings currently sit in [[bloomfall-reach]] and five in [[port-arcadia]] because those are the regions that exist, not because they should carry the roster. Every region written adds at least one ceiling, and no skill has only one place it can be lifted.

**How a rank announces itself,** since no number ever appears: Green to Practised, a squadmate stops watching you do it. Practised to Reliable, people stop asking whether you can. Reliable to Expert, somebody asks you to show them. Expert to Ceiling, the teacher says one sentence, and it is never *well done*.

For writers: a technique is a scene, not an unlock. Write the favour the teacher wants before you write the lesson, and write the lesson as something that happens to the player rather than something they buy. If a technique arrives without a person attached, it is in the wrong game.`;

const sixPillars = `Nobody in this world says *I do magic*. They say what they are certified in, and at what tier.

Six extremely broad fields, each holding the licence classes that actually get certified: [[thermodynamics]], [[kinetics]], [[structure]], [[biologics]], [[cognition]] and [[resonance]]. A pillar is a field. A class is a licence. An ability is what the licence lets you do. Twenty-seven classes and one hundred and eight abilities sit under the six, and every one of them has a licence number, a cast time, and a way of going wrong.

This is a classification layer above the schools, not a new way to hold magic. [[the-three-origins-of-magic]] bans a fourth origin and explicitly permits new schools, and all fourteen of the schools it named are below, under the names the licensing boards use.

---

## Designed

**Three tiers.** Licensed opens two abilities; Certified opens a third; Master opens the signature. [[meridian-arcane-institute]] certifies Licensed for a fee and a record. Certified needs practice and a certified practitioner. Master needs a ceiling teacher and a licence review that will ask about your corruption phase.

**Three classes, two pillars, one master.** A character holds at most three licence classes across at most two pillars, and masters exactly one. Disciplines are exclusive rather than additive: you cannot end the game holding all of them, and a respec bench does not exist anywhere in the world.

**The first class comes from origin.** Born — the bloodline sets the pillar, and the class declares itself under pressure, which is a scene. Gifted — the giver decides. Infused — chosen from a menu, which is a purchase. That difference is the whole texture of [[magic]] in one moment.

**Instant or channelled is a property of the ability, never of the pillar.** A channelled cast is a commit window nobody can shoot through, and Coordination decides whether it survives being jostled.

**Cost by tier:** 2 · 4 · 8 units of a born caster's pool, or 1 · 2 · 4 charges on an infused rig. A level-8 born caster casts a master ability twice and then sleeps. A rig with two doses casts it twice and goes dark.

**Overcharge** doubles the cost for more effect, and on a bad outcome it fails in the pillar's own way — the six failure modes are on the six children's dossiers. It is chosen anywhere, and it is ambient in [[bloomfall-reach]] whether anyone asked for it or not. Channelling's *Edge* technique is how a master runs at the line without crossing it.

**Unlicensed practice is a crime.** [[concordance-of-natural-casters]] hides the born, [[drone-surveillance-bureau]] logs everyone else, and [[abomination-containment-authority]] collects anyone who reaches phase 6. Every born caster begins the game as an unlicensed practitioner, which is why the prologue is where that quietly becomes somebody's business.

## The licensing spine

- **[[meridian-arcane-institute]]** certifies, across every pillar. Every licence in the registry was paid for in the currency the registry exists to regulate.
- **[[national-defense-directorate]]** employs — Kinetics as standard issue, Thermodynamics on the engineering rolls, infusion regulated officially and overused unofficially.
- **[[abomination-containment-authority]]** revokes and contains, and owns Structure's Containment class outright.
- **[[drone-surveillance-bureau]]** licenses Cognition, and sells the blind spots.
- **[[skybridge-transit-authority]]** gatekeeps Translocative as freight and customs.
- **[[ossuary-covenant]]** licenses Reanimative through its chapters — and its obsession is [[the-risen]], who rise with none of its people in the room and are therefore not its work at all.
- **[[crimson-choir]]** issues no licence for Hematic. It issues a debt.
- **[[aegis-extraction-consortium]]** holds the Bionic interface patents, so a licence to seat hardware is a licence to use theirs.
- **[[wardens-monster-hunter-guild]]** signs off Morphic material, because nobody else reads the canopy like they do.

Those are the holders *today*. [[the-faction-map]] has an open seat, the players may found a power, and new nations will be written — a licence is a slot with a current holder, and this design has to survive the day the players' own faction starts issuing Kinetics licences.

**Only two classes have no licence anywhere: Hematic and Coercive.** Neither is in Resonance. The horror in this setting is not the spooky pillar; it is the medical one and the one about minds, and it is worse for being ordinary — a field surgeon and an officer, doing recognisable versions of their actual jobs.

**The origins, institutionally.** Born casters are hidden by [[concordance-of-natural-casters]], fought for by [[liberation-of-the-gifted]], and priced by [[aegis-extraction-consortium]]. Gifted casters are venerated and uncomfortably collected by [[church-of-the-first-gift]], and courted by [[the-pale-embassy]], whose gifts are always fairly priced and never at the price you thought. Infused casters are regulated by the Directorate, manufactured with expiry dates by [[helix-arcanobiotics]], and supplied by [[the-harvest-economy]] or its black arm, [[black-tithe-syndicate]]. A gifted player character carries a question the Church would kill to answer and the Embassy already knows the answer to: which giver.

For writers: name the class, never the pillar. A character is *Licensed II, Kinetic* or *certified in Containment* — the pillar is the shelf the licence sits on, and only an instructor or a bureaucrat talks that way.`;

const thermodynamics = `Energy moved from where it is to where somebody wants it. The most common certification in the world, and the reason foundries and demolition crews are full of casters.

**Licence** — industrial grade, carried on the [[national-defense-directorate]]'s engineering rolls. Widely held, lightly policed, and the first licence most working people ever meet.

**Four classes.** *Thermal* and *Cryogenic* — canon's elemental, split by what it does to matter. *Electrical* — the same school pointed at circuits. *Radiant* — light itself, and the newest of the four.

---

## Designed

**Thermal** — Ignition, a thing lit at distance with no visible source · Warmth, a squad's hands kept working in the cold · **Flashover**, a room's air igniting at once, doors first · Master: **Sublimation**, skipping the liquid phase, so a body goes to steam inside armour that stays sealed.

**Cryogenic** — Freeze the Ground · Cold Store, which keeps a body, a sample or a dose · **Brittle**, taking a plate or a limb past brittleness so the next hit shatters it · Master: **Vitrify** — glass bows before it breaks, which is canon's arcane scar, on anything you like.

**Electrical** — Kill the Circuit, holding doors, cameras and ignition off · Jump, starting a dead machine once · **Ground**, deciding what is grounded, spine included · Master: **Conduction**, in which every conductor in the room becomes one circuit and you close it.

**Radiant** — Overexpose · Dark Flash, a signal only your squad sees · **Bleach**, light delivered as a dose, with nothing looking damaged for six hours · Master: **Noon**, no shadow anywhere in the volume, so nothing Occlusive works and nothing hides.

**Pushed.** Overcharge Ignition and what lit was your sleeve. Overcharge Warmth and the hands keep working while the skin does not. Flashover includes the room you are standing in. Sublimation is beautiful inside sealed armour, and you are wearing some. Freeze the Ground takes the road with it, for a season, and [[persistent-damage]] keeps it. Cold Store keeps your hand. Brittle finds your own plate first. Vitrify bows the glass in your optics. Kill the Circuit kills yours — augments vent, rig goes dark. Jump starts it and does not stop it. Ground makes you the ground. Conduction closes the circuit with your spine. Overexpose blinds you for a minute; Dark Flash is seen by the enemy's optics too; Bleach lands its dose on the nearest skin, which is the caster's; Noon leaves no cover for either side.

**Counterplay.** Wet ground, Cryogenic, and a Containment Seal between you and it. Shoot the rig — a leaking dose ignites. Against Cryogenic: Thermal, movement, and Inertial Brace for footing. Against Electrical: unplug, so there is no augment and no rig to vent, and stand on a gridcore ground line. Against Radiant: eyes closed on the call, Occlusive Dim, or smoke.

**How the pillar fails:** it does not stop at the target. Everything wet within reach changes state at once, including whoever is holding on to you.`;

const kinetics = `Momentum and weight, borrowed briefly. The pillar that changed infantry doctrine, and the one every army trains for first.

**Licence** — standard military issue through [[national-defense-directorate]]. The most widely held combat certification of the war, which means a Kinetic licence tells you almost nothing about a person except that somebody once put them in a uniform.

**Four classes.** *Kinetic* — canon's force/kinetic. *Gravitic* — canon's gravity. *Inertial* and *Ballistic* — the two the war invented, one for standing still and one for what is already in the air.

---

## Designed

**Kinetic** — Shove · Catch, stopping one thrown thing · **Arrest**, a round caught in flight and held · Master: **Return**, held momentum sent back to whoever fired it, at speed, starting from inside them.

**Gravitic** — Lighten, which is every salvage crew's first hire · Weight · **Plumb**, in which down is now that way and a stairwell becomes a well · Master: **Well**, a volume where everything falls toward one point and stays. It persists after you leave.

**Inertial** — Brace, so you do not get moved by blast, current or anybody bigger · Set · **Anchor**, stopping a moving vehicle, badly · Master: **Stillpoint**, where nothing in the volume moves that you did not move.

**Ballistic** — Correct · Carry, one more decision for something already thrown · **Curve**, a round around a corner · Master: **Convoy**, in which every round in the air goes where you are looking.

**Pushed.** Shove puts him through the wall and you through the opposite one. Catch means you caught it and cannot let go. Arrest leaves the round travelling, in your hand. Return arrives from inside the wrong person. Lighten lifts the load, then the crew. Weight finds your own boots. Plumb points down at you first. A failed Well will not close, and the locals route around it for forty years. Brace means you cannot move either; Anchor stops the vehicle and not its cargo; Stillpoint includes you. Correct corrects onto the nearest warm thing, Carry lets the round decide, Curve comes back around the corner, and Convoy sends every round where you looked — which was at your medic.

**Counterplay.** Stormglass rounds, because an Arrested crystal round is unstable and detonates in the hand. Blades, because nothing is in flight to catch. Inertial Brace and anchor lines against Gravitic, and distance, since Gravitic is short-ranged by design. Against Inertial, wait — every master ability in it is channelled — or hit the channel and make them pass a Coordination check. Against Ballistic, a Containment Seal, Occlusive Fade to break the look, or simply not being where they are looking.

**How the pillar fails:** what you take, you keep. Held force spends itself within seconds, and if you do not choose a target it chooses you.`;

const structure = `Matter and boundaries — what holds together, what comes apart, and what is permitted to cross a line.

**Licence** — [[abomination-containment-authority]] for Containment, whose crews are canon's containment casters; industrial grade for everything else. Hard to obtain, harder to keep, and a revocation follows you from city to city.

**Four classes.** *Containment* — canon's warding. *Tensile* — the shaping and repair work, named so it never collides with the Fabrication skill. *Occlusive* — canon's shadow. *Corrosive*, which is new, and which is how a lock opens without a charge.

---

## Designed

**Containment** — Seal, a doorway or hull that holds as long as you do · Hold · **Quiet**, no sound leaving · Master: **Muzzle**, where nothing leaves at all: not light, not sound, not blood, not air if you are careless.

**Tensile** — Patch, a field repair with no bench · Set, matter holding a shape while you keep telling it · **Brace**, a wall that gains capacity [[structural-integrity]] can read · Master: **Frame**, a structure built from what is lying there, standing while you stand.

**Occlusive** — Dim, killing the light without touching the source · Fade · **Shroud**, so a squad casts nothing and no ward keys on them · Master: **Umbra**, in which you are not there to be warded against.

**Corrosive** — Open, a silent lock or weld · Etch · **Unbind**, a material that stops being one piece · Master: **Dissolution**, which removes the reason a structure is a structure, and brings it down the way it went up, reversed.

**Pushed.** A failed Seal seals against you; Hold makes the jar the room; Quiet takes your own squad's voices; Muzzle takes the air. Patch closes over the wound as well; Set holds your shape; Brace braces the wall and not the floor; Frame stands while you stand, so you cannot sit down. Dim includes your optics; Fade fades you from your own squad; Shroud means the squad receives nothing either — no Empathic Anchor, no Warmth, no Close; and Umbra means you are not there to the Forge, briefly, so do not die inside it. Corrosive failures open the frame and the wall, put the mark in you, unbind your own plate, and reverse the construction of the floor you cast from.

**Counterplay.** Corrosive Unbind against Containment, or simply waiting, since a seal holds only as long as its caster. Fire and Demolition's Load Path against Tensile. Radiant Noon, thermal optics, or an Empathic Read against Occlusive — feeling what cannot be seen. Tensile Brace, distance, and gridcore-framed structures against Corrosive.

**How the pillar fails:** boundaries are symmetrical whether you intended them to be or not. People have died inside their own ward with the door standing open.`;

const biologics = `Living systems — repair, alteration, and the one child no state will license. Nothing in this pillar creates tissue. It only ever moves it, which is the sentence the whole field turns on.

**Licence** — [[meridian-arcane-institute]]'s teaching hospitals certify, a medical board revokes, and this is the most-revoked registry that exists. [[wardens-monster-hunter-guild]] signs off Morphic material. [[aegis-extraction-consortium]] holds the Bionic interface patents.

**Six classes.** *Regenerative* — canon's healing. *Morphic* — shapeshifting. *Necrotic* and *Xenic*, both new. *Bionic*, restored from canon's bionic/technomantic pair. And *Hematic* — canon's blood magic, which no state licenses and [[crimson-choir]] does not need to.

---

## Designed

**Regenerative** — Close, stopping a four-minute bleed · Knit · **Debridement**, a wound closed from elsewhere on the same body, where the donor site is the entire conversation · Master: **Rebuild**, a limb made from the patient's own mass, so somebody walks away lighter.

**Morphic** — Adjust, an hour of grip or lungs or night sight · Wear, one trait from harvested material · **Graft**, a trait that holds a week with the Wardens signing the material · Master: **Assume**, a whole body's shape taken from what you killed, which comes off on schedule or does not.

**Necrotic** — Spoil · Wither, a wound that will not close · **Hasten**, all the years a thing has not had, at once · Master: **Season**, a district's harvest gone. It is an economy weapon and everybody treats it as one.

**Xenic** — Calm · Provenance, telling you what a creature is, what it was, and in the Reach what drove its rung · **Herd**, changing a migration's next move · Master: **Bellwether**, where a region's animals read you as the signal — and the Reach already has [[the-bellwether]], which noticed.

**Bionic** — Accept · Seat, hardware taking with no scar at the boundary · **Interface**, an implant answering to a body it was not built for, at which point Aegis's lawyers are informed · Master: **Conversion**, a body that is mostly hardware — and the Forge rebuilds only the meat, so you come back a fraction. That is [[cybernetic-ascendancy]]'s dream and its trap in one ability.

**Hematic** — Staunch · Draw · **Levy**, every open wound in range, which opens none and distinguishes nobody · Master: **Transfusion**, one body's vitality into another. The Choir's loan, made literal.

**Pushed.** Close closes the airway. Knit knits wrong, and permanently if you bind afterwards. Debridement chooses the donor site for you. Rebuild takes the limb from the surgeon. Adjust leaves the night sight and makes daylight the problem; Wear wears you; a failed Graft does not come off; Assume comes off on its own schedule, mid-crossing. Necrotic failures spoil your own supply, put the wound on the caster, land the years on the nearest living thing, and — at Season — take a district's harvest and its dead at once, which is when the Covenant calls. Xenic failures calm the caster, teach you what *you* are, route the migration through you, and make a region's animals read you as the signal. Bionic failures accept the toxin too, seat deeper than intended, hand the implant to somebody else, and at Conversion bring you back a fraction — and the fraction remembers. Hematic failures reopen with the next wound, draw from the caster's own, count the caster in the Levy, and call the loan.

**Counterplay.** Necrotic Wither and Hematic Levy against Regenerative, or simply targeting the medic, since a squad's regeneration is one person. Xenic Calm and the Wardens' tranquilliser doctrine against Morphic. Regenerative, Cold Store, and burning the vector against Necrotic. Noise against Xenic — it is not an attack, and the counter is being louder than the animal. ELECTRICAL vents Bionic, and an Aegis patent lockout kills an interface remotely, which is the Ascendancy's recurring nightmare. Against Hematic: do not bleed, seal the wound, or buy the Choir's debt off them, which is the only counter that ever ends it.

**How the pillar fails:** it optimises for the outcome rather than the patient, and it selects the donor site itself.`;

const cognition = `Minds, born and made. The pillar includes machines, because in this world a machine that has taken an order has something close enough to a mind to be worth asking.

**Licence** — [[drone-surveillance-bureau]], officially neutral infrastructure, which also sells the blind spots. Every trade house on the coast holds one unofficially. One class below has no licence anywhere and never will.

**Five classes.** *Perceptual* — canon's illusion. *Technomantic*, restored from canon's pair. *Empathic* and *Memetic*, both new. And *Coercive*, which is what canon's command magic is actually called once you admit what it does.

---

## Designed

**Perceptual** — Blur, which makes you unmemorable rather than invisible · Static · **Jam**, one sense closed for everyone in range · Master: **Erase**, where they cannot retain you and every glance is the first.

**Technomantic** — Ask · Wake, a dead machine answering once · **Handshake**, one question about the last person who gave it an order · Master: **Testimony**, everything it has ever been told, in order. It is what [[nag]] gives you if you push, and pushing is the whole scene.

**Empathic** — Steady · Read, what a room feels slightly before it feels it · **Anchor**, a companion's Composure held to yours · Master: **Communion**, a squad sharing one nerve — so when one breaks, all of them do.

**Memetic** — Suggest · Forget · **Seed**, an idea that arrives with a memory of always having been there · Master: **Doctrine**, a settlement believing something by morning. The Bureau would pay anything for it.

**Coercive** — Halt · Yield · **Imperative**, one instruction obeyed once, and they remember choosing it · Master: **Muster**, a line obeying as though it chose to. Illegal everywhere and denied by everyone who has ever used it.

**Pushed.** Blur makes you forget yourself for a minute. Static closes the sense in you. Jam takes your squad's. Erase means you cannot retain yourself, and every glance in a mirror is the first. Ask asks you; Wake wakes it, displeased; Handshake tells you about the last person and then about everyone; Testimony includes what it was told about you. Steady takes the edge into the caster; Read cannot be switched off; Anchor breaks yours instead of holding theirs; Communion means the horn breaks all of you at once. Memetic failures put the suggestion in you, make you forget the cast, seed the idea in your own memory, and at Doctrine convince you along with the settlement, by morning. Coercive failures halt you, open your hand, make you obey your own instruction, and at Muster have the line obey *you* as if it chose to — and then remember that it did not.

**Counterplay.** Instruments beat Perceptual, because a camera retains you when a person cannot, and the lattice does not blink. Unplugging beats Technomantic: a machine that was never given an order has nothing to say. Composure and distance beat Empathic, and a squad that has already broken has nothing left to share. Written orders and a Returnee's long memory beat Memetic. Against Coercive: Composure at its ceiling, an Unregistered's nerve, or killing the caster, since it is channelled and short.

**How the pillar fails:** the channel closes both ways, and you will not notice which side of it you have ended up on.`;

const resonance = `Soul and continuum. The pillar nobody fully understands, holding the disciplines that touch the same substrate a Forge, [[the-veil]] and an Echo all touch.

**Licence** — Forge-adjacent for Echoic; [[skybridge-transit-authority]] for Translocative, as freight; [[ossuary-covenant]] chapters for Reanimative; and Temporal on ninety-day provisional only, never above phase 1. The most restricted tier in the registry, and the rarest licence in the game.

**Four classes.** *Echoic* — canon's spirit. *Translocative* — summoning. *Temporal* — time-fracture. *Reanimative* — necromancy, and the class most often mistaken for something it is not.

---

## Designed

**Echoic** — Presence, telling you whether an Echo is in the Core and lit · Register, which Forges hold you and which hold them · **Echo Read**, the shape an ending left, inside a register only; outside one, there is only the roar · Master: **Call**, a reclamation beginning from where you stand. The Forge still does the building. You rang the bell.

**Translocative** — Fetch · Send · **Consignment**, an object or a person, where arrival is negotiated with something that does not negotiate · Master: **Crossing**, a whole squad — the Veil's discourtesy at close range.

**Temporal** — Steady the Hand, half a second returned · Second Look, the last three seconds again, for you alone · **Recoil**, a wound returned to the state it held seconds ago, because the tissue forgets · Master: **Rewind**, a room, ten seconds. You remember. They do not.

**Reanimative** — Still · Stand, a body working a shift · **Last Order**, its final instruction once and correctly, and whoever gave it is usually nearby · Master: **Witness**, where the dead testify and the Covenant's lawyers make it admissible.

**The Risen are not this class's work.** [[the-risen]] rise with nobody in the room, which is precisely why they are the Covenant's nightmare rather than its product. Never write a Reanimative caster as the cause of a Risen, and never let a licensed chapter be blamed for one without the story knowing it is a false charge.

**Pushed.** Presence makes you feel every Echo in the Core, lit or not. Register shows you a Forge you never bound at. Echo Read gives the roar. A failed Call begins somebody else's reclamation. Fetch fetches you; Send is away, unspecified; Consignment negotiates and loses; Crossing takes the floor, and the room, with you. Temporal failures take the half second from your own future, loop the three seconds again and again, make you forget along with the tissue, and at Rewind leave you remembering ten seconds you did not have. Reanimative failures stop what you started mid-cast, have the body work your shift, have the nearest body obey your own last order, and at Witness have the dead testify against you.

**Counterplay.** Distance from a Core, a Containment Muzzle so no resonance leaves, or an Unregistered, who offers nothing to read. Inertial Set, Containment, and Gravitic Weight against Translocative — heavy things arrive late. Against Temporal there is nothing reliable, which is exactly why the licence is provisional. Against Reanimative: burn the body, or bring lawyers.

**How the pillar fails:** you reach for one and hear all of them at once, and some of them have not finished.`;

const cybernetics = `The only capability in the game [[the-soul-forge]] cannot see.

A binding records a biological pattern — *Resonance detected. Biological pattern acquired.* — and a vessel is built to that pattern. The Forge only ever records meat. It has no way to reproduce an implant, and re-binding does not teach it one: bind again after losing an arm and the blueprint records the loss, not the replacement. So every reclamation returns you to the last flesh body you had, and every augment you were wearing is still in the corpse, waiting for somebody with a bone saw and a reason.

**That is the political point, not a classification nuisance.** [[reclamation]] already says the people who keep their injuries are those who cannot afford Essence, cannot reach a working Forge, or bound again and made the loss permanent — and that every prosthetic in this setting belongs to somebody in one of those three positions. Augmentation is therefore not a complement to reclamation. It is the *alternative* to it, and it sells hardest exactly where Forges do not reach: the unbound, the exiled, the Forge-poor, and every settlement whose Core is damaged or gone. [[cybernetic-ascendancy]]'s pitch is not *become more than human*. It is *stop renting your body from whoever holds the reserve*.

---

## Designed

**Five slots.**

- **Sensory** — *Overlay*: Acuity one effective rung higher while it is in you, and the world renders more. Bureau-readable: everything you see, somebody can subpoena.
- **Limb** — *Replacement*: Conditioning or Coordination one rung higher. Financed, and repossessable, which turns *a plate is gone* into *a limb is gone*.
- **Internal** — *Reserve*: Resilience **or** Conductivity one rung higher, chosen at fitting, plus the trickle — one pool unit a minute, which in a long fight is the difference between the last cast and not having it.
- **Interface** — *Socket*: a non-caster runs one Licensed-tier [[cognition]] ability through it — Ask, Steady or Suggest — off a capacitor cell, one use per cell. This is canon's bionic-school casting research, shipped, and it is the Ascendancy's real product. [[aegis-extraction-consortium]] owns the interface, so you are running somebody's patent through your skull.
- **Cosmesis** — *Passing*: corruption tells hidden from instruments and strangers, completely. Never from people who know you. Never from the Forge: die, and it rebuilds the meat and not the mask, in front of everyone.

**Three suppliers, three prices.** [[foundry-workers-union]] shops sell functional, heavy, repairable work, and canon's cheap ones cost autonomy — you are visibly a person who could not pay, and the Union does not do favours it cannot call in. [[cybernetic-ascendancy]] clinics do excellent work and genuine medicine, and canon names the collection method as a character type: the repossession agent, because augments are financed and the Ascendancy collects. [[helix-arcanobiotics]] sells living enhancement with an expiry date, which a Forge *can* record, because it is tissue — the one advantage biology keeps over chrome.

**Financing** runs at a tenth of the piece's value a week, and four missed payments bring the agent, who knows where you bind. Recovering a piece from a corpse takes ninety seconds and Engineering at licensed rung — otherwise it takes [[bone-market-families]], who have been collecting inherited debts for longer than most of the states that outlaw them. [[iron-saints-pmc]] is the military client, fielding cyborg shock teams that fought for Pearl on [[the-starting-island]].

**The Ascendancy is wrong, and the way they are wrong is the best thing about them.** Their programme asks whether the seven phases can be engineered around by replacing the flesh. They cannot be: corruption is not in the flesh, nothing chemical is present, and it survives [[reclamation]] into a body that is brand new. But every corruption tell — tremor, veining, appetite, sensitivity — is *expressed* in tissue, so replacing enough tissue stops the tells appearing. A heavily converted phase-five presents as clean to every instrument and every experienced eye in the room. The Ascendancy has built the finest corruption concealment ever devised and mistaken it for a cure, and their converts are simultaneously the proof and the refutation. The fully-converted elder whose humanity is a philosophical position may be considerably further along a ladder nobody can read on him any more.

For writers: chrome is a debt with an address. Before you give a character an augment, decide who financed it, who can repossess it, and who would collect it out of the body — and remember that the piece is still in the corpse while its owner is standing somewhere else, wearing the arm they were born with.`;

const suspicion = `Three kinds of reader, four things they read you by, and one score per institution. Stealth and social play are the same system seen from opposite sides.

One rule governs all of it: **instruments and institutions can be beaten; people cannot.**

**Instruments** — a phase-reader at a gate, an assay in a clinic, the [[drone-surveillance-bureau]] lattice over a street, a Forge readout. They read exactly what they were built to read and nothing else, so a forged scan, cosmesis, or a bought blind spot beats them. What never beats them is hoping: the lattice does not blink, it only has gaps.

**Strangers** — hands, veins, eyes and behaviour, filtered by distance and light. A sergeant with Acuity 6 reads a tremor at three metres; a recruiter reads veining in good light at five; anyone at all reads Appetite in one conversation. Distance, bad light, long sleeves in the tropics that everyone understands and nobody mentions, Perceptual Blur, and held Composure all work. High Acuity does not care: a stranger at rung 8 is a person you should not be standing near.

**People who know you** — everything, over time, and nothing beats it. A companion who has watched your hands for a month reads the phase off the way you reload. Suspicion grows independently of the disguise, so the only way to stop being read by a friend is to stop having one.

---

## Designed

**Four channels.** *Hands* — tremor, a changed signature, a reload with a rhythm in it; three metres, any light; closed by gloves or a cosmesis sleeve. *Skin* — veining, and burn scars that are wounds rather than tells, which a medic can distinguish and a sergeant cannot; five metres, good light, nothing in the dark. *Mouth* — Appetite's question about the next issue, and Drift's word from a language you never learned; one conversation is enough, and a companion at phase 3 is a broadcast whose only fix is distance. *Behaviour* — looking at the treeline before the dogs, walking into a room like a soldier, a Returnee queuing wrong, a Chartered's regularity. Behaviour is the channel Acuity opens and cosmesis cannot close.

**One score per institution, and one of them is for sale.**

- **[[arcadian-soverign-guard]]** at the gates — raised by a noise reading, the word *issue* in earshot, an undeclared caster, or a named piece somebody recognises. At threshold: secondary inspection, then the register, then the [[exclusion-area]] closed to you, which is the jungle closed to you. Sergeants forget faces slowly; the register never does.
- **[[drone-surveillance-bureau]]** — raised by every passage under the lattice and every query anyone bought about you. It does nothing itself. It sells the record, and that is the score that follows you between institutions.
- **[[abomination-containment-authority]]** — raised by a phase-five seen or a Turning reported. At threshold: a cordon team, tranquilliser doctrine, and a sealed transport. It never forgets anyone who reached six.
- **[[aegis-extraction-consortium]]** and [[helix-arcanobiotics]] — raised by an inconclusive assay, a Conductivity reading above seven, a Carrier bloodline, or a born caster in your party. At threshold: an offer, then a better offer, then a catcher crew. You are a line item, and line items are not forgotten.
- **[[wardens-monster-hunter-guild]]**, [[desert-nomad-compact]] and [[verdant-marsh-clans]] — raised by an uncertified kill, a route used without agreement, or a sample taken wrong. The door closes and the canopy stops being read for you, and it reopens only by personal agreement, which means one conversation, if you can get it.
- **Your companions** — raised by being lied to, watching you dose, or being sold. At threshold: hesitation on the order wheel, then refusal, then an empty seat. Forgiven only by the scene that earns them back, which a writer has to actually write.

**The warning law.** The sheet shows no numbers and phase 7 ends the character, so the world carries the warning instead of the interface: **every character who can read the tells must say so**, and the closer to six, the less politely. Medics, checkpoint officers, companions, quartermasters, strangers in a bar. A settlement whose people are not visibly reacting to a phase-five is a scene written wrong.

**Stealth is this same table with the lights off.** Not being seen and not being read are one system. The lattice is a stealth layer with blind spots for sale; the jungle canopy kills drone coverage, so the green is the one place the score does not accrue; Occlusive Fade makes optics read you wrong and Umbra stops wards keying; and Infiltration's *Unhurried* is the discovery that moving slowly reads as belonging. Against all of it stands Arcadia's own rule — nobody leaves the walls unrecorded. You can avoid being seen, or you can avoid being remembered, and almost never both.

For writers: there is no stealth meter and no disguise bar. There is a body with four channels, readers at ranges, and scores that live inside institutions rather than on the player. What a player learns is which streets stop being polite, which companion to keep out of earshot at a gate, and which of their friends has stopped looking at their hands.`;

const woundModel = `There is no health bar. There are states a body can be in, a clock, and five kinds of damage that each want something different from a plate.

A diegetic sheet forbids hit points, and canon already refused them for buildings — [[structural-integrity]] uses load paths. Bodies get the same treatment: a wound is a state with a location, Resilience decides how many states you can hold and how long the last one lasts, and every state is something a squadmate can see on you from across the street.

---

## Designed

**The six states.**

- **Grazed** — cosmetic, and a Composure tick, because the world just got less legible. Clears in a minute, or over a real meal.
- **Hit**, with a location: head, torso, arm, leg. If there was a plate there, the plate is gone instead of you. Resilience sets how many Hits you take before Down — one plus a third of the rung, so Resilience 3 takes two and Resilience 9 takes four.
- **Bleeding** — a Hit that is still going. It halves the Dying clock when that clock arrives.
- **Broken**, a limb: an arm means no two-handed weapon and no channelled cast; a leg means no sprint and no Traversal. Untreated for a day it becomes a [[lasting-wounds]] entry — a limp, a stiff hand, a scar with a date — and if you bind again afterwards it is in the pattern for good.
- **Down** — cannot act, and the Dying clock starts at Resilience in minutes, floor of two, halved if Bleeding. Trauma's *Four Minutes* adds four; *Field Surgery* stands you back up at Hit; a companion carrying you does not stop the clock, it moves it.
- **Dead** — the clock ran out. The Echo lights in every Forge that holds you, and the body stays where it fell with everything on it, which is where [[reclamation]] takes over.

**Five damage types, five different arguments with a plate.**

- **PHYSICAL** — the plate game. A plate absorbs one Hit and is gone; the next round finds the hole. Breaks kit durability. Leaves a hole [[persistent-damage]] keeps.
- **FIRE** — ignores half a plate, and a FIRE-warded plate ignores it back. Adds Burning, a clock that keeps adding Hits until it is out. Doses cook off, and a leaking rig is a fuse.
- **ELECTRICAL** — through the plate to whatever conducts. Stuns: a Coordination check or you drop what you are holding. Vents rigs and augments, charges out as pale light, and puts chrome offline for a minute. It is the one type built to fight the infused and the augmented, and it leaves nothing visible, which makes it the most deniable damage in the game.
- **ARCANE** — ignores the plate entirely, and nothing conventional resists it. Leaves a scar that reads as itself, and canon's own signature: gravity forgetting itself, particles distorting. If a spell hit it, a reader knows.
- **TOXIC** — does not care about the plate; it cares about the air. A clock that Resilience resists and Chemistry's antitoxin stops. Filters matter, and [[blackweir-resin]] in a rig is the difference between a bad night and a body that keeps dying after the fight.

**Which pillar deals which.** PHYSICAL comes from all four classes of [[kinetics]], and from [[structure]]'s Corrosive by what it leaves standing — and from Cryogenic, which is why there is no COLD type: its signature is *vitrify, then strike*. FIRE comes from [[thermodynamics]]' Thermal and Radiant. ELECTRICAL from Thermodynamics' Electrical class and from a discharged capacitor cell. ARCANE from all four classes of [[resonance]], and from a stormglass round, which is the one way a non-caster puts arcane scarring on a wall. TOXIC from [[biologics]]' Necrotic and Hematic. [[cognition]] deals no damage at all, which is correct and stays that way.

**Two laws the simulations produced, written here so nobody has to rediscover them.** A head Hit with no helmet plate is Down, which is what makes a helmet the first plate anybody buys and a called shot the last technique anybody learns. And **a rig hit mid-channel is an automatic overcharge failure** — the pale light vents, the channel collapses, and the pillar's own failure mode lands on the caster. Instant casts merely fizzle.

For writers: name the state, never a number. *He is Bleeding and his arm is Broken* is a sentence a squad shouts; *he is at forty percent* is a sentence this world does not contain.`;

const kit = `The tenth ledger, and the only one you lose every time you die. [[reclamation]] moves a soul and never a bag, so what is on you is what is on your corpse.

Canon names equipment as one of the three roads to power in [[character-progression]] and never wrote the dossier. This is it: weapon families, plates, rigs, reserves, rounds, and the rule that makes a piece worth a quest.

**No encumbrance meter.** Weight is Conditioning's driver and Conditioning's limit at the same time — carry more than your rung supports and the vignette closes a stair earlier, the sprint ends sooner, and a medic tells you so. Everything in the loadout is a thing that breaks, a thing that is counted, or a thing somebody will take off your body.

---

## Designed

**Eight weapon families.** *Rifle*, the default and Contract Security's issue, which jams on a stormglass round one time in ten and a conventional one in two hundred. *Suppressed carbine*, the scout's whole argument, whose suppressor breaks first — after which it is a loud carbine. *Marksman rifle*, the only family that rewards Acuity as much as Coordination, and whose optics ARCANE takes first. *Shotgun*, for doors and what is behind them, and the most honest weapon in the game. *Sidearm* — never the answer, always there, and the last thing a caster reaches for when the rig is dark. *Crew-served*, which needs two people, a position and a crate. *Blade*, which is silent, free, and offers a Kinetic nothing in flight to catch. *Thrown*, which is why Catch exists.

**Slots.** Two long weapons, or one crew-served and a friend. One sidearm and one blade — a character with neither has never been to [[shattermarket]]. Six plates: helmet, torso, two arms, two legs. A rig for the infused, a bag for the born and gifted. Two capacitor cells in reserve. And **at most one named piece at a time**, because named things get taken and carrying two is asking.

**Three kinds of round, and two of them are magic.** *Conventional* deals PHYSICAL and is the round you actually have. *Stormglass* deals ARCANE, comes from the same quarry the honest caster doses from and the Forge burns at four times the volume, and misfires because the crystal is unstable where the refined article is dependable — a rifleman dealing arcane damage, leaving glass bowed before it breaks. *Enchanted*, sigil-stamped on [[foundry-workers-union]] lines, deals FIRE, ELECTRICAL or TOXIC by ward, and a stamped casing at a scene names the line it came off. A rifleman firing stormglass and an infuser dosing on stormglass are buying from the same crate, which is why a party's ammunition argument and its casting argument are one argument with the quartermaster.

**Plates are holes with locations.** Armour does not lose protection everywhere; it loses a plate, and the hole is somewhere a person can aim. Every plate carries provenance — who fitted it, what hit it, what came out of it — and canon opens the game on exactly that image: a medic cutting a shard of [[stormglass]] out of the player's battered armour and setting it on the map table.

**Three grades of rig, and every grade is a truth grade.** *Standard* is canon's leaking, pale-lit apparatus, which reads high before it is: three lit, two delivered. *Sealed* closes the leak and is honest until it breaks. *Conductor-grade* — [[gridcore-alloy]] buses in a [[reserve-glass]] containment frame — reads true, delivers nearly all of it, and counts as one rung of Conductivity the body never earned. It is the only rig a caster trusts with their life, and the one everybody can see they are wearing.

**Reserves are capital, not recovery.** [[capacitor-tissue]] stores a charge and never generates one, so a cell is loaded before a fight from a pool or a dose, spent once, and decays inside a day. A body carries as many cells as its Conductivity allows before they start to leak. A capacitor cell is a spell in a can and a rifleman's only spell.

**What a region contributes.** Six of the codex's ten materials are Bloomfall's, because Bloomfall is the region with the most writing — [[gridcore-alloy]] as its conductor, [[reserve-glass]] as its containment, [[blackweir-resin]], [[sinkroot-fiber]] and [[quietwater-culture]] as its filters and cultures, [[capacitor-tissue]] as its reserve. [[the-starting-island]] contributes [[stormglass]] as its round. Every other region has the same five slots — conductor, containment, filter, culture, reserve — held open and empty: the inland ranges owe an ore and an honest seam, the desert owes relic alloys and glassed battlefield, the ocean owes pressure containment, the floating metropolis owes a grid reserve, and rift ground owes whatever Ashen contamination leaves behind — which is not [[dimensional-echo]], because that belongs to [[the-veil]].

**Nothing is named at the bench.** A named piece is an ITEM entry, and it is named by what happened to it. Fabrication's *History* technique makes a piece good enough to acquire one; [[veil-incursions]] supplies the canonical way one changes hands — the legendary rifle is an enormous advantage right up until it becomes the defender's legendary rifle — and [[bone-market-families]] are who end up holding whatever was in the body when it fell, chrome included. Six worked examples are on the shelf: [[shattermarket-plate]], [[tempest-shell-case]], [[the-southside-rifle]], [[ansels-sample-case]], [[choir-ledger-page]] and [[the-single-name]].

For writers: a named piece is never a stat. It is Standing you can carry — a door that opens because of what is in your hands, and a target for whoever wants that door. Write the person who recognises it, and the kit ledger writes the quest for you.`;

export const newSystems: NewSystem[] = [
  {
    slug: "enlistment",
    title: "Enlistment",
    summary: "Character creation as a scene: four questions from a Stormglass clerk, a service file that outlives you, and the eleven surfaces that replace every menu.",
    body: enlistment,
    meta: sys({
      category: "progression",
      parent: "character-progression",
      gameTag: "System.Enlistment",
      dependsOn: ["character-progression", "character-classes", "magic"],
      unlockArc: "the-island-is-already-lost",
      unlockStage: "Before the first minute — the desk on Ignit Island",
      pillars: ["A person asks the questions, and a file remembers the answers", "No menus: every surface is an object in the world", "Three of the four answers are one-way doors"],
      openQuestions: ["Does the clerk have a name, and does she survive the Strike?", "Can a player ever see their own service file, or only hear it read to them?"],
    }),
  },
  {
    slug: "attributes",
    title: "Attributes",
    summary: "Six rungs nobody ever sees — Conditioning, Coordination, Resilience, Acuity, Composure, Conductivity — and a level that is only ever spoken aloud as a price.",
    body: attributes,
    meta: sys({
      category: "progression",
      parent: "character-progression",
      gameTag: "System.Attributes",
      dependsOn: ["character-progression", "reclamation", "the-corruption-system"],
      unlockStage: "Day one",
      pillars: ["A level is a body, and the Forge is the only thing that says so", "Rungs rise by driver: pressure counts, safety does not", "Conductivity is the one attribute an instrument can read"],
      openQuestions: ["What raises Conductivity outside the Reach, for a character who never doses?", "Does an attribute ever fall from disuse, or only from injury and the ladder?"],
    }),
  },
  {
    slug: "skills",
    title: "Skills",
    summary: "Twenty skills, five ranks, sixty named techniques — and a ceiling only another person can lift, which turns the last rank of anything into a debt.",
    body: skills,
    meta: sys({
      category: "progression",
      parent: "character-progression",
      gameTag: "System.Skills",
      dependsOn: ["character-progression", "attributes", "companions"],
      unlockStage: "Day one; the first ceiling is found in Act I",
      pillars: ["Use under pressure, never safe practice", "The ceiling is a hard wall, and only a person lifts it", "Every technique has somebody's name on it"],
      openQuestions: ["Do unused skills decay, or only stay where they were left?", "Can a teacher be lost before they teach — and does the ceiling then move to somebody else?"],
    }),
  },
  {
    slug: "the-six-pillars",
    title: "The Six Pillars",
    summary: "Six fields, twenty-seven licence classes, one hundred and eight abilities — and the institutions that certify, employ, and revoke every one of them.",
    body: sixPillars,
    meta: sys({
      category: "progression",
      parent: "magic",
      gameTag: "System.Magic.Pillars",
      dependsOn: ["magic", "the-corruption-system", "attributes"],
      unlockStage: "Day one for the licensed; the prologue for everybody else",
      pillars: ["A pillar is a field, a class is a licence, an ability is what it lets you do", "Three classes, two pillars, one master — and no respec anywhere", "Every licence has a holder, and holders can change"],
      regionNotes: [{ region: "bloomfall-reach", note: "Overcharge is ambient here — the Reach pushes abilities nobody chose to push, so every pillar's failure mode is a local hazard." }],
      openQuestions: ["Which class does the players' own faction start issuing first, if they found one?", "Is there a fourth Resonance class nobody has survived long enough to register?"],
    }),
  },
  {
    slug: "thermodynamics",
    title: "Thermodynamics",
    summary: "Thermal, Cryogenic, Electrical, Radiant — energy moved from where it is to where you want it, and the most common certification in the world.",
    body: thermodynamics,
    meta: sys({
      category: "combat",
      parent: "the-six-pillars",
      buildStatus: "concept", // the 108-ability roster is the movable half of write 0’s split
      gameTag: "System.Magic.Thermodynamics",
      dependsOn: ["the-six-pillars"],
      pillars: ["Industrial before it was ever military", "It does not stop at the target"],
      openQuestions: ["Does a Radiant licence exist as its own certificate yet, or is it still filed under elemental?"],
    }),
  },
  {
    slug: "kinetics",
    title: "Kinetics",
    summary: "Kinetic, Gravitic, Inertial, Ballistic — momentum and weight borrowed briefly, and the certification every army trains for first.",
    body: kinetics,
    meta: sys({
      category: "combat",
      parent: "the-six-pillars",
      buildStatus: "concept", // the 108-ability roster is the movable half of write 0’s split
      gameTag: "System.Magic.Kinetics",
      dependsOn: ["the-six-pillars", "combat"],
      pillars: ["Standard issue, so it says nothing about a person", "What you take, you keep"],
      openQuestions: ["Whose doctrine invented Ballistic, and did they publish it or lose it?"],
    }),
  },
  {
    slug: "structure",
    title: "Structure",
    summary: "Containment, Tensile, Occlusive, Corrosive — what holds together, what comes apart, and what is allowed to cross a line.",
    body: structure,
    meta: sys({
      category: "combat",
      parent: "the-six-pillars",
      buildStatus: "concept", // the 108-ability roster is the movable half of write 0’s split
      gameTag: "System.Magic.Structure",
      dependsOn: ["the-six-pillars", "structural-integrity"],
      pillars: ["A revocation follows you", "Boundaries are symmetrical whether you meant them to be or not"],
      openQuestions: ["Can a Containment licence be reinstated after a revocation, and who has ever managed it?"],
    }),
  },
  {
    slug: "biologics",
    title: "Biologics",
    summary: "Regenerative, Morphic, Necrotic, Xenic, Bionic, Hematic — living systems, where nothing is created and everything is moved from somebody.",
    body: biologics,
    meta: sys({
      category: "combat",
      parent: "the-six-pillars",
      buildStatus: "concept", // the 108-ability roster is the movable half of write 0’s split
      gameTag: "System.Magic.Biologics",
      dependsOn: ["the-six-pillars", "lasting-wounds", "cybernetics"],
      pillars: ["Nothing here creates tissue; it only moves it", "The most-revoked registry that exists", "It selects the donor site itself"],
      openQuestions: ["Does a Hematic practitioner ever get a licence if a nation decides it wants one?"],
    }),
  },
  {
    slug: "cognition",
    title: "Cognition",
    summary: "Perceptual, Technomantic, Empathic, Memetic, Coercive — minds born and made, licensed by the Bureau that also sells the blind spots.",
    body: cognition,
    meta: sys({
      category: "combat",
      parent: "the-six-pillars",
      buildStatus: "concept", // the 108-ability roster is the movable half of write 0’s split
      gameTag: "System.Magic.Cognition",
      dependsOn: ["the-six-pillars", "companions"],
      pillars: ["A machine that has taken an order is worth asking", "Coercive is unlicensable, and everybody's officers use it", "The channel closes both ways"],
      openQuestions: ["What does a Memetic Doctrine cast look like from inside a settlement that has already believed it?"],
    }),
  },
  {
    slug: "resonance",
    title: "Resonance",
    summary: "Echoic, Translocative, Temporal, Reanimative — the pillar that touches the same substrate as the Forge, the Veil and an Echo, and is licensed hardest.",
    body: resonance,
    meta: sys({
      category: "combat",
      parent: "the-six-pillars",
      buildStatus: "concept", // the 108-ability roster is the movable half of write 0’s split
      gameTag: "System.Magic.Resonance",
      dependsOn: ["the-six-pillars", "the-soul-forge", "reclamation"],
      pillars: ["The most restricted tier in the registry", "The Risen are not this pillar's work", "You reach for one and hear all of them"],
      openQuestions: ["Does an Echoic Call ever reach a Forge that is holding somebody it cannot afford to build?", "Why is Temporal rare — scarcity of talent, or attrition?"],
    }),
  },
  {
    slug: "kit",
    title: "Kit",
    summary: "Weapons, plates, rigs, rounds and reserves — the one ledger death always takes, and the one where a piece becomes a quest by acquiring a history.",
    body: kit,
    meta: sys({
      category: "progression",
      parent: "character-progression",
      gameTag: "System.Kit",
      dependsOn: ["character-progression", "combat", "trade-and-economy"],
      unlockStage: "Day one — issued at the desk and counted aloud",
      pillars: ["What is on you is what is on your corpse", "Nothing is named at the bench", "One quarry, three customers"],
      regionNotes: [
        { region: "bloomfall-reach", note: "Six of the ten canon materials are the Reach's — conductor, containment, filters, culture and reserve. It is the filled row every other region's shelf is measured against." },
        { region: "the-starting-island", note: "Contributes stormglass as its round: the honest half of the trade, and the reason a rifle can jam on ammunition rather than a mechanism." },
      ],
      openQuestions: ["What does the floating metropolis put on the shelf — a grid reserve, or something nobody has thought of?", "Who repairs a conductor-grade rig away from the Reach?"],
    }),
  },
  {
    slug: "cybernetics",
    title: "Cybernetics",
    summary: "Five slots of chrome the Soul Forge cannot record — which makes augmentation the alternative to reclamation, and the finest corruption concealment ever mistaken for a cure.",
    body: cybernetics,
    meta: sys({
      category: "progression",
      parent: "kit",
      gameTag: "System.Cybernetics",
      dependsOn: ["kit", "reclamation", "the-corruption-system", "biologics"],
      unlockStage: "Act I — the first clinic on the mainland, with financing",
      pillars: ["The Forge never records chrome", "Chrome is a debt with an address", "The Ascendancy is wrong in the most interesting way available"],
      openQuestions: ["Does a fully converted body still have an Echo worth lighting?", "What happens the first time a repossession agent reaches a player at a Forge?"],
    }),
  },
  {
    slug: "suspicion",
    title: "Suspicion",
    summary: "Three kinds of reader, four channels they read you by, and one score per institution — the system where stealth play and social play turn out to be the same thing.",
    body: suspicion,
    meta: sys({
      category: "social",
      parent: "the-corruption-system",
      gameTag: "System.Suspicion",
      dependsOn: ["the-corruption-system", "attributes", "companions"],
      unlockStage: "The first gate with an instrument at it",
      pillars: ["Instruments and institutions can be beaten; people cannot", "Every reader who can see it must say so", "You can avoid being seen or avoid being remembered, almost never both"],
      openQuestions: ["Does a player ever get to buy their own record off the Bureau, and what does that cost?", "What is the first institution to notice a player who has never dosed at all?"],
    }),
  },
  {
    slug: "the-wound-model",
    title: "The Wound Model",
    summary: "Six states, one clock, five damage types — a body written the way this world's buildings already were, with no health bar anywhere.",
    body: woundModel,
    meta: sys({
      category: "combat",
      parent: "combat",
      gameTag: "System.Combat.Wounds",
      dependsOn: ["combat", "lasting-wounds", "attributes", "persistent-damage"],
      unlockStage: "Day one",
      pillars: ["States with locations, never hit points", "A rig hit mid-channel is an automatic overcharge failure", "Every state is legible from across the street"],
      openQuestions: ["Does a Broken limb treated late still enter the pattern if the character never re-binds?", "What is the shortest survivable Dying clock anyone has actually walked away from?"],
    }),
  },
];

// ===========================================================================
// Design layers — appended under prose the owner already wrote. Everything
// above the line in each of these dossiers is carried verbatim, and the loss
// check in the runner proves it word by word.
// ===========================================================================

export const layers: Layer[] = [
  {
    slug: "character-progression",
    note: "ten ledgers in three tiers, and the death test that sorts them",
    meta: { buildStatus: "designed", dependsOn: ["enlistment", "attributes", "skills", "kit", "the-corruption-system"], gameTag: "System.Progression" },
    append: `${DESIGN_MARKER}

**Ten ledgers, three tiers, and death sorts them.** A character is ten things. What each of them costs, and what happens to it when the body dies, is the whole spine of this system.

**Given** — settled before the story starts, with no progression and no price. *Species*: the only ledger with no cost at all, and the one strangers read first. *Background*: the door you came in through, chosen once. Both are **kept** at reclamation, because history is not stored in a Core and a vessel is built as what you are.

**Earned** — what play adds, each lost only by its own specific mechanism. *[[attributes]]*, which cost 11.7 Essence a rung to rebuild and are the one ledger **rebuilt to the last-bound pattern**. *[[skills]]*, which cost time and a teacher, and are **kept**, because a Forge cannot rebuild a life. *Disciplines*, which cost exclusivity and — for the infused — corruption, and are **kept**, because the bargain outlives the body. *[[professions]]*, which cost a moral ceiling the game charges you for, and are **kept**, though the workshop is where you left it.

**Carried** — held right now, and three of the four are moved by other people. *[[the-corruption-system]]*, **kept always**: nobody dies their way clean. *[[suspicion]]*, **kept**, and it grows on its own whatever the disguise does — a public death is evidence. *Standing*, **kept**, and the one ledger you do not write yourself. *[[kit]]*, **lost**, on the corpse where it fell.

One ledger rebuilt, one lost, eight untouched. That ratio is not softness; it is where the real losses live. Death costs Essence, time, and your bag. It never costs identity — and the one ledger worth dying to escape is the one death cannot touch.

## The career, against unlockStage

A hundred hours, in the order the ledgers open. **Hours 0–5, the prologue**: species, background and origin are live; kit is issued and counted; the first skill crosses to Practised under fire. **Hours 5–20, the island and the crossing**: the first ceiling is found and turns out to be a person; corruption becomes visible on somebody else before it is visible on you. **Hours 20–45, settled ground**: [[professions]] open, because a trade needs a bench, a supplier and somebody who needs you; [[cybernetics]] open at the first clinic with financing. **Hours 45–70, the city**: [[suspicion]] becomes a per-institution score with teeth, licences acquire an office, and Standing starts opening doors that were locked. **Hours 70–100+**: master rungs, ceiling techniques, and the arithmetic of being expensive to bring back.

## Eight builds this system produces on its own

The Rifleman, none-origin, who never casts and carries stormglass rounds so that he does. The Honest Gun, Contract Security with a named rifle and no licence at all. The Debt, an infused Kinetic climbing the ladder on purpose because the ladder pays. The Quartermaster, who wins fights before they start by deciding who has ammunition. The Hidden, a born caster with forged papers and one signature that has to last. The Convert, mostly chrome, presenting clean, further along than anyone can read. The Agreement, who has Nalia Reed's word and takes nothing that was not agreed. And the Expensive One, level forty, whom a settlement argues over binding because the quote *is* the argument.

For writers: name the ledger a scene is spending. If it spends none of them, it is scenery.`,
  },
  {
    slug: "character-classes",
    note: "six doors, four grants each, and eleven reserved for factions with no home yet",
    meta: { buildStatus: "designed", dependsOn: ["enlistment", "skills", "kit"], gameTag: "System.Backgrounds" },
    append: `${DESIGN_MARKER}

**Backgrounds.** The near-future vocabulary law applies to this shelf as much as anywhere else: nobody in this world says *class*. A background grants exactly four things — a kit, starting skill ranks and ceilings, a **read**, and a **contact** — plus one thing the character does not discuss. It grants no exclusive ability ever, because an exclusive ability is a wall, and canon's rule is that the door is not the walls.

**Contract Security** — the Stormglass merc. Worn plate refitted twice for two bodies, a rifle with somebody else's filing on the serial, sixty rounds when issue is thirty. Marksmanship at Reliable. Read: *Price the Room* — on entry you see who is armed, who is paid, and who is about to stop being either. Contact: a former squadmate drawing [[iron-saints-pmc]] pay. Buried: a checkpoint where the paperwork was in order and the people were not.

**Infusion Technician** — Tino's trade, and playable, as his peer. A rig nobody else touches, a torque driver worn smooth in one spot, three doses on no manifest. Rig Maintenance at Reliable. Read: *Bad Valve* — you hear a rig running past service across a room, including the one on the enemy. Contact: a supplier who has never asked what it is for. Buried: whose crate those three doses came out of. This door is the only one that sees Tino close the leaking valve and hide the tremor and knows what both mean.

**Field Medicine** — the medic. A trauma bag rebuilt for weight rather than completeness, and a phase-reader that was supposed to be handed back. Trauma at Reliable, and a provisional Regenerative licence. Read: *Triage Eye* — a body's history at a glance, and corruption tells two phases before anybody else in the room, including the person carrying them. Contact: a clinic that still forwards your mail. Buried: the first reading you falsified — not that you did it, but who asked.

**Reconnaissance** — the scout. Optics worth more than everything else you own, and a map wrong in two places you know about. Navigation at Reliable. Read: *Ground Truth* — wildlife, weather and ground tell you what is coming. Contact: somebody in a village who feeds you and is not supposed to. Buried: a position you reported clear.

**Materiel** — the quartermaster. Keys to four things you should not have keys to, and a ledger in your own shorthand. Negotiation at Reliable. Read: *Count the Crates* — stock, prices and shortfalls on sight, and at Reliable, who took it. Contact: a [[black-tithe-syndicate]] buyer holding the other half of a ledger you would like back. Buried: a shortfall that killed somebody, and the entry that covered it.

**Salvage Engineering** — the mechanic, and the only door that starts with chrome: one limb augment, unfinanced, built for somebody else. Fabrication at Reliable. Read: *Load Path* — structures show you what they are holding up. Contact: a [[foundry-workers-union]] steward who considers you a member whether you agreed or not. Buried: who the prosthetic was for.

**Six doors, one prologue, six different games.** The read decides what the player is looking at when the Strike lands — exits, a rig, a dying cameraman, a search pattern over the rooftops, the island's remaining rounds, or the supports under the arcade going before the street does.

**Eleven doors are reserved** for factions that have no home written yet, each one line: holdfast militia ([[mountain-holdfasts]]), caravan guide ([[desert-nomad-compact]]), line worker ([[foundry-workers-union]]), cordon veteran ([[abomination-containment-authority]]), transit inspector ([[skybridge-transit-authority]]), Meridian graduate ([[meridian-arcane-institute]]), lodge apprentice ([[wardens-monster-hunter-guild]]), Coast Guard rating ([[peninsula-coast-guard-authority]]), skiff militia ([[free-islander-league]]), missionary ([[church-of-the-first-gift]]), and Choir debtor ([[crimson-choir]]). Each is a door waiting for the region and faction writing that will earn it.

For writers: every buried line is a quest that already knows its ending, and canon's own instruction applies — this game's dead have families in Glasswater. Six of those families are pre-attached to the six doors.`,
  },
  {
    slug: "magic",
    note: "the two casting economies, the fourth enlistment question, and what self-infusion opens",
    meta: { buildStatus: "designed", dependsOn: ["the-six-pillars", "the-corruption-system", "attributes"], gameTag: "System.Magic" },
    append: `${DESIGN_MARKER}

**Two casting economies, and the origin decides which one you are in.**

**Born and gifted casters draw on their own essence.** No rig. A pool of 8 + level + twice Conductivity, plus what kit and augments add — a level-30 caster at Conductivity 5 carries about 48 units; a recruit at level nine carries about 21. A cast costs 2, 4 or 8 by tier. It comes back with **sleep** (full), a **real meal** (a quarter), and a Chemistry tonic (a third, once a day, and you feel it). Nothing was extracted to make any of it, which is the entire reason such a person is hunted.

**Infused casters run doses through a rig.** Inventory, not a pool: a dose loads five charges, the body holds Conductivity + 2, and what it cannot hold vents as pale light down the ribs. A cast costs 1, 2 or 4 charges. Nothing regenerates — only the next dose. A standard rig always reads one charge high — three lit, two delivered; a full dose of five lands four. A sealed rig delivers every charge it lights, and a conductor-grade rig delivers every charge with ten percent more effect.

So a born caster is **sustainable and capped**: never out of power across a campaign, and never able to spike. An infused caster is **dose-limited and escalating**: enormous when the crate is full, a person with a rifle when it is not, and better every time they spend money. The party argument this produces — who gets the stormglass, who gets the tonics, who gets the doses — is canon's one economy happening at a table.

**Self-infusion.** A born or gifted caster can take a dose. It grants eight units instantly, like an overcharged cast with none of the instability, and it opens a corruption ledger they were born without. Self-infusing does not make them infused; it makes them a born caster with a debt. The most-asked question in a born caster's life is in their own pocket.

**The fourth question at [[enlistment]].** *None* is the absence of an origin, not a fourth one, and it starts Composure a rung higher — people who cannot borrow power learn to hold. *Born* names a bloodline, and the pillar it runs in; the class inside it declares itself under pressure, in the prologue, and somebody sees. *Gifted* is decided by the giver: a Lizzarnix gift expresses as [[thermodynamics]] or [[biologics]] — flame, ash, return — and a [[the-pale-embassy]] gift as [[cognition]] or [[resonance]], with terms you will read years later. The sheet cannot tell those two apart. The Church can, and so can the Embassy. *Infused* starts at phase 1, because you were dosing before the island and your hand already knows.

**Overcharge is one verb with six consequences,** because [[the-six-pillars]] each fail in their own way. It is chosen anywhere in the world, and ambient in [[bloomfall-reach]] whether anyone chose it or not — which is the difference between design and weather, and [[blackbloom-overcharge]] is the weather.

For writers: before power solves anything, say which economy paid — a pool that will be shorter tonight, or a charge that came out of a crate somebody else is now short of.`,
  },
  {
    slug: "professions",
    note: "nine trades, three rungs each, and the documents a master rung really produces",
    meta: { buildStatus: "designed", parent: "character-progression", dependsOn: ["gathering-and-harvest", "trade-and-economy", "character-progression"], gameTag: "System.Professions" },
    append: `${DESIGN_MARKER}

**Nine trades, three rungs each, and the near-future names are the point.** Engineering, not smithing. Chemistry, not alchemy. Every rung unlocks something a settlement can write on a board and count, and the master rung is where being good stops being neutral.

**The rule for play:** the licensed rung in as many trades as you can staff, and the master rung in exactly one. Trades level by being needed on settled ground — jobs done, orders filled, people who came back.

- **Medicine** — apprentice stabilises, sets and stitches. Licensed does surgery, reads a phase with an instrument, and manages corruption without ever curing it: one tell suppressed for a day, one night bought for a phase-three. Master **falsifies a reading**, and the instrument says what the master tells it to. Ceiling: everyone you protect is permanently in your debt, and you never had to ask.
- **Refining** — canon's own line about where skill and complicity become the same thing. Licensed processes to grade, grades [[reserve-glass]] so a containment frame does not kill its wearer, and feeds a Forge. Master reads **provenance**: a dose named by species, sometimes by individual, sometimes by facility. Ceiling: you are the only person in the room who knows whose soul is in the crate, and you keep working.
- **Chemistry** — kept apart from Refining, because they are different institutions and merging them would put the setting's two sharpest moral ceilings on one sheet. Licensed makes the [[quietwater-culture]] tonic and the stabiliser that takes the misfire out of stormglass. Master makes the **cut** — refined blended with nature-drawn, slower on the ladder, weaker per dose, undetectable in the field — and the **assay blank**, which makes a reading come back inconclusive.
- **Engineering** — absorbs Fabrication as a trade, because it is one job: keeping people's equipment alive, including the equipment that is part of them. Licensed does bench work, seals a rig, fits a prosthetic, and recovers an augment from a body in ninety seconds. Master makes **cosmesis**, the conductor-grade rig, and a piece good enough to acquire a history.
- **Logistics** — canon's quartermaster. Licensed allocates under scarcity in writing and keeps the dose ledger. Master holds **the order** — a Forge rebuilds one body at a time, and somebody sequences it — and sounds the horn.
- **Architecture** — licensed fortifies against load paths and builds a Forge housing that survives a shell. Master **holds**: walls that survive a third assault, and a plan for the collapse when they do not.
- **Extraction** — absorbs Agronomy, because their master rungs were the same idea at two scales. Licensed works the dark tier with quotas and paperwork, which always pays better. Master manages **partial take and recovery**: harvest without killing the source, and worked ground brought back toward baseline and no further.
- **Culinary** — licensed stretches a store a week past where it ends. Master serves **a real meal**, which restores Composure — the attribute corruption takes hardest and nothing else gives back — and a quarter of a caster's pool.
- **Xenobiology** — Wardens certify. Licensed does husbandry, transport and field assay, and signs off Morphic material. Master reads the **rung**: in the Reach an animal's mutation state on sight and what damage type drove it there, and elsewhere whatever that region's signature turns out to be.

**The trades' end-game is documents.** Chemistry's assay blank and Refining's clean grade are the two most valuable pieces of paper a master can produce, and neither is a weapon: one makes a person read as nothing, the other makes a crate worth more than the same crate without it. That is why Standing is a ledger.

**Pilotage is reserved.** The Cartel rules sea lanes, the Coast Guard patrols them, [[skybridge-transit-authority]] licenses the sky, and the prologue is an island — so the trade waits, but its slot is drawn: navigation as a profession rather than a skill, licensed by whoever controls the lane, and the first trade whose master rung is about getting somebody else's people out.

For writers: a trade is a list of things a settlement can order. Write the order, and the profession writes the scene.`,
  },
  {
    slug: "the-corruption-system",
    note: "the ladder as a build — what each phase takes, what it pays, and what closes",
    meta: { buildStatus: "designed", dependsOn: ["character-progression", "attributes", "suspicion"], gameTag: "System.Corruption" },
    append: `${DESIGN_MARKER}

**The ladder is a progression path.** It is the fastest one in the game, it pays in the best currency, and it is the only one you cannot get off. Canon requires corruption to be genuinely useful short-term and damaging long-term, with both halves staying true — so here is the trade, phase by phase.

- **0 · Clean** — costs nothing, pays the cheapest reclamation in the game and a settlement that keeps binding you.
- **1 · Tremor** — takes a Coordination rung. Pays: your first dose worked. The hand shows; a medic sees it and a stranger does not, yet. Nothing closes — the only phase that shuts no door.
- **2 · Veining** — takes a Conditioning rung and puts ten percent on every future reclamation. **Pays a Conductivity rung, above your ceiling**: veining is the body becoming a better conductor, which is exactly why the second dose lands easier than the first. Temporal licences close at any tier, and the Church stops calling you brother.
- **3 · Appetite** — takes two Composure rungs: the capacity to refuse, eaten by the thing you would refuse. Pays automatic pre-contact dosing for companions; the player always chooses. You ask when the next issue is due, and everyone hears it. Command ceilings close — Rook will not teach a phase-three.
- **4 · Sensitivity** — puts twenty percent on reclamation. **Pays an Acuity rung above the ceiling**, and you become the best eyes in the company: *put him on point*. Instruments flag you at every checkpoint that has one.
- **5 · Drift** — takes a rank off your skill ceilings, and pays in stray competence: techniques you were never taught, from whoever the dose used to be. The first payout that is unmistakably not yours. Every teacher closes except the Choir and the Covenant.
- **6 · Turning** — puts forty percent on reclamation, and nobody will billet with you. **Pays a Resilience rung above the ceiling.** Binding closes at any Forge with a policy, and the horn sounds early for you, because a settlement will not spend its reserve on a phase-six.
- **7 · Completion** — takes everything. An abomination stands where you stood, [[the-long-game]] lets a faction field it, and the campaign continues with what is left.

**What the player sees of their own phase: no number, ever.** First person makes the tells yours. At 1 the weapon sway on a long hold has a rhythm that was not there before. At 2 the vignette closes a stair earlier. At 3 the order wheel is harder to read under fire, and a dose icon appears on the rig before you reached for it. At 4 the world highlights things nobody else in the squad reacts to. At 5 your hands finish techniques you were never taught. At 6 the blood on your gloves is yours and you did not feel the hit. Companions say it out loud in ascending order of politeness.

**Hiding it, priced.** Sleeves and gloves beat strangers at distance and cost nothing, and everybody knows what long sleeves in the tropics mean. Medicine beats a tell for a day and costs a favour every day. Cosmesis beats instruments and strangers completely, costs financed chrome and a repossession agent who knows where you bind, and fails the moment you die in public. A forged scan beats any institution that reads paper and costs you a Medicine master who now owns you. A bribed doctor beats one licence review. Social deception beats the people who like you, until it does not. Instruments and institutions, always. People, never.

**Five roads onto the ladder, and one discount.** Dosing, at standard pace. Self-infusion, a full step per burst, taken by a born or gifted caster in the worst five seconds of a fight. The one-way door, when a *none* origin takes a dose and is infused from that second. Birth, for [[carriers]], who climb at two-thirds pace — the only discount, and it is inherited. And nature-drawn [[stormglass]], the honest road at half pace: weaker per dose, four times the volume, unstable, and with no severed self in it. A Chemistry master's cut is how a squad ends up on that road without being told.

**Two nights the rules bend.** [[the-blood-moon]] is an Appetite night for everyone above phase two — companions dose without orders or concealment, tells read at any range in any light, quotes run high, and the custom is to bind *before* the moon. [[the-solar-eclipse]] arrives without warning, so nobody doses ahead of it: for one hour every cast pushes itself, ambient overcharge everywhere rather than only in the Reach, [[reclamation]] pauses and the dead wait an hour longer with their names known, the dampening installations flicker, and every faction with a calendar has a plan for the hour whose content is always *do nothing*.

For writers: the ladder is not a trap the player falls into. It is the shortcut every other progression path is slower than, and the only job is to make the bill visible to everyone at the table before it comes due.`,
  },
  {
    slug: "survival",
    note: "the day's cadence, and both of this dossier's open questions answered",
    meta: { buildStatus: "designed", dependsOn: ["gathering-and-harvest", "kit", "professions"], gameTag: "System.Survival" },
    append: `${DESIGN_MARKER}

**Both open questions on this sheet are answered. Moments, not meters — and yes, one crate.**

**The day, as a cadence every ledger runs on.**

- **First light — the count.** Rounds, doses, tonics and cells, said aloud by whoever holds the ledger. The medic's look at every pair of hands. A valve tightened before it weeps. Kit moves; corruption is read; a caster learns what they have.
- **The meal.** Rations, or a real one. Conditioning's driver, counted. A quarter of a caster's pool back if the cook has the master rung, and Composure back for everyone at the table. The morning the cook is dead is the morning everybody works out what the cook was for.
- **The day — pressure.** Every reload under fire, every read that turned out right, every cast that had to land. Kit wears, plates take Hits, and the environment pushes. This is where the ledgers earn.
- **Before contact — the dose decision.** An infused character decides; a companion at Appetite has already decided. A born caster checks their pool and then their bag, in that order.
- **Dusk — rest and the bench.** Sleep returns a pool in full. A plate is replaced, a weapon returned to true, and a Broken limb has until tomorrow before it becomes a [[lasting-wounds]] entry.
- **Night — watches, by Composure.** The diary, if somebody keeps one, and the conversation nobody has about the hands the medic looked at longest.

**Need is a moment, never a bar.** Hunger is a line from a companion, and then a vignette that closes a stair early. Thirst is cracked lips and a hand that shakes for a reason that is not the ladder, which a medic has to tell apart. Sleeplessness is a pool that does not come back and an order wheel that is harder to read. Doses are a rig with two dark. Ammunition is the count, said aloud, and a number that used to be bigger. Repair is a jam in the middle of something.

**One crate, one count, one cook.** Companions draw from the same stores, and that is the point: a companion at Appetite is the reason the crate is short, and a companion who cooks is the reason the party still has Composure. The party is a settlement in miniature, and a settlement has one larder.

For writers: never write abundance without an address. When a scene needs plenty, say where it came from and who is now short — that is the whole engine, and it is the same engine [[the-harvest-economy]] runs on.`,
  },
  {
    slug: "companions",
    note: "the seven-beat loop, the five-state opinion model, the first roster, and the seat after Tino",
    meta: { buildStatus: "designed", dependsOn: ["the-corruption-system", "character-progression", "suspicion", "cooperative-play"], gameTag: "System.Companions" },
    append: `${DESIGN_MARKER}

**The loop.** *Recruit* — they have a want beyond you, and you are the route rather than the reason. *Equip* — their kit is theirs, and if they are infused their rig is a readout you can see and a weak point the enemy can. *Order* — the wheel reaches them, and they obey by Composure and by opinion. *Their phase* — they keep their own corruption ledger, and a companion's is the only phase you ever watch climb from the outside, from the beginning. *Their trade* — they staff the settlement, so a death is a hole in what the settlement can do and not only in the line. *Their price* — a born-caster companion is an [[aegis-extraction-consortium]] line item walking beside you, and somebody will eventually make the offer to *you*. *Their death* — bound, they come back in the order [[professions]]'s Logistics master decides, and they remember dying; unbound or [[the-unregistered]], they do not.

**Opinion, in five states, with no number anywhere.** **Trusts** — stands next to you at the count, tells you their want unasked, and every order lands instantly. **Follows** — the default; comes when called and says nothing about it. **Hesitates** — a beat and a look; Charge and Dose fail first while Hold Ground still holds. **Refuses** — eats elsewhere, will not be the one who carries you, and takes only the orders that protect the line rather than spend it. **Gone** — the seat is empty, and the next companion knows why before you have said a word, because companions talk.

It moves **up** when their want is advanced by your hand, when a real meal is cooked at your table on a night it was short, when you hide their phase and let them watch you decide, when you go back for their kit before your own, and when you bury somebody they loved correctly because a Forge could not. It moves **down** on the Dose order given in front of the clean, on a forged reading traded away, on a reclamation order that put them second, on being left Dying with a *Four Minutes* you had and did not spend, and on their diary read aloud. **Recovery is only by scene** — no gift and no dialogue option moves a state; something has to happen. And a companion who Trusts you is the only teacher whose ceiling costs a favour instead of a debt.

**The first roster — Kestrel's command staff.** [[the-unnamed]] reserves the medic, the mechanic, the quartermaster and the scout, and here they are as companions: [[the-kestrel-medic]], infused and already at Appetite, who needs a licence review survived; [[the-kestrel-mechanic]], whose tools are Union property under a contract he signed at nineteen; [[the-kestrel-quartermaster]], a Returnee whose covering entry went out on a boat; and [[the-kestrel-scout]], who is Latent and does not know it. Each has a want that is not the party, a trade the settlement will need, and a price somebody has already named.

**The seat after Tino.** Canon says whoever follows the player after Tino's empty seat has to earn it against a ghost. The design says how: **they must be unbound when the party is.** The party makes landfall at Arcadia with nowhere to come back to, and the seat is earned by the person who walks to the first Arcadia Forge with them and binds at the same Core, in the same scene, so that the first thing the two of them share is a register. Nobody who was already bound can hold that seat. Everything else — species, background, want — belongs to whoever writes them.

**The table.** In [[cooperative-play]] the same ledgers apply to four players: one Forge reserve, so a stranger's bad night spends yours and the argument is who gets rebuilt first; one crate, so the quartermaster's allocation is a weekly document; one suspicion, because the party is read as a party and a concealed phase-five is everyone's checkpoint problem; one wheel, which reaches companions and NPC squads and never another player; and one Veil, opened by a decision said out loud, which an Unregistered player can never come along for. A player who is absent is covered by the simulation: their character holds their trade, keeps their post, does not die, and does not level.

For writers: the party is a settlement in miniature — a reserve, a crate, a clinic, a quartermaster and a suspicion score. Write four players and their companions exactly as you would write a village, because [[the-long-game]] ends with the party becoming one.`,
  },
  {
    slug: "environment",
    note: "the signature-slot rule: one learnable rule per region, reserved where the region is unwritten",
    // Not the shared marker: this layer is a design NOTE, so it needs its own
    // cut point or a re-run stacks a second copy under the first.
    marker: "\n\n---\n\n## Design note — the signature slot",
    meta: { dependsOn: ["the-living-world", "adaptive-mutation"] },
    append: `

---

## Design note — the signature slot

**Every region gets one learnable rule, and [[bloomfall-reach]] is the first instance rather than the exception.** Canon's own justification is in the Reach's dossier: a region needs adaptation a player could learn rather than merely survive, and a finite authored ladder gives recurring, recognisable outcomes. That is a general law about regions. [[adaptive-mutation]] is simply where it was written first, and it stays the Reach's alone.

A signature must be **learnable**, **region-only by default**, and it must feed the character ledgers rather than add a new one.

The board as it stands: **[[the-starting-island]]** is filled by canon — [[the-island-remembers]], plus rift ground that gave its dead back. **[[bloomfall-reach]]** is filled — adaptive mutation, Blackbloom exposure as a condition and never corruption, and ambient spell instability. **[[the-peninsula]]** is half-filled: the city's own signature is its dead zones and suspicion gradient, and [[draw-nine]] is the open slot — an Aegis draw decommissioned rather than sealed, and nobody has written what a draw does to the ground above it.

Eight remain reserved, in the shape canon already implies. **[[the-ocean]]** — the deep, and something that keeps pace beneath the Flee branch. **[[riverlands]]** — buildable ground, the river as a road into every other region, the floodplain where a party becomes a settlement. **[[high-cliffs]]** — altitude and the vertical border, with [[grand-lake]] as a reservoir that may feed Forges and may be listening. **[[the-red-forest]]** — a canopy that advances, thinning only where the ground turns toxic. **[[grand-rift]]** — the gas: TOXIC as an environment, and a city that lives with a filter over its mouth. **[[the-desert]]** — the quiet places, relic country and glassed battlefields, and guides who know which ruins not to enter. **[[magic-torn-wasteland]]** — physical law failing, which is the eclipse's hour made permanent. And rift ground itself, which follows the war rather than a map.

Every unwritten region above is a placeholder in exactly the sense [[the-unnamed]] uses for characters: the slot exists, the shape is known, and whoever writes it first owns it.`,
  },
  {
    slug: "combat",
    note: "one economy, the diegetic HUD, the siege clock, and fourteen kinds of opposition",
    meta: { buildStatus: "designed", dependsOn: ["the-wound-model", "kit", "magic", "the-soul-forge"], gameTag: "System.Combat" },
    append: `${DESIGN_MARKER}

**Four currencies, one supply chain.** *Own essence*, spent by born and gifted casters, which comes back from sleep, food and tonics and advances no phase — running out is exhaustion, and it shows the way spending yourself always shows. *Doses*, spent through a rig by the infused, which come back only from buying, harvesting and refining, and which cost twice: Essence now, corruption later — running out makes you a person with a rifle. *Rounds*, spent by anybody, which come back from logistics, salvage and the black market — running out makes you a person with a club. And *durability*, the cost paid before the fight rather than during it: kit does not run out, it **breaks**, and it picks the moment.

**The HUD is the body, and for the infused it is also the rig.** No bars, no numbers, no damage floaters, no phase readout. Conditioning is breath and how far the peripheral vignette has closed. Coordination is sway, reload and recoil recovery. Resilience is what is on your gloves and how fast it got there. Composure is whether the world stays legible when it goes badly. Conductivity is the rig running cool or hot and a cell that hums in your pocket. And Acuity is the one that changes what is rendered at all — a high-Acuity character is given information the world does not offer anybody else, which is the most first-person attribute imaginable and the reason a phase-four is worth keeping around. A born caster's readout is the body itself: cold, slow, hungry, hands going. It looks exactly like exhaustion; an experienced squadmate can tell the difference and a stranger cannot, and it is the one readout nobody can steal.

**Casting, and the two gambles past it.** Instant-or-channelled is a property of the ability rather than of a pillar, so no pillar is categorically the slow one. There are exactly two ways past your envelope, and they are different gambles: **overcharge**, the physical one, which costs more of whatever fuel you run on and risks [[the-six-pillars]]' own failure modes; and **self-infusion**, the soul one, available to born and gifted casters, which is clean and enormous and short and opens a ledger they did not have. Chosen overcharge is available everywhere. Ambient overcharge is [[blackbloom-overcharge]], and it belongs to the Reach.

**The siege clock, and the horn.** Most battles worth fighting are about a Forge, and the state nobody is told is the reserve. **Healthy**: defenders trade bodies for time because bodies come back, and recklessness is genuinely correct. **Thin**: below 35 Essence the Forge cannot build any vessel, so it *holds* — and the only tell is that the quartermaster stops authorising and starts arguing. **Dry or down**: every further death is permanent, and it feels exactly like the last four hours did. Canon gives the transition a sound — the quartermaster's horn — so one note tells every person on that field, defender, attacker and civilian alike, that dying has stopped being temporary. Some defenders run. The ones who stay are making a different decision than the one they were making ten seconds earlier. Usually the horn is close to the end; *usually* is doing a great deal of work there, and an occasional line that holds after it is the most valuable thing this mechanic can produce.

**Objectives change shape accordingly.** Not *hold the ridge* but **reach it, starve it, level it, or stand in front of it**.

**Fourteen kinds of opposition, each with a tell, a counter and a lesson.** Pearl fire teams, whose plate sigils say which ward they bought. Pearl infused casters, three lit and one leaking, readable across a square. [[iron-saints-pmc]] shock teams wearing cosmesis and no tells at all, who vent to ELECTRICAL. Directorate checkpoints, which read paper before they read people. A born caster on the run, with somebody behind them holding a net. Warden hunters, who will not fight unless paid. The Bureau lattice, which is a layer and not an enemy. ACA cordon teams in grey coats, who do not want to kill you. Reach creatures by rung, which you trained to read. Monstrosities, which have a budget line and a name on the sign-off. Abominations, which used to be someone. [[the-risen]], who have no stat block, ever. True demons and envoys, who are bargained with, warred on or worshipped, never health-barred. And civilians, for whom there is no counter — only what you do.

**Three encounter rules, all canon's.** The third option is always designed in: parley, flee, sneak or bribe. The half-seen never gets a stat block, so those encounters are survived or escaped rather than won — which answers this dossier's own open question with a flat no. And nobody is a wave: write who they are and why they are here.

**Death's lethality, answered.** It costs 35 Essence plus 11.7 per level out of a reserve the whole register shares, plus the kit where it fell, plus every augment in the body you left. It is expensive, it is somebody else's expense as much as yours, and it is never permanent while a living Forge holds your Echo — except in the one case canon reserves, which is [[true-death]].

For writers: everything that makes the player strong makes the enemy strong the same way. An enemy rig vents like yours, enemy chrome fails to ELECTRICAL like yours, and an enemy born caster is worth more alive, exactly as you are.`,
  },
  {
    slug: "battle-management",
    note: "the live order wheel, formations, morale as arithmetic, and what commanding costs",
    meta: { buildStatus: "designed", dependsOn: ["combat", "companions", "the-wound-model"], gameTag: "System.BattleManagement" },
    append: `${DESIGN_MARKER}

**Live, unpausable, and issued from inside your own eyes.** Orders go out through a radial wheel on a hotkey while the fight continues around you. No tactical pause, no map screen to retreat into, and no time to think that the enemy does not also get. That is not an omniscient camera and does not trouble [[the-look-of-the-world]]: it is a soldier shouting, and it stays entirely in first person.

**The wheel.** *Charge* — closes now; casters cast on the move, instants only, and anyone at Appetite doses first, automatically. *Hold Ground* — absorbs, and permits channelled casts; it is the first order the horn breaks. *Free Attack* — never fails, which is the problem: it does not stop until the crate does. *Wait Attack* — buys an ambush and costs nerve, and a squad with poor Composure breaks the wait early. *Focus* — everything onto one target: a caster's rig, a plate's hole, the one with the sigil. *Suppress* — the most expensive order per second in the game. *Fire Mission* — arrives in rounds rather than seconds and lands on whatever is there. *Medic* — sends the medic to a Down, and fails when the medic is the Down. *Dose* — authorises the line to dose: power now, the crate short, every ledger a step up, and the commander's name on the order. It does not fail. That is the horror of it. *Fall Back* — the last order that still works after the horn. *Regroup* — the order that keeps a defeat writable.

**Formations.** Line for fields of fire, and vulnerable to Gravitic — a line along a wall falls along it. Column for roads and speed, and vulnerable to anything that wants everyone in one place. Wedge for a charge, and vulnerable to suppression and to the plate hole at the point. Cover, which means spread *away* from load-bearing walls, because [[structural-integrity]] says bunching under a corner column is how a collapse takes eight people.

**Morale is arithmetic nobody sees.** Each squad has a nerve — the average Composure of the people in it — and an order lands when nerve beats the pressure on the line: fire, casualties, the sight of a phase-six, a collapse nearby. **The horn is minus three, to every squad, at once.** Command's *Rally* holds one more beat, and *Written Defeat* is the only thing that makes Fall Back reliable afterwards. A companion who thinks you are wrong hesitates; one who has decided you are a monster does not come. And a squad left on Free Attack with an Appetite-phase infuser in it will dose without an order, and you will find out from the count.

**What commanding costs.** Because nothing pauses, every order is a moment you were not shooting — a player who commands well fights less, and a player who fights well commands late. No tuning knob is needed. Composure decides whether the wheel stays legible when it is going badly, and Acuity decides how much of the line you can see to give orders about, which is one more reason a corrupted spotter is worth an argument.

**The failure state is the horn.** A commander whose orders are being refused in real time while the horn is still sounding is the best scene this design produces, and it costs nothing extra to build, because both halves already exist.

For writers: casualty lists name names, and the wheel is where a player finds out what they are willing to spend.`,
  },
  {
    slug: "reclamation",
    note: "the nine-step loop, the hybrid shortfall, and who reaches the body first",
    marker: "\n\n### Addendum — the loop, step by step",
    meta: { dependsOn: ["soul-binding", "gathering-and-harvest", "attributes", "kit"] },
    append: `

### Addendum — the loop, step by step

Death is not a timer. It is nine steps and three or four decisions, and every one of them belongs to somebody.

- **1 · The fall.** The Dying clock runs out. The body stays where it is, with the plate, the rifle, the rounds, the doses, the augments and the diary.
- **2 · The Echo lights** in every Forge that holds you. An Echoic caster feels it; a quartermaster sees it on the Core. If no living Forge holds you, nothing lights, and that is the end of the run.
- **3 · The count.** The quartermaster says a number aloud — the only place a level is ever spoken. Yours, plus your corruption surcharge, plus ten percent if you are one of the [[returnees]], against what the reserve holds.
- **4 · The order.** One body at a time, sequenced by whoever holds Logistics at master rung. In a lean settlement this is the argument, and it is a person's to lose.
- **5 · The spectacle.** Never quiet. Lights dim across the base, the Core reacts, and everyone learns who came back — and, if they were concealing, what they were.
- **6 · Shortfall, or hold.** Short, and you come back underbuilt: one attribute rung for every 11.7 Essence missing. Under 35, and the Forge holds you, lit, with your name known, until somebody brings Essence.
- **7 · What came back.** Your levels, unless short. Your corruption, always. Your last-bound body, so scars and losses taken since are not built. Not your kit. Not your chrome — see [[cybernetics]].
- **8 · The walk back** to where the body fell, through whatever is between.
- **9 · Who got there first.** Nobody, if you were lucky. A [[black-tithe-syndicate]] crew, for the rounds. A repossession agent, for the arm. [[bone-market-families]], for remains that must not be found. Or a Pearl contractor holding your named rifle, which is now his.

**The shortfall, resolved.** Canon's arithmetic is savage at mid-level — a level-14 character rebuilt from a reserve of 101 comes back at level 6 — and canon also says they come back less, feel it for hours, and nobody dies of it. Both are true under one rule: **every shortfall costs one rung permanently, and the remainder regrows** at about a rung a day of rest and food, faster with a cook and a medic. Death always leaves a mark on the pattern; a bad night is survivable. So *hold* versus *shortfall* is days in the machine against one permanent rung and days of weakness — and [[professions]]' Culinary and Medicine have a job the morning after every death.

**The horn threshold is the same number.** A Forge under 35 Essence cannot build anything, which is exactly when its quartermaster sounds the horn — so the siege clock in [[combat]] and this loop are one mechanism heard from two places.`,
  },
  {
    slug: "lasting-wounds",
    note: "the wound model's Broken state, and the day a wound has to be set",
    marker: "\n\n**A wound starts as a state, and the state has a deadline.**",
    append: `

**A wound starts as a state, and the state has a deadline.** [[the-wound-model]] gives a body six of them, and **Broken** is where this dossier begins: a limb whose function is gone — no two-handed weapon and no channelled cast for an arm, no sprint and no Traversal for a leg. Untreated for a day it stops being a state and becomes one of these: a limp, a hand that does not close, a scar with a date on it. And if the character binds again afterwards, it is in the pattern for good, which is how somebody chooses a permanent injury without ever deciding to.`,
  },
];

// ===========================================================================
// Two amendments to locked rules. Both were approved by the owner before this
// pass ran, and both are additive in substance: 5a renames nothing away, and
// 8a inserts a fourth category without touching the three that exist.
//
// The runner refuses to write either unless `from` matches the stored body
// exactly. A locked rule is not a place to guess at whitespace.
// ===========================================================================

export const ruleEdits: RuleEdit[] = [
  {
    slug: "the-three-origins-of-magic",
    note: "5·a — the flat school list becomes six pillars and twenty-seven classes, with all fourteen originals carried",
    from: "Schools of magic are extensible by design: elemental, necromancy, blood, summoning, shapeshifting, gravity, bionic/technomantic, illusion, warding, healing, spirit, shadow, time-fracture, force/kinetic, and more. Inventing a school is fair game on the board; inventing a fourth origin is not.",
    to: `Schools of magic are extensible by design, and they are organised under **six pillars** — broad fields, each holding the licence classes the world actually certifies.

- **Thermodynamics**: thermal, cryogenic, electrical, radiant.
- **Kinetics**: kinetic, gravitic, inertial, ballistic.
- **Structure**: containment, tensile, occlusive, corrosive.
- **Biologics**: regenerative, morphic, necrotic, xenic, bionic, hematic.
- **Cognition**: perceptual, technomantic, empathic, memetic, coercive.
- **Resonance**: echoic, translocative, temporal, reanimative.

A pillar is a field; a class is what a person is certified in, and at what tier. The fourteen schools this rule once listed flat are all still here, under the names the licensing boards use — elemental became thermal, cryogenic and electrical; necromancy is reanimative; blood is hematic; summoning is translocative; shapeshifting is morphic; gravity is gravitic; bionic/technomantic split into bionic and technomantic; illusion is perceptual; warding is containment; healing is regenerative; spirit is echoic; shadow is occlusive; time-fracture is temporal; force/kinetic is kinetic — and more will be. Inventing a school is still fair game on the board, and it goes under a pillar; inventing a fourth origin is not. See [[the-six-pillars]].`,
  },
  {
    slug: "the-taxonomy-of-monsters",
    note: "8·a — a fourth line for the chartered, and one clause added to the writers' line",
    from: `Writers: pick the right word and the quest half-writes itself. Rescue, liberation, sabotage, or profit for a monstrosity site; grief, mercy, or cover-up for an abomination; bargain, war, or worship for the supernatural.`,
    to: `- A **chartered person** was *made* — by the same programmes that make monstrosities — and is a person. The charter is the argument: a document that says so in the jurisdictions that signed it and nowhere else, reviewable, and challenged at every border. The distinction from a monstrosity is not biology; it is a piece of paper and who honours it. See [[chartered]].

Writers: pick the right word and the quest half-writes itself. Rescue, liberation, sabotage, or profit for a monstrosity site; grief, mercy, or cover-up for an abomination; bargain, war, or worship for the supernatural; recognition or repossession for the chartered.`,
  },
];
