# Play rulings — 2026-09-02

Four design questions the ability-card rewrite surfaced. The owner delegated
the calls ("make the most intelligent, creative and strategic calls; think
balance and gameplay"). Each ruling below says what was decided, why it is
good for play, and where it landed. None of them changes a locked RULE; the
one that touched a canon dossier (attributes) filled a paragraph that dossier
had explicitly left open.

## 1 · The Cypherist casts through capacitor cells

**Ruling.** A capacitor cell holds **4 charges**: one Master cast, two
Certified, four Licensed. It is loaded at a bench from 8 pool or one dose,
spent once, and decays inside a day (canon: *reserves are capital, not
recovery*). The Cypherist's four spell nodes — Shield Pylon, Handshake,
Interface, Testimony — **cast from cells by default**, with pool or charges as
the alternative for a Cypherist who happens to be a caster.

**Why.** Origin is separate from class, so a None-origin Cypherist must be
able to fire the class's own spells. Cells are already canon's "spell in a
can and a rifleman's only spell"; this makes them the class's engine rather
than a footnote.

**Balance.** A cell-cast never enters the body, so **it advances no
corruption phase** — that is the Cypherist's strategic identity (tech's
answer to magic, *Clean Hands: you die whole*). It is paid for elsewhere,
mechanically: cells are capital (loaded beforehand, one day's shelf life,
Conductivity-many carried before they leak, the array carries the rest);
**ELECTRICAL vents every cell on you** (one Kill the Circuit empties the
Cypherist's whole magazine — the counterplay is a real one); a cell-cast
**reads as hardware on every instrument** (suspicion with the Bureau and
Aegis on every use); and **Spell in a Can carries Licensed tier only** —
Certified and Master through cells exist only on the Cypherist's own nodes,
so the class cannot become a corruption-free Conduit for the party.

**Landed in:** `lib/talent-cards/cypherist.ts` (handshake, interface,
testimony, shield-pylon, charge-packing, capacitor-array, spell-in-a-can),
`Docs/codex/ABILITY_CARD_STYLE.md` (cost table).

## 2 · Noon burns; Temporal deals evidence

**Noon (Radiant, Master).** Now **FIRE**: while channelled (30s at most), every
body in the 25m volume not under hard cover takes 1 FIRE Hit each 10s,
ignoring half a plate, Burning not applied — on top of the denial it already
was (no Occlusive, no concealment, +20% hit chance for everyone firing in).
**Why:** a Master spell at 8 pool that only denied was the weakest Master in
the registry, and the wound model already says Radiant deals FIRE. The sun is
not a searchlight. **Balance:** it burns both sides; the play is to be the
side under a Containment Seal, which is a two-caster combination and a real
decision. Slow enough (3 Hits over a full channel) that it never replaces
Flashover.

**Temporal (all four).** Typed **ARCANE**, and the type means something
specific: **Temporal deals no Hit; it deals evidence.** Every cast leaves an
ARCANE scar on the volume for a day — instruments flag it, a reader knows a
spell happened here, persistent damage keeps it. One exception with teeth:
**Rewind** puts anyone who was not in the room ten seconds ago back where they
were, taking 1 ARCANE Hit on the way, plate ignored. **Why:** the pillar's
horror is that it cannot be countered, so its price has to be that it can
always be *proved* — the stealth-hostile pillar. Rewind's expulsion gives a
Master spell a combat use (a breach undone, the breachers hurt) without making
it a damage spell.

**Landed in:** `lib/spellbook.ts` (noon, steady-the-hand, second-look, recoil,
rewind).

## 3 · History is bench time, not a cooldown

**Ruling.** The Fabrication capstone has no cooldown. Its `duration` is **7
days at a Master's bench**, and **one named piece per maker exists at a
time** — naming a second retires the first's name, and the world keeps the
retired name as a story. **Why:** "once per season" was a cooldown standing in
for a workshop; making it bench time ties the technique to the professions
system (a Master-rung workshop, a Foundry-Master's signature) and the one-name
rule makes a named piece a decision rather than a farm. Style guide gains the
convention: crafting capstones use `duration` for bench time and never carry
a cooldown.

**Landed in:** `lib/skills.ts` (Fabrication · History),
`Docs/codex/ABILITY_CARD_STYLE.md`.

## 4 · The per-class starting allotment

**Ruling.** Every class signs the file with **nine rungs, shaped 3 · 2 · 1 ·
1 · 1 · 1**: 3 in the primary (the attribute the class's growth line drives
first), 2 in the secondary, 1 in each of the other four. The player places
**2 more** where species caps allow, with **nothing above 4 at the desk**
unless a species says so (the Chartered's Specification starts one at 5 —
"top of the recruit band" — which is why 4 is the cap for everyone else), and
may move **1 point** between class-allotted attributes. Origin adds its rung
on top (None: Composure; Born: Conductivity; Gifted: the giver's pillar;
Infused: nothing but the Tremor). A recruit signs at **level 11 or 12**, inside
canon's 7–14 band, and quotes at about 165 Essence.

| Class | Primary 3 | Secondary 2 |
| --- | --- | --- |
| Bastion | Conditioning | Resilience |
| Spector | Coordination | Acuity |
| Conduit | Conductivity | Composure |
| Surger | Conditioning | Conductivity |
| Archon | Acuity | Composure |
| Procurator | Composure | Acuity |
| Cypherist | Acuity | Coordination |
| Maverick | Coordination | Composure |

**Why this shape.** Nobody starts at 0 in anything — a recruit is a whole
person before they are a build, and the wound model needs Resilience ≥ 1 for
a Dying clock that is not zero. The 3/2 split is small enough that the
player's two points and the one-point move can flip a class toward its
secondary (a Conductivity-heavy Surger, an Acuity Spector), which is the
"head start, not a lock" law applied to numbers. Deriving primaries from the
growth lines is deliberate: a class should start where it grows, or day one
and day thirty tell different stories about the same person.

**Landed in:** `lib/character-sheet.ts` (`classAllotments`, `creationRules`,
`startingRungs`), `/codex/character`, and the `attributes` codex entry's
"Starting allocation at enlistment" paragraph — which previously read "TBD —
ask Tino" — via `scripts/author-attribute-allotment.ts`.
