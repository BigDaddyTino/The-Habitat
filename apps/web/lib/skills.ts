/**
 * The twenty skills, the five-rank ladder, and the sixty named techniques.
 *
 * Source of truth for the /codex skills shelf. Transcribed from the Skills
 * codex entry (SYSTEM · CANON, 2026-08-30): twenty skills in five
 * categories, three techniques each — the first at Practised (self-taught),
 * the second at Expert (any competent teacher), the third the Ceiling (one
 * named person, and the favour they want). Every technique carries an
 * AbilityCard so it reads like a talent node or a spell.
 *
 * Where a technique shares its name with a talent node, `talentNode` points
 * at it and the card's numbers are the node's `nodeEffects` entry verbatim —
 * the sims are the balance truth. Where the move exists only here, the
 * numbers are hand-written and the card is marked `untested`.
 */

import type { AbilityCard } from "./ability-cards";

export type SkillRank = "Green" | "Practised" | "Reliable" | "Expert" | "Ceiling";

export const skillRanks: Array<{ rank: SkillRank; how: string; grants: string }> = [
  {
    rank: "Green",
    how: "Untrained. Where a skill starts unless a background put you above it.",
    grants: "Nothing yet. A squadmate watches you do it.",
  },
  {
    rank: "Practised",
    how: "Earned by use under pressure; safe practice teaches nothing.",
    grants: "The first technique, self-taught. A squadmate stops watching.",
  },
  {
    rank: "Reliable",
    how: "More of the same, with worse odds.",
    grants: "The skill stops failing at the moment it matters. People stop asking whether you can.",
  },
  {
    rank: "Expert",
    how: "As far as practice alone carries anybody.",
    grants: "The second technique, taught by any competent practitioner who owes you or likes you. Somebody asks you to show them.",
  },
  {
    rank: "Ceiling",
    how: "A hard wall that only a person can lift, and almost none of them takes money.",
    grants: "The third technique, the one only that teacher has, and the relationship it cost. The teacher says one sentence, and it is never well done.",
  },
];

export type SkillCategory = "Combat" | "Field" | "Technical" | "Social" | "Applied";

export type Technique = {
  name: string;
  rank: "Practised" | "Expert" | "Ceiling";
  /** kind: Passive | Active | Capstone (every Ceiling is a Capstone); Actives carry cooldown + range. */
  card: AbilityCard;
  /** The dossier's own clause for a ceiling technique, verbatim. */
  flavor?: string;
  /** Ceiling only: the dossier's teacher and their codex slug (null when unwritten). */
  teacher?: { text: string; slug: string | null };
  /** "<class>/<node-id>" when the same move exists in a talent tree. */
  talentNode?: string;
};

export type Skill = {
  /** kebab-case name */
  slug: string;
  name: string;
  category: SkillCategory;
  /** One plain line: what the skill governs, and what pressure raises it. */
  summary: string;
  /** The attribute that most drives it. */
  attribute: string;
  techniques: [Technique, Technique, Technique];
};

export const skills: Skill[] = [
  // ============================================================== COMBAT
  {
    slug: "marksmanship",
    name: "Marksmanship",
    category: "Combat",
    summary: "Rifles, pistols and the long shot. Rises on shots taken while you are being shot at; the range counts for nothing.",
    attribute: "Coordination",
    techniques: [
      {
        name: "Steady Breath",
        rank: "Practised",
        talentNode: "spector/steady-breath",
        card: {
          kind: "Passive",
          effect: "Hit chance +5%. Sway shrinks on a held aim, and the first shot after a sprint lands where the sight was.",
        },
      },
      {
        name: "Double Tap",
        rank: "Expert",
        talentNode: "spector/double-tap",
        card: {
          kind: "Passive",
          effect: "Your second round follows the first's track: damage dealt +30%.",
          notes: "Stacks with Called Shot. The second round finds the hole the first one made in a plate.",
        },
      },
      {
        name: "Called Shot",
        rank: "Ceiling",
        talentNode: "spector/called-shot",
        flavor: "name the plate, and the round finds the hole.",
        teacher: { text: "the Range Instructor", slug: "the-range-instructor" },
        card: {
          kind: "Capstone",
          effect: "Name the plate before you fire: damage dealt +70% and hit chance +6%. A head Hit through no helmet plate is Down.",
          notes: "A helmet is the first plate anybody buys; this is why. Works at Rifle range.",
        },
      },
    ],
  },
  {
    slug: "close-quarters",
    name: "Close Quarters",
    category: "Combat",
    summary: "Hands, knives, pistols inside 2m and the first second through a door. Rises on fights at arm's reach that you did not get to start on your own terms.",
    attribute: "Coordination",
    techniques: [
      {
        name: "Doorway",
        rank: "Practised",
        talentNode: "bastion/doorway",
        card: {
          kind: "Passive",
          effect: "Coming through a door: damage dealt +30% and readiness +10% (draw, mount and first shot come sooner).",
        },
      },
      {
        name: "Disarm",
        rank: "Expert",
        card: {
          kind: "Active",
          cooldown: "20s",
          range: "Melee",
          effect: "Takes the weapon out of a hand within 2m: 60% chance, 75% if the target is staggered. The weapon lands at your feet.",
          notes: "Fails against a weapon that is part of the body: claws, a fitted chrome blade, a Surger's borrowed trait.",
          untested: true,
        },
      },
      {
        name: "Three Seconds",
        rank: "Ceiling",
        talentNode: "bastion/three-seconds",
        flavor: "the fight ends in the three seconds before it starts.",
        teacher: { text: "the Drill Master", slug: "the-drill-master" },
        card: {
          kind: "Capstone",
          effect: "Damage dealt +60% and readiness +20% (draw, mount and first shot come sooner).",
          notes: "No trigger and no window. The three seconds before the fight are the fight, and you are already through them.",
        },
      },
    ],
  },
  {
    slug: "demolition",
    name: "Demolition",
    category: "Combat",
    summary: "Charges, cutting lines and what a building does when you take a wall out of it. Rises on charges set while somebody is shooting at the person setting them.",
    attribute: "Acuity",
    techniques: [
      {
        name: "Shaped Charge",
        rank: "Practised",
        talentNode: "bastion/shaped-charge",
        card: {
          kind: "Passive",
          effect: "Damage dealt +20%. A charge you place throws its blast in the direction you set, not all around.",
        },
      },
      {
        name: "Load Path",
        rank: "Expert",
        card: {
          kind: "Passive",
          effect: "Reads the load-bearing line of any structure in 6s of looking. A cut on that line takes half the charge and brings down twice the span.",
          notes: "The same load paths structural integrity runs on; a Conduit's Mason's Eye sees them faster, this sees them without a licence.",
          untested: true,
        },
      },
      {
        name: "Controlled Collapse",
        rank: "Ceiling",
        talentNode: "bastion/controlled-collapse",
        flavor: "choose where it lands, and on whom.",
        teacher: { text: "the Blast Foreman", slug: "the-blast-foreman" },
        card: {
          kind: "Capstone",
          effect: "Damage dealt +50%. A structure you bring down lands where you said it would, on whoever you said.",
          notes: "Nothing lands on your own side unless you named them.",
        },
      },
    ],
  },
  {
    slug: "suppression",
    name: "Suppression",
    category: "Combat",
    summary: "Fire that keeps heads down, and fire called in from somewhere else. Rises on covering bursts and fire missions made while your own position is taking rounds.",
    attribute: "Composure",
    techniques: [
      {
        name: "Walk the Fire",
        rank: "Practised",
        talentNode: "procurator/walk-the-fire",
        card: {
          kind: "Passive",
          effect: "Your suppressing fire is placed, not sprayed: 14% chance per attack to strip a plate or stagger.",
        },
      },
      {
        name: "Danger Close",
        rank: "Expert",
        talentNode: "procurator/danger-close",
        card: {
          kind: "Passive",
          effect: "Fire support you call lands inside the usual safe line without touching your own people: damage dealt +40%.",
        },
      },
      {
        name: "Battery Voice",
        rank: "Ceiling",
        talentNode: "procurator/battery-voice",
        flavor: "the fire mission arrives a round early, because the guns know your name.",
        teacher: { text: "the Tempest Battery Officer", slug: "the-tempest-battery-officer" },
        card: {
          kind: "Capstone",
          effect: "Damage dealt +80% and readiness +20% (draw, mount and first shot come sooner). The battery answers your call sign before anyone else's.",
        },
      },
    ],
  },

  // =============================================================== FIELD
  {
    slug: "infiltration",
    name: "Infiltration",
    category: "Field",
    summary: "Getting in, staying in and leaving unnoticed. Rises on entries made under a live watch — a lattice, a sentry, a dog — not on empty buildings.",
    attribute: "Composure",
    techniques: [
      {
        name: "Unhurried",
        rank: "Practised",
        card: {
          kind: "Passive",
          effect: "Walk where you are not meant to be at a working pace: 10% harder to target and to hit, and a casual watcher needs 6s of looking before they wonder about you.",
          notes: "Turns off the moment you run.",
          untested: true,
        },
      },
      {
        name: "Second Entry",
        rank: "Expert",
        talentNode: "spector/second-entry",
        card: {
          kind: "Passive",
          effect: "There is always another way in, and you see it on the approach: readiness +10% (draw, mount and first shot come sooner).",
        },
      },
      {
        name: "Blind Spot",
        rank: "Ceiling",
        talentNode: "spector/blind-spot",
        flavor: "you know where the lattice cannot see, and you are standing in it.",
        teacher: { text: "the Bureau Analyst", slug: "the-bureau-analyst" },
        card: {
          kind: "Capstone",
          effect: "15% harder to target and to hit. A lattice-fed camera, watcher-frame or sentry counts you as not there while you hold still.",
        },
      },
    ],
  },
  {
    slug: "traversal",
    name: "Traversal",
    category: "Field",
    summary: "Climbing, carrying, jumping and moving over ground that was not built to be moved over. Rises on routes taken with a load, a clock or fire on you.",
    attribute: "Conditioning",
    techniques: [
      {
        name: "Carry",
        rank: "Practised",
        card: {
          kind: "Passive",
          effect: "Carry weight +25%. A Down ally over your shoulders moves at full walking pace instead of half.",
          notes: "Carrying somebody moves their Dying clock; it does not stop it. A Broken leg switches Traversal off entirely.",
          untested: true,
        },
      },
      {
        name: "Rooftop",
        rank: "Expert",
        card: {
          kind: "Passive",
          effect: "Rooftops, walls, ridges and rigging move at full ground speed. A drop of up to 4m costs no Hit and no stagger.",
          untested: true,
        },
      },
      {
        name: "Rider's Eye",
        rank: "Ceiling",
        talentNode: "archon/riders-eye",
        flavor: "read a route from above, the way a thing that flies would.",
        teacher: { text: "the Captured Rider", slug: "the-captured-rider" },
        card: {
          kind: "Capstone",
          effect: "Readiness +15% (draw, mount and first shot come sooner) and sees through 10% concealment. The fastest line across broken ground shows itself on your first look.",
        },
      },
    ],
  },
  {
    slug: "navigation",
    name: "Navigation",
    category: "Field",
    summary: "Where you are, where the crossing is and how long the ground takes. Rises on routes found while lost, hunted or out of daylight.",
    attribute: "Acuity",
    techniques: [
      {
        name: "Dead Reckoning",
        rank: "Practised",
        talentNode: "spector/dead-reckoning",
        card: {
          kind: "Passive",
          effect: "You always know your position, heading and depth — no sky, no map needed.",
        },
      },
      {
        name: "Sign",
        rank: "Expert",
        talentNode: "spector/sign",
        card: {
          kind: "Passive",
          effect: "Tracks read number, species, load and age of what passed, up to three days cold, on any ground.",
        },
      },
      {
        name: "Agreement",
        rank: "Ceiling",
        talentNode: "spector/agreement",
        flavor: "a route is a recent agreement with the ground, so you find the crossing that moved.",
        teacher: { text: "Mara Quill", slug: "mara-quill" },
        card: {
          kind: "Capstone",
          effect: "Readiness +10% (draw, mount and first shot come sooner). A crossing that moved — a ford, a collapse, a new checkpoint — shows on your map before you reach it.",
          notes: "The map never goes backwards; this is the technique that keeps it honest.",
        },
      },
    ],
  },
  {
    slug: "survival-craft",
    name: "Survival Craft",
    category: "Field",
    summary: "Fire, water, shelter and reading bad country. Rises on nights spent in the open with something hunting you, not on camping trips.",
    attribute: "Resilience",
    techniques: [
      {
        name: "Dry Fire",
        rank: "Practised",
        card: {
          kind: "Active",
          cooldown: "15 min",
          range: "Self",
          duration: "1 hour",
          effect: "Lights a smokeless fire on wet ground in 60s. Your squad within 5m of it clears Grazed twice as fast and takes no cold-weather penalty for 1 hour.",
          notes: "The fire cannot be seen from more than 25m. A Cold Camp hides it entirely.",
          untested: true,
        },
      },
      {
        name: "Clean Water",
        rank: "Expert",
        talentNode: "spector/clean-water",
        card: {
          kind: "Passive",
          effect: "Live off any ground and keep the squad alive on it: one of your wounds closes about every 50s while in combat. No water you draw carries TOXIC.",
        },
      },
      {
        name: "Marsh Sense",
        rank: "Ceiling",
        flavor: "predict a coordinated response before the instruments confirm it.",
        teacher: { text: "Nalia Reed", slug: "nalia-reed" },
        card: {
          kind: "Capstone",
          effect: "Reads a coordinated response — a swarm turning, a lattice sweep, a patrol changing direction — 60s before any instrument confirms it, with direction and rough strength.",
          notes: "Works in marsh, forest and ruin; does not work indoors.",
          untested: true,
        },
      },
    ],
  },

  // =========================================================== TECHNICAL
  {
    slug: "systems",
    name: "Systems",
    category: "Technical",
    summary: "Panels, lattices, isolation logic and what a machine will do next. Rises on consoles worked while the room is being fought over.",
    attribute: "Acuity",
    techniques: [
      {
        name: "Readout",
        rank: "Practised",
        card: {
          kind: "Passive",
          effect: "Reads any working panel's state — power, lock, fault, last command — in 3s, in whatever language the panel speaks.",
          untested: true,
        },
      },
      {
        name: "Terminology",
        rank: "Expert",
        card: {
          kind: "Passive",
          effect: "Speaks the trade's own words: technicians, clerks and machine-voices treat you as one of their own, disposition +15. A system check you talk through takes 2 questions longer to catch you.",
          untested: true,
        },
      },
      {
        name: "Interlock",
        rank: "Ceiling",
        talentNode: "archon/interlock",
        flavor: "reverse an isolation command that was meant to be final.",
        teacher: { text: "Tomas Vey", slug: "tomas-vey" },
        card: {
          kind: "Capstone",
          effect: "15% chance per attack to strip a plate or stagger. An isolation command meant to be final — a lockout, a kill-switch, a sealed door, a bond cut loose — reverses under your hand.",
        },
      },
    ],
  },
  {
    slug: "bypass",
    name: "Bypass",
    category: "Technical",
    summary: "Locks, wards, checkpoints and the paper that gets you past them. Rises on doors opened with somebody about to come round the corner.",
    attribute: "Coordination",
    techniques: [
      {
        name: "Quiet Lock",
        rank: "Practised",
        talentNode: "spector/quiet-lock",
        card: {
          kind: "Passive",
          effect: "Standard locks open silent in 10 seconds, every time. Quality locks: 30 seconds with kit.",
        },
      },
      {
        name: "Ward Seam",
        rank: "Expert",
        talentNode: "spector/ward-seam",
        card: {
          kind: "Passive",
          effect: "A ward's weak seam shows after 6 seconds of study. You cross it without tripping it, one person at a time.",
        },
      },
      {
        name: "Credential",
        rank: "Ceiling",
        talentNode: "spector/credential",
        flavor: "a paper that works exactly once, anywhere.",
        teacher: { text: "the Ashline Fixer", slug: "the-ashline-fixer" },
        card: {
          kind: "Capstone",
          cooldown: "Once per day",
          effect: "Once per day, produce a paper that passes one checkpoint — any checkpoint. It burns on use; a second look kills it.",
        },
      },
    ],
  },
  {
    slug: "rig-maintenance",
    name: "Rig Maintenance",
    category: "Technical",
    summary: "Keeping an infusion rig sealed, cool and honest. Rises on rigs serviced in the field between doses, not on a bench.",
    attribute: "Coordination",
    techniques: [
      {
        name: "Tighten",
        rank: "Practised",
        card: {
          kind: "Passive",
          effect: "Field-services a rig in 2 minutes instead of 10. A rig you tightened vents no light and loses no charge for 12 hours.",
          untested: true,
        },
      },
      {
        name: "Honest Read",
        rank: "Expert",
        card: {
          kind: "Passive",
          effect: "Reads a rig's true state at a glance: charges held, seal wear, doctored parts, and how many doses it has left before it fails, within one.",
          notes: "A doctored rig reads as doctored; the person wearing it does not have to be told.",
          untested: true,
        },
      },
      {
        name: "Overrun",
        rank: "Ceiling",
        talentNode: "surger/overrun",
        flavor: "push a rig past service once, safely, knowing you will never do it twice.",
        teacher: { text: "the Infuser-Tech", slug: "the-infuser-tech" },
        card: {
          kind: "Capstone",
          effect: "+8 maximum pool / charges: you run a rig past its service line without venting.",
          notes: "The rig that took it is scrap afterwards, and no rig takes it twice.",
        },
      },
    ],
  },
  {
    slug: "diagnostics",
    name: "Diagnostics",
    category: "Technical",
    summary: "Reading a body, an implant or a corruption phase before it declares itself. Rises on reads made under fire, or at a checkpoint that would flag you for being wrong.",
    attribute: "Acuity",
    techniques: [
      {
        name: "Glance",
        rank: "Practised",
        card: {
          kind: "Passive",
          effect: "Reads a body's wound states — Grazed, Hit, Bleeding, Broken — and its plate count at 25m in 1s, without kit.",
          untested: true,
        },
      },
      {
        name: "Two Phases Early",
        rank: "Expert",
        card: {
          kind: "Passive",
          effect: "Reads anyone's corruption phase two phases before the tells show: you see phase 1 in a clean-looking hand at rest, and phase 3 in somebody who has not yet asked when the next issue is due.",
          notes: "Works within 10m. Cosmesis beats it; sleeves and gloves do not.",
          untested: true,
        },
      },
      {
        name: "The Recruit's Question",
        rank: "Ceiling",
        flavor: "see what an implant is really for, and who it reports to.",
        teacher: { text: "the Clinic Surgeon", slug: "the-clinic-surgeon" },
        card: {
          kind: "Capstone",
          effect: "One look at any augment within 5m names its maker, its true function and every institution it reports to.",
          notes: "Financed chrome reports to its lender. A cosmesis reports to nobody, which is its own answer.",
          untested: true,
        },
      },
    ],
  },

  // ============================================================== SOCIAL
  {
    slug: "negotiation",
    name: "Negotiation",
    category: "Social",
    summary: "Prices, clauses and what a deal is worth after the room empties. Rises on deals struck with something to lose on the table, not on market haggling.",
    attribute: "Composure",
    techniques: [
      {
        name: "Terms",
        rank: "Practised",
        talentNode: "procurator/terms",
        card: {
          kind: "Passive",
          effect: "Every deal opens on your paper — your clauses are the baseline.",
        },
      },
      {
        name: "What They'll Take",
        rank: "Expert",
        talentNode: "procurator/what-theyll-take",
        card: {
          kind: "Passive",
          effect: "You read the other side's bottom line before it is spoken.",
        },
      },
      {
        name: "Close",
        rank: "Ceiling",
        talentNode: "procurator/close",
        flavor: "a contract that holds afterwards, because both sides think they won.",
        teacher: { text: "Jaro Fen", slug: "jaro-fen" },
        card: {
          kind: "Capstone",
          effect: "Closed deals stay closed — both sides think they won. Renegotiation fails unless you allow it.",
        },
      },
    ],
  },
  {
    slug: "interrogation",
    name: "Interrogation",
    category: "Social",
    summary: "Getting the truth out of somebody who would rather keep it. Rises on questions asked with a clock running or a body on the floor.",
    attribute: "Acuity",
    techniques: [
      {
        name: "Silence",
        rank: "Practised",
        card: {
          kind: "Active",
          cooldown: "90s",
          range: "5m",
          duration: "10s",
          effect: "Say nothing for 10s. A subject with something to hide fills the gap themselves 50% of the time, 70% if they are Hit or Bleeding.",
          untested: true,
        },
      },
      {
        name: "Tell",
        rank: "Expert",
        talentNode: "spector/tell",
        card: {
          kind: "Passive",
          effect: "Sees through 10% concealment. A lie, a held breath or a hand moving toward a weapon reads on any face within 10m.",
        },
      },
      {
        name: "Demonstration",
        rank: "Ceiling",
        flavor: "you will not enjoy learning this, and they will not enjoy you knowing it.",
        teacher: { text: "the ASIS officer", slug: "the-asis-officer" },
        card: {
          kind: "Capstone",
          cooldown: "Once per day",
          range: "10m",
          effect: "Once per day, demonstrate on one body what you are able to do. Every witness within 10m answers your next 3 questions true, and every institution represented in the room raises its suspicion of you by 10.",
          notes: "The body is not required to survive. Companions keep a ledger of this.",
          untested: true,
        },
      },
    ],
  },
  {
    slug: "deception",
    name: "Deception",
    category: "Social",
    summary: "A face, a name and a paper that are not yours, held under a look. Rises on lies told to somebody who could have you shot for them.",
    attribute: "Composure",
    techniques: [
      {
        name: "Cover",
        rank: "Practised",
        card: {
          kind: "Passive",
          effect: "Holds a false name and errand under questioning: the first 3 questions of any check cannot break it, and a stranger meets the cover at disposition +10.",
          notes: "A records check is a different thing; that is what Paper is for.",
          untested: true,
        },
      },
      {
        name: "Paper",
        rank: "Expert",
        talentNode: "spector/paper",
        card: {
          kind: "Passive",
          effect: "Forged documents pass first inspection anywhere. Under expert scrutiny: even odds.",
        },
      },
      {
        name: "One Signature",
        rank: "Ceiling",
        talentNode: "spector/one-signature",
        flavor: "the mark that has kept born casters alive for twenty years.",
        teacher: { text: "the Paper-Hand", slug: "the-paper-hand" },
        card: {
          kind: "Capstone",
          effect: "Your casts carry no arcane signature — untraceable to you, ever.",
          notes: "An ARCANE scar still reads as a spell; it no longer reads as yours. Worth nothing to a character who never casts, and everything to one who hides that they do.",
        },
      },
    ],
  },
  {
    slug: "command",
    name: "Command",
    category: "Social",
    summary: "A line that holds because you are on it, and an order that gets followed after the horn. Rises on orders given while the line is breaking.",
    attribute: "Composure",
    techniques: [
      {
        name: "Rally",
        rank: "Practised",
        talentNode: "procurator/rally",
        card: {
          kind: "Passive",
          effect: "A broken line reforms on you: field-mends nearby allies 12 wounds' worth a minute.",
        },
      },
      {
        name: "Triage",
        rank: "Expert",
        card: {
          kind: "Passive",
          effect: "Calls the order of care with a look: every Bleeding ally within 10m is named to the squad at once, and a medic's first bind on each of them takes half the time.",
          untested: true,
        },
      },
      {
        name: "Written Defeat",
        rank: "Ceiling",
        talentNode: "bastion/written-defeat",
        flavor: "fall back with the line intact, after the horn.",
        teacher: { text: "the Kestrel Commander", slug: "the-kestrel-commander" },
        card: {
          kind: "Capstone",
          effect: "Allies within 10m take −10% damage, and +3s on your Dying clock. After the horn, your line falls back intact instead of breaking.",
          notes: "Defeat is written, never reloaded. Rook will not teach a phase-three.",
        },
      },
    ],
  },

  // ============================================================= APPLIED
  {
    slug: "channelling",
    name: "Channelling",
    category: "Applied",
    summary: "Holding a cast, feeling the overcharge line and staying under it. Rises on casts held while being shoved, shot at or already past the envelope.",
    attribute: "Conductivity",
    techniques: [
      {
        name: "Envelope",
        rank: "Practised",
        talentNode: "conduit/envelope",
        card: {
          kind: "Passive",
          effect: "Cast costs −5%. You know your overcharge limit to the unit, so a cast near it stops being a guess.",
          notes: "Conductivity is where the line is; this tells you where.",
        },
      },
      {
        name: "Sustain",
        rank: "Expert",
        talentNode: "conduit/sustain",
        card: {
          kind: "Passive",
          effect: "Hit chance +4%. A channelled cast survives being jostled, shoved or Grazed.",
          notes: "A rig Hit mid-channel is still an automatic overcharge failure.",
        },
      },
      {
        name: "Edge",
        rank: "Ceiling",
        talentNode: "conduit/edge",
        flavor: "run at overcharge without crossing, for as long as your nerve holds.",
        teacher: { text: "a hidden Concordance elder", slug: null },
        card: {
          kind: "Capstone",
          duration: "While your nerve holds",
          effect: "Damage dealt +40% and cast costs −10% while you run at overcharge without crossing. The run lasts as long as your Composure does.",
        },
      },
    ],
  },
  {
    slug: "trauma",
    name: "Trauma",
    category: "Applied",
    summary: "Binding, stopping the clock and standing a body back up. Rises on wounds worked on while the person shooting them is still there.",
    attribute: "Coordination",
    techniques: [
      {
        name: "Pressure",
        rank: "Practised",
        card: {
          kind: "Active",
          cooldown: "20s",
          range: "Melee",
          duration: "60s",
          effect: "Stops a Bleeding state with your hands in 5s: the wound is a Hit again, and stays one for 60s or until the next Hit.",
          notes: "A Bleeding patient who goes Down inside the 60s keeps their full Dying clock instead of half.",
          untested: true,
        },
      },
      {
        name: "Four Minutes",
        rank: "Expert",
        card: {
          kind: "Active",
          cooldown: "Once per fight",
          range: "Melee",
          effect: "Adds four minutes to a Down ally's Dying clock. Takes 10s of hands on them, and a Bleeding patient gets the four minutes on top of the halving.",
          notes: "Once per fight per patient. The clock keeps running while you work.",
          untested: true,
        },
      },
      {
        name: "Field Surgery",
        rank: "Ceiling",
        flavor: "the thing that needed a table, done on the ground, while it is still being shot at.",
        teacher: { text: "the Kestrel Medic", slug: "the-kestrel-medic" },
        card: {
          kind: "Capstone",
          cooldown: "Once per day",
          range: "Melee",
          effect: "Stands a Down ally back up at Hit, on the ground, in 90s. If you take a Hit during the 90s the work is lost and their clock keeps running.",
          notes: "Once per day per patient. A Broken limb stays Broken; this buys the walk to a table.",
          untested: true,
        },
      },
    ],
  },
  {
    slug: "fabrication",
    name: "Fabrication",
    category: "Applied",
    summary: "Mending, truing and making kit that outlasts its owner. Rises on repairs done in the field with the piece needed again by morning.",
    attribute: "Coordination",
    techniques: [
      {
        name: "Patch",
        rank: "Practised",
        card: {
          kind: "Active",
          cooldown: "15 min",
          range: "Melee",
          duration: "24 hours",
          effect: "Mends a break in kit, plate or weapon in 3 minutes: the piece works at full function for 24 hours, then fails at the same point.",
          notes: "A patched plate absorbs one Hit like any other. A second Patch on the same break does not hold.",
          untested: true,
        },
      },
      {
        name: "True",
        rank: "Expert",
        talentNode: "cypherist/true",
        card: {
          kind: "Passive",
          effect: "A weapon you have returned to what it was: damage dealt +30% and hit chance +4% with it.",
          notes: "One weapon at a time. Truing a second one un-trues the first.",
        },
      },
      {
        name: "History",
        rank: "Ceiling",
        flavor: "a piece good enough to be named, and to be taken.",
        teacher: { text: "the Foundry-Master", slug: "the-foundry-master" },
        card: {
          kind: "Capstone",
          cooldown: "Once per season",
          effect: "Makes a piece good enough to be named: it carries +1 plate slot or damage dealt +15%, and its name travels. Anyone who takes it off your body knows whose it was.",
          notes: "A named piece is a reclamation target in its own right; the body stays where it fell with everything on it.",
          untested: true,
        },
      },
    ],
  },
  {
    slug: "handling",
    name: "Handling",
    category: "Applied",
    summary: "Animals, beasts and what your party has done to them. Rises on creatures settled, sampled or read while they were deciding whether to kill you.",
    attribute: "Composure",
    techniques: [
      {
        name: "Calm",
        rank: "Practised",
        talentNode: "archon/calm",
        card: {
          kind: "Active",
          cooldown: "20s",
          range: "10m",
          effect: "Settles one animal in seconds, panicked or hostile. Works up to great-beast size.",
          notes: "The Archon's Calm is a Xenic spell; yours is a voice and a hand, and needs no pool.",
          untested: true,
        },
      },
      {
        name: "Sample",
        rank: "Expert",
        card: {
          kind: "Active",
          cooldown: "90s",
          range: "Melee",
          effect: "Takes a clean sample — blood, spore, essence — from a living creature within 2m in 10s without it turning on you. The sample assays true, and is worth a favour to any teacher who asked for one.",
          untested: true,
        },
      },
      {
        name: "Rung Read",
        rank: "Ceiling",
        talentNode: "archon/rung-read",
        flavor: "an animal's state on sight, and what your own party did to put it there.",
        teacher: { text: "Keira Ansel", slug: "keira-ansel" },
        card: {
          kind: "Capstone",
          effect: "Sees through 15% concealment and damage dealt +20%. A creature's mutation rung — None, Minor, Functional, Advanced, Aberrant — reads on sight, with what drove it there.",
        },
      },
    ],
  },
];

export function getSkill(slug: string): Skill | undefined {
  return skills.find((skill) => skill.slug === slug);
}

const categoryOrder: SkillCategory[] = ["Combat", "Field", "Technical", "Social", "Applied"];

export function skillsByCategory(): Array<{ category: SkillCategory; skills: Skill[] }> {
  return categoryOrder.map((category) => ({
    category,
    skills: skills.filter((skill) => skill.category === category),
  }));
}
