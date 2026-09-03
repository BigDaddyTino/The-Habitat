# The Radiant Path — integration and rewrite plan

**Status:** planned. No code, no codex writes yet.
**Owner rulings:** 2026-09-03 (doctrine, filing, Arcadia, joinability, and the
contributor card).
**The faction:** `the-radiant-path` — CANON, v3. Written by **Schlotzsky**
(Ryan) on 2026-09-02; Tino's faith-weave sits on top of it.

---

## 1 · Context

The Path is the only one of 37 factions with no tier, no accent, no art, no
goals, no leaders, no relations and no ground. It has one wikilink and none of
the closing **"Where they stand on the Drain"** paragraph every other faction
dossier carries. It is meant to be the central faction of the Peninsula Arc
and Port Arcadia's conflicting group.

Four facts decide the weave:

1. **The Congregation of the Bound** keeps the Forgefaith — Sextons at every
   Forge, a platform ledger in every chapel, "the largest faith on the
   peninsula and the smallest throne." Its permanently-open question is
   *"Where ARE the dead between the falling and the platform? Glimpse
   discipline — the faith's discipline is not asking."*
2. **Arcadia has no faction entry.** Enmity is `relations[].faction` pointing
   at a slug, so the Path has nothing to be the enemy *of*.
3. **The faith lane already reserves the Path's slot** for the Arcadia pass.
4. **Two items already exist that this arc needs**: `choir-ledger-page` — *"one
   page torn from a Crimson Choir account, naming a debt and its collateral,
   and the Choir honours its paper to the letter"* — and `the-single-name`,
   the peninsula's only funeral.

World-connection audit: **PASS, 40/40** connections readable from both ends,
and every slug this plan links resolves (33/33; `the-asis-officer` is PROPOSED,
which "link now, fill later" permits). The grammar is sound. The Path simply
uses none of it yet.

---

## 2 · The rulings

| # | Ruling |
| --- | --- |
| 1 | **Doctrine** — a Forgefaith heresy that answers the Congregation's forbidden question. |
| 2 | **Filing** — a wing of the Crimson Choir: `parent: crimson-choir`, `gameTag: KM · feeds the Crimson Choir (Shadow)`. |
| 3 | **Arcadia** — write `the-nation-state-of-arcadia` so the conflict exists in data. |
| 4 | **Player role** — joinable and leavable. |
| 5 | **Attribution** — Schlotzsky's original text is preserved verbatim in a gold-bordered card at the foot of the dossier, website-only, never exported. |
| 6 | **Rewrite** — his skeleton, new prose. Every idea, method and escalation survives, argued in the world's vocabulary; a word-loss check proves nothing of his was dropped. |
| 7 | **The Choir** — **Ade knows, Vetch does not.** The founder is sincere; the man who reads the ledgers signed with his eyes open. |
| 8 | **Dying** — **a real mechanic that costs the commons.** Standing rises with reclamations, and every passage draws the shared reserve. |
| 9 | **Brother Aster** — **used actively.** The Path's endgame is to reach the one witness who was on the far side. He never answers. |

---

## 3 · The doctrine

### The Testimony

The Congregation's Sextons sit with the reclaimed in the first hour and ask
nothing. That is their whole pastoral discipline. **Ilse Vetch was asked
nothing, and answered anyway.**

She died on the waterfront when a crane sling parted, and she was reclaimed on
a foreman's account — not out of mercy, but because an inquest cost more than
a reclamation. She came back on somebody else's money, for somebody else's
reasons, and she would not stop talking about what she had seen.

What she says: there is no dark. Between the falling and the platform there is
a light with no source and no edge; you are *in* it, you are not alone in it,
and it wants nothing from you. Then a machine in a room you did not pay for
reaches in, takes you out of it, and hands you back your debts.

### The four articles

1. **You were in the Light.** Everyone the machine ever brought back has been.
   The forgetting is not evidence it did not happen. *The forgetting is the
   injury.*
2. **The Forge does not save. It interrupts.** It is a machine, and machines
   are owned.
3. **They charge you rent on your own soul.** Thirty-five Essence to build a
   body, and eleven point seven for every level of the person who used to live
   in it. The Congregation's platform ledger records who was worth it.
4. **What was taken in common must be held in common.** Seize the means of
   resurrection.

### The rite: the Remembering

A convert is walked back through their own reclamation by someone who has been
through more of them. It is not a metaphor, and the Path counts.

### The ladder

The Path's hierarchy mirrors the Congregation's and inverts its humility:

| Rung | Who |
| --- | --- |
| **The Unlit** | Never died. Fed, welcomed, and told plainly that the truth is not theirs yet. |
| **The Witnessed** | Reclaimed once. |
| **The Returned** | Reclaimed three times or more. |
| **The Radiant** | The leadership — those who claim to remember. |

**This is the design's sharpest edge: the Path makes dying an act of
devotion.** In a world where every reclamation draws on a reserve the whole
settlement shares, a faith that raises your standing each time you come back
is horrifying, perfectly logical, and entirely native to Martino. It also
turns the game's own respawn loop into a recruitment funnel — a player who
dies often is *rising* in the Path without having chosen to.

### The contradiction, kept true on both sides

The Path's grievance is **real**: permanence is rationed by wealth, Arcadia is
a plutocracy, and whoever holds a Forge decides who is allowed to be
permanent. The Path's practice is **genuinely destructive**: every passage
burns a commons that everyone draws on. Nobody inside the Path sees it,
because nobody inside the Path reads the ledger — except the one man who did,
and the Congregation, which says so out loud and is called a bigot for it.

Neither half cancels the other. That is the house standard: *nobody woke up
evil.*

### The unwitnessed

The Forge never records chrome. So the Path holds that the augmented cannot be
witnessed in the Light — they come back incomplete, or they never went at all.
Southside is full of cheap chrome. A movement of the excluded that excludes,
and the Cybernetic Ascendancy is its heresy, which puts it on the same side of
one argument as the Congregation it hates.

### Glimpse discipline holds

Canon never confirms the between-place. The Path *claims* it. Nobody can
disprove a testimony — that is exactly what makes them dangerous, and it
protects the mystery the codex is built on.

---

## 4 · The buried truth

**The Crimson Choir funds the Path.** Free binding for the unbound, paid on
Choir credit.

The movement preaching that the rich charge you rent on your own soul is
financed by the one power that lends against souls and always collects. The
Choir does not want Arcadia overthrown. A faith that drives people to die more
often, and pays for their reclamations on credit, is a machine for
manufacturing debtors — and `choir-ledger-page` already exists in canon,
naming "a debt and its collateral." The collateral is the convert.

Most of the Path does not know. The Radiant who signs knows exactly.

It also inherits the Choir's protective trick: canon says four powers each
confidently misfile the Choir and all four are wrong. The Path is misfiled the
same way — sedition to Arcadia, heresy to the Congregation, a security problem
to the Directorate, an asset to the Choir.

---

## 5 · The people

New CHARACTER entries, PROPOSED, with the codex's placeholder-name discipline.

**Ilse Vetch — the First Witness.** Southside. Reclaimed once, on a foreman's
account. Not a strategist and not a liar: she believes every word, which is
why it works. The movement rests on one woman's testimony and she knows it,
and that knowledge is the loneliest thing about her.

**Sexton Corrin Ade — the one who crossed.** Eleven years keeping a platform
ledger in a Forge hall, and he read it. He knows who was brought back, how
often, and who was quietly refused. He gives the Path everything Vetch cannot:
organisation, Forge procedure, and numbers. *He did not join for the Light. He
joined for the ledger.* The most dangerous person in the movement, and the
only one who could be argued out of it with evidence.

**Wren Salloway, the Almoner.** The Choir's factor. Presents as the Path's
benefactor and is genuinely, patiently helpful — arranges the binding, settles
the account, asks nothing on the day. The person who gives the Path its money
is the person who will collect it.

**The ASIS handler** — use the existing `the-asis-officer` rather than invent
one. Their job is to run an informer inside the Path, and the cost of that is
the arc's quietest horror.

**The convert you already know.** `binding-in-arcadia` already contains the
node **`the-one-who-asked`** — *"A Kestrel survivor recognises the party — not
by face, by question."* That survivor becomes the Path's recruiter. The hook
is already written and waiting; this arc only has to walk through it.

---

## 6 · The objects

- **The platform ledger.** New ITEM: the Congregation's record of who came
  back and how many times. It rhymes with `choir-ledger-page` deliberately —
  two ledgers, one naming who was worth reclaiming, one naming who owes for
  it. **Laying them side by side is the arc's climax**, and neither is a
  weapon; they are just paper that ends an argument.
- **`the-single-name`** — the peninsula's only funeral, a grave marker with one
  word on it. What the Path offers instead of a grave, and what it takes from
  those who cannot pay.

---

## 7 · The mechanical hooks

**Dying is devotion.** Standing in the Path rises with reclamations. The
respawn loop becomes the recruiter.

**The sacrament is the evidence.** The Forge records everyone it brings back,
so the Path's own purity ladder is simultaneously the state's list of
suspects. Arcadia can read the movement's leadership straight off Forge
records. A faith whose holiest rite files a report on you.

**The dead zones.** Arcadia's installations dampen magic and electronics in
their own footprint, and `suspicion` stops accruing inside them. That is where
the Path meets — and it is why a movement of the poor knows the location of
every military dampening field in the city.

---

## 8 · Where it lives

| Ground | Row | Why |
| --- | --- | --- |
| `the-southside` | `contests` | The floor of the city; "the only district that will not ask what you are." Undefended, and it sends its children to other people's wars. |
| `embassy-row` | `influences` | The accreditation fight. Arcadia permits no bases, only accredited presences that "align ideologically with the Nation-State" — which the Path violates by construction. |

Port Arcadia's own open question is *"Which factions hold an accredited
presence on Embassy Row, and on what terms."* This arc answers it.

These are the **first control rows on the Peninsula** apart from Draw Nine —
they light the region on the Nation board and the atlas at once.

---

## 9 · The Nation-State of Arcadia

New FACTION, an index over `port-arcadia`'s existing dossier; no new canon
invented.

| field | value |
| --- | --- |
| `gameTag` | `KM · Institution (city-state)` |
| `scope` | Plutocratic city-state: the peninsula's only human nation |
| `seat` | `port-arcadia` · `leaders`: `abraham-islay-kane` |
| `faith` | `null` — secular by constitution, which is itself information |
| `control` | `port-arcadia` → **holds** |
| `relations` | `the-radiant-path` **enemy** · Stormglass, Aegis, the Directorate |

Also gives the Sovereign Guard somewhere to hold standing — its own open
question flags that gap today. Whether the Guard, ASIS and the Chancellory
become wing factions is a later call.

---

## 10 · The contributor card — "the Schlotzsky treatment"

A reusable feature, not a one-off.

**Behaviour.** At the foot of any dossier, a card with a glowing gold border
holding a contributor's original submission, verbatim, credited to them by
their codex name. Website only. **Never exported.**

**Architecture.** A new table, `StoryEntryContribution`
(`entryId`, `contributorUserId`, `label`, `body`, `createdAt`, `updatedAt`).

The guarantee is structural, not a filter: the outbound bundle's entry mapper
in `apps/codex-sync/src/snapshot.ts` is an **explicit allowlist**
(`id, kind, slug, title, summary, body, meta, status, version, createdBy,
updatedBy, createdAt, updatedAt`). A table it does not name cannot leak. Storing
this in `body` or `meta` would ship it; a table cannot.

**Render.** Bottom of `story-entity-profile.tsx`, gold border with a soft
outer glow, header reading *Contributor's original — Schlotzsky*, prose
rendered as written.

**Guards.** A test asserting a built snapshot contains none of the
contribution text; the release audit gains a line confirming contributions are
absent from the export payload.

**The law it establishes:** when a member writes something we build on, their
original stays on the page, under their name, whole — and the codex the game
reads never carries it. Same treatment, every time, for every contributor.

---

## 11 · The Peninsula Arc

A THREAD on the `the-fuse-at-heartland` model — factions, locations,
characters, stages, canonPackets carrying these rulings, openQuestions.

Its shape: the party lands unbound and owed nothing. The Path finds them
first, because the Path always finds the unbound first. The offer is real —
binding, free, no service owed — and it is paid for on a credit line nobody
mentions. Somewhere in the middle the party can read a ledger. At the end they
can stay, break it, or hand it to Arcadia.

**The confrontation.** Vetch believes every word. Ade signed the credit line
and tells himself it was the only way to feed people. The player who gets both
ledgers onto one table can let her read what he signed — and break the
movement on its own founder's face. It is available, it is earned, and it
destroys something that was, at the bottom, true.

### The exit: the Path goes to find Brother Aster

The Path's claim would be settled by a single witness who was on the far side
of the light. **Brother Aster is a Forge and a person**, and the Congregation's
own open question is whether it will ever ordain him — *"the Sexton of
Heartland has not asked him."*

The Path decides to ask first.

That is the Peninsula's exit and the answer to the Heartland thread's standing
question, *"Which mainline beat actually delivers the player to Heartland?
Owned by whoever writes the Peninsula's exit."* The arc ends with the Path
setting out for Heartland to put the question to a Core that could answer it —
with the player alongside them, ahead of them, or carrying word to the people
trying to stop them.

**Glimpse discipline is absolute here.** Aster does not preach. The arc ends
on the journey, never on the answer; what he would say is permanently open,
and the Congregation's horror is simply that the heresy reached the witness
before the church did. The Fuse at Heartland picks up from the road.

---

## 12 · Art — the image manifest

**Nine images needed. Everything else this arc touches is already delivered.**

Already on disk, no work: `the-asis-officer`, `abraham-islay-kane`,
`choir-ledger-page`, `the-single-name`, `the-southside`, `embassy-row`,
`port-arcadia`, `upper-westside`, `crimson-choir`,
`the-congregation-of-the-bound` (+ logo), `the-fuse-at-heartland`,
`the-forgefaith`, `the-faith-lane`.

### Current convention (measured from the newest delivery)

The Congregation of the Bound is the most recent faction plate and sets the
house standard — **not** the older 1280×853 JPEG:

| kind | spec |
| --- | --- |
| Faction key art | **1672×941 PNG**, sRGB, RGB24, no alpha |
| Faction logo | **1024×1024 PNG**, sRGB (older logos carry alpha; transparent composites better over the key art, so prefer alpha unless the emblem bakes its own ground) |
| Character portrait | 1672×941 PNG |
| Item / thread plate | 1672×941 PNG, RGB24 |

**Wiring trap:** `getFactionBranding` resolves key art as `.jpg` unless the
slug is in the `pngFactionKeyart` set in `lib/faction-branding.ts`. Deliver
PNG and **add both new slugs to that set**, or the URL points at a `.jpg` that
does not exist and the release audit fails.

### The nine

| # | path | subject |
| --- | --- | --- |
| 1 | `factions/the-radiant-path.png` | The night procession |
| 2 | `faction-logos/the-radiant-path.png` | The broken ring |
| 3 | `factions/the-nation-state-of-arcadia.png` | The Chancellory steps |
| 4 | `faction-logos/the-nation-state-of-arcadia.png` | The reef bars |
| 5 | `characters/ilse-vetch.png` | The First Witness |
| 6 | `characters/corrin-ade.png` | The Sexton who crossed |
| 7 | `characters/wren-salloway.png` | The Almoner |
| 8 | `items/the-platform-ledger.png` | The ledger |
| 9 | `threads/<peninsula-arc-slug>.png` | The arc plate |

**1 · The night procession.** Southside after dark. Lamps carried low at waist
height so every face lights from beneath; wet boards and standing water
throwing the light back up; the crowd walking with open hands. Corrugated
favela wall behind, the harbour cranes far off and cold. The front of the
procession is out of frame — nobody is preaching, they are only walking. Warm
white-gold, the single warm source in a blue-grey district. It must look like
something you would want to join. No insignia.

**2 · The broken ring.** A ring of warm light with one hairline break at its
lowest point, and a second smaller circle inside it, set off-centre — the
light, and the hole the machine makes in it. Non-linguistic, and deliberately
unlike any real-world religious or political device.

**3 · The Chancellory steps.** Midday, high ground. Enfranchised Arcadians on
clean stone, the harbour and its cranes far below and slightly hazed, a
Sovereign Guard detail in undress uniform standing easy. Bone, brass and cold
sun. Power that has never had to raise its voice. No insignia.

**4 · The reef bars.** Austere geometry: parallel bars narrowing, the reef
that makes the sea lanes thin. Blank, abstract, institutional.

**5 · Ilse Vetch.** Human, thirties, Southside, dockworker's build. A crane-
sling scar across the collarbone — the injury that killed her. Plain clothes,
lit from below by a carried lamp. Not costumed, not radiant: an ordinary
person who believes something enormous and is telling you about it. She should
look like someone you would trust on first meeting.

**6 · Corrin Ade.** Human, fifties. A Sexton's habit with the Congregation's
marks stripped off it, reading glasses pushed up, ink worked into the
fingers. Tired, precise and unhappy. A man who reads, photographed mid-thought
rather than mid-sermon.

**7 · Wren Salloway, the Almoner.** Immaculate, warm, wholly pleasant — good
coat, good gloves, a document case held like it weighs nothing. The most
reassuring person in any room, and nothing anywhere on them says Choir. Drawn
attractive, per the standing direction.

**8 · The platform ledger.** A heavy ledger open on a chapel table beside the
glow of a Forge Core. Columns, rules and tally strokes — **no legible writing
anywhere**, per the zero-text law; the marks are marks, and any word is
edge-on, blurred or out of focus. The most dangerous object in the arc,
photographed like a parish record.

**9 · The arc plate.** The lamp-lit procession seen from a high Chancellory
window at night — small, warm and unstoppable, framed by cold glass and the
silhouette of whoever is watching it. The arc is Arcadia looking down at
something rising in its own basement.

### Then, and only then

Accents into `lib/faction-branding.ts`, slugs into `pngFactionKeyart`, and
`brandedFactionCount` 36 → 38 in `faction-branding.test.ts`.

**Sequencing trap:** an accent whose two files are not on disk **fails the
release audit and blocks deploys**. Art first, accent second, never the
reverse.

**Standing direction.** Per the luminous ruling — *bright ≠ chaste, holy ≠
plain* — the Path is drawn beautiful. **A gorgeous movement is a frightening
one; an ugly one is a strawman.**

**Deferred:** a faith plate at `systems/<faith-slug>.png` if and when the
Arcadia pass rules the Path's revealed doctrine into the faith lane.

---

## 13 · Order of work

1. `the-nation-state-of-arcadia` + its control row — unblocks every rivalry.
2. The Path's rewrite: meta, relations, ground, and the new body.
3. The contributor card: migration, render, export guard, backfill Schlotzsky.
4. Faith-lane sync (the Path's `faith` field and the reserved-slot line move together).
5. Characters: Vetch, Ade, Salloway.
6. The platform-ledger item.
7. The Peninsula Arc thread.
8. Art briefs, then art, then accents.

**Verification:** `audit-release.ts` · `audit-story-connections.ts` ·
`audit-codex-art-coverage.ts` · `tsx --test lib/*.test.ts` · a snapshot test
proving no contribution text ships · screenshots of `/codex/nation` (Shadow
tier), `/codex/library/factions`, and both dossiers.

---

## 14 · Questions the codex must keep open

The four owner questions were ruled on 2026-09-03 and are recorded in §2.
These are the ones that stay open on purpose, and go on the sheets as
`openQuestions`:

1. **Where are the dead between the falling and the platform?** Never
   answered. The Congregation refuses the question; the Path claims an answer;
   canon confirms nothing. Glimpse discipline.
2. **What would Brother Aster say?** He does not preach. The arc ends before
   the asking, and the codex never writes his reply.
3. **What does the Path do the first time a convert asks to leave?** Unwritten,
   and the first writer owns it. Canon law says a power that cannot be left is
   a prison — the Path's answer to that is the measure of what it has become.
4. **Who was Ilse Vetch before the crane?** Her account was settled by a
   foreman who wanted an inquest avoided. Whether anyone ever tells her that is
   open.

## 15 · Risks to hold in mind while building

- **Aster is a Riverlands character in a Peninsula arc.** He is used by being
  *reached for*, never by being explained. If a draft has him speaking about
  the between-place, the draft is wrong.
- **Dying-as-devotion is not a systems change** — an earlier draft of this plan
  called it one, wrongly. Reclamation already costs 35 Essence plus 11.7 a
  level out of a reserve the whole register shares; that is canon, it is
  everywhere, and nothing about it moves. The only new rule is one line on a
  faction sheet: **standing in the Path rises with reclamations.** The drain is
  existing canon doing exactly what it already does, to a population that has
  decided to do it more often. A sim is wanted only if we ever want to publish
  a figure for how fast a devout cell empties a settlement's reserve.
- **The both-true rule.** The Path's grievance is real and its practice is
  destructive. A draft that makes it only sympathetic, or only monstrous, has
  failed the house standard.
- **Schlotzsky's text is never edited.** It is copied into the contribution
  table verbatim and the dossier body is written fresh beside it.

---

## 16 · The Peninsula itself

The Peninsula is a stub with two children — `port-arcadia` and `draw-nine` —
and its own dossier says so: *"Everything beyond them, including inland
regions, settlements, factions, and future quests, is open for contributors to
define at their leisure."* If the Path is the spine of Act I, the Peninsula has
to become a place.

### The fact that makes all of this inevitable

Canon already says the Peninsula *"was hunted clean during the Great Purges
two thousand years ago — its everyday emptiness of magic is not natural but
inherited, a crime scene old enough to look like geography."*

That is the keystone, and it was sitting there the whole time:

> **The Peninsula has no magic of its own, because its magic was killed here.
> So the Forge is the only miracle left on it — and whoever owns the Forge owns
> the only holy thing on the peninsula.**

That is *why* a Forgefaith heresy is born in Arcadia and not in the Reach or
the Riverlands. Everywhere else, the world still hums. Here, the machine is
all there is.

### New ground under `the-peninsula`

Four regions, enough to make it a place without sprawling it:

| slug | what it is |
| --- | --- |
| `the-green` | The jungle wall behind Arcadia, past the exclusion area — the only official land exit opens into it. Lethal, unmapped, and where the city's writ stops. |
| `the-ash-ground` | A purge site two thousand years cold: where the givers were taken for Essence and for eggs. Read as geology now. Nothing grows in the shape of the pens. |
| `lamplight` | The Path's camp in the green: where it meets outside the walls, out of the lattice, and buries the ones it could not afford to bring back. |
| `the-lower-gate` | The exclusion area's far side — the checkpoint from the jungle's point of view, and the road every refugee, smuggler and convert actually walks. |

`the-green` carries the Path at `influences`; `lamplight` at `holds`;
`the-ash-ground` is held by nobody and that is the point.

---

## 17 · Amanda

`the-empty-cribs` already lists its locations as **`the-peninsula`** and
**`port-arcadia`**. She is not being imported into this arc; she is already
standing in it.

### Why she is the most dangerous person on the peninsula

Her sheet: *"Her kind gave magic through willing death and resurrection: the
gift passed outward, while the giver returned from a scaled egg in the ashes.
Amanda hides almost all of that power until the-empty-cribs."*

Set that against the Path's four articles and the whole design locks:

> The Radiant Path preaches that resurrection should cost nothing, that the
> Forge is a machine the rich own, and that they have been charging you rent
> on your own soul. **Amanda dies and comes back without a Forge, without
> Essence, without a reserve and without a ledger.**
>
> She is the Path's doctrine, alive, hiding in the trees.

And she is hiding on the exact ground where her people were hunted to make it
empty. The one thing the purges missed, walking through the crime scene.

### The horror, which is the point

If the Path found out what she is, they would not get a messiah. **They would
get a supply.** The Lizzarnix were slain for *"legendary Essence and priceless
eggs."* The Path is bankrolled by the Crimson Choir, which prices souls and
always collects.

The movement that preaches nobody should be charged rent on their own soul is
funded by the only people who could put the peninsula's one free soul on a
ledger. The Path would sanctify her. Its creditors would harvest her.

### How she is used, and what is not touched

- The party meets her **in the green**, hunting the same man they are — her
  sheet has her chasing where her children went and what happened to Tino, and
  `the-captivity-arc` is the mainline hunt for Tino. Same trail, two reasons.
- She does not reveal what she is. She hides almost all of it until her own
  thread, and that stays true here.
- **The player ends the arc holding a secret that could arm or destroy a
  movement**, and the game never makes them spend it in Act I.
- Nothing in `the-empty-cribs` is resolved, moved or contradicted. Her
  spoilerLevel is `ending`; this pass adds a meeting and a danger, not an
  answer.

### The triangle worth writing

| | claim |
| --- | --- |
| **Church of the First Gift** | Only the gift costs nothing; extraction is desecration. She is their proof. |
| **The Radiant Path** | Resurrection should cost nothing. She is their dream. |
| **Amanda** | Wants to find her children and is not available to be anybody's evidence. |

Two faiths that would both venerate her, one of which would get her killed,
and a woman who wants neither. That is the Peninsula in one image.

---

## 18 · What this adds to the build

To §13's order of work, after the thread:

9. **Peninsula ground** — `the-green`, `the-ash-ground`, `lamplight`,
   `the-lower-gate`, with control rows and connections out of
   `exclusion-area`.
10. **Amanda's Peninsula weave** — a marker-appended section on her dossier
    placing her in the green during Act I, and a canon packet on
    `the-empty-cribs` recording that the Path must never learn what she is.

Art, added to §12's manifest — four region plates at 1672×941 PNG:
`regions/the-green.png` · `regions/the-ash-ground.png` ·
`regions/lamplight.png` · `regions/the-lower-gate.png`.

**The Ash Ground plate** is the one to get right: a jungle clearing where the
canopy grows in rectangles because something was penned here two thousand
years ago, and nothing has ever grown right since. No bones, no signage,
nothing explained — just geometry in the trees that should not be geometry.
Amanda has walked through it. The plate never says so.

**Total images now thirteen.** Amanda already has key art; her remaster
already carries a Peninsula sunset and a phoenix-fire silhouette, which is the
whole of §17 in one picture that was made before anybody planned this.

---

## 19 · How the main story walks the Peninsula, and where Amanda joins

Almost none of this needs inventing. The mainline already runs to the
Peninsula and stops there, and Amanda's recruitment mission is already
written, already ordered first in her chain, and already carries the stage
`peninsula`. What is missing is the connective tissue.

### What exists

Mainline arcs, by position: `the-island-is-already-lost` (0) →
`the-last-days-of-kestrel` (1) / `the-evacuation` (2) →
`binding-in-arcadia` (3) → `the-captivity-arc` (4). **The mainline currently
ends on the Peninsula.** `the-hollow-wing` and `the-danger-of-true-death` sit
beside it; everything in the Reach is 800+ and is side content.

Amanda's companion chain is nine CANON missions, ordered, staged:

| # | mission | stage |
| --- | --- | --- |
| 1 | `the-woman-in-the-peninsula` | **peninsula** |
| 2 | `smoke-in-her-hair` | early-game |
| 3 | `the-night-we-were-happy` | mid-game |
| 4 | `two-empty-cribs` | mid-game |
| 5 | `after-the-cribs` | mid-game |
| 6 | `the-man-who-left` | late-game |
| 7 | `he-never-stopped-looking` | late-game |
| 8 | `am-hors-ormen-da` | late-game |
| 9 | `the-man-she-never-stopped-loving` | endgame |

### The act, start to finish

**1 · Landfall and binding** — `binding-in-arcadia`. Two roads into one city;
find the Forge; bind. Until they bind, one death ends everything
(`the-danger-of-true-death`). **The party spends this whole stretch unbound —
which is precisely the Path's recruiting pool, and the Path finds them before
Arcadia does.** The offer is real: binding, free, no service owed.

**2 · The city prices them** — the Path in the Southside, the Congregation at
the Forge halls, Arcadia's accreditation regime on Embassy Row. The player
learns what permanence costs here and who decides it.

**3 · The hunt begins** — `the-captivity-arc` opens with `the-missing-man`:
*"Nobody is looking for Tino. Whatever the party carries out of Arcadia is the
entire search."* The trail leads **out of the city**, and Arcadia has exactly
one official land exit: the exclusion area, into the green.

**4 · The Path is the road out.** They bury the ones they could not afford to
bring back, so they know the jungle roads and the checkpoint's habits. Getting
out through the exclusion area means dealing with them — which is how a
faction becomes load-bearing to the mainline instead of a side story.

**5 · The green, and the rescue.** The jungle is lethal and the city's writ
stops at the treeline. The party gets into serious trouble.
**`the-woman-in-the-peninsula` fires**: Amanda rescues them, violently and
mostly annoyed about it — *then she hears who they are looking for, and a curl
of smoke rises from her hair.*

**The recruitment gate is therefore two conditions, both already in canon:**
the party must be in the green, and the party must already be hunting Tino.
She does not join the party. **She joins the search.**

**6 · Her chain opens.** `smoke-in-her-hair` follows immediately — NPCs keep
mentioning Tino, and the party learns to read her warning signs. From there her
chain runs beside the mainline for the rest of the game.

**7 · The exit** — the Path sets out for Heartland to put its question to
Brother Aster, and the player goes with them, ahead of them, or carrying word
to the people trying to stop them. The Riverlands opens.

### The two hunts, and where they meet

The mainline and Amanda's chain are the same hunt from two directions, and
they were built to converge:

- **The mainline is procedural** — requisition lists, thirty-one places where
  nothing was found, a Helix facility working normally, and a watch that says
  *ask*.
- **Her chain is the truth** — who he was, the night they were happy, two
  empty cribs, and the reversal where she learns she has hated the wrong story
  for years.
- **They meet at the cell.** The mainline's `the-containment-site` and
  `the-cell-opens` are the same place as her mission 9: *"the facility, the
  failed subjects, Tino's records — and the containment cell. Amanda is
  coming, and no party system in the game gets to say otherwise."*

### What the Path costs her, and when the player understands it

Her species is not revealed until mission 8, `am-hors-ormen-da`, late-game —
*an ancient creature recognises Amanda as Lizzarnix and names the extinct
fire-blooded people who gave magic to the world's races through death and
rebirth.*

So in Act I she is simply the woman who saved you, and **the Path's danger to
her is dramatic irony the player cannot yet read.** The Path preaches that the
dead return and that resurrection should cost nothing, while the one being on
the peninsula who actually does it walks past their camp in the dark.

The payoff lands at mission 8 and is retroactive: the player realises the Path
has been describing Amanda the entire time — and that the people funding them
price souls and always collect.

### The connective tissue to write

1. The beat that pushes the search out through the exclusion area, so
   `the-missing-man` has a road.
2. The Path as that road — a dealing, a favour, or a debt at the Lower Gate.
3. The trouble in the green that fires `the-woman-in-the-peninsula`; jungle-
   native rather than factional, so her rescue stays clean.
4. Re-point that mission's `locations` from the vague `the-peninsula` to
   `the-green` once the region exists.
5. A canon packet on `the-empty-cribs`: **the Path must never learn what she
   is**, and no Act I beat may hint it.

---

## 20 · THE LAMPLIGHT ROAD — the Peninsula mainline arc

**MAINLINE · position 5 · region `the-peninsula` · continues into the Riverlands.**

The city, the gate, the green, the road, the Riverlands. The Peninsula leg of
the main campaign, and the arc that finally answers Heartland's standing
question about what delivers the player to its gates.

**Architecture, per the owner: Amanda's nine-mission chain is not touched.**
The mainline hits **one node** where the player meets her. Her chain webs off
from that node and runs on its own clock forever after. The mainline does not
wait for her, does not gate on her, and continues through the green without
her if she is left behind.

**The relationship to `the-captivity-arc`:** the captivity arc is the *reason*
to travel — it gives the party a name, no help, and a direction inland. The
Lamplight Road is the *travelling*. They interlock rather than compete.

### The beats

**1 · The trail points inland** `QUEST_START`
The party is bound now, and the search is theirs alone: *nobody is looking for
Tino.* The trail runs inland, and Arcadia has one land door — the exclusion
area, which *"excludes in both directions."* You do not simply walk out of
this city.

**2 · The gate that excludes both ways** `CHOICE`
Three ways through, and they are the whole game rendered as a checkpoint —
**who owns your passage owns you a little.**

- **Arcadia's way.** A commission from the Expeditionary Army, or from ASIS,
  who would very much like eyes inside the Path. You go out as the state's
  instrument and you owe a report.
- **The Path's way.** Walk out with the procession. Free, no service owed, no
  questions about what you are. You go out as one of the Unlit.
- **The Cartel's way.** Stormglass moves freight through the green. Pay, or
  owe — and Stormglass remembers who owes.

**3 · Lamplight** `SCENE`
The Path's camp in the green: out of the lattice, off the ledger, where they
bury the ones they could not afford to bring back. The player sees the
movement at its best — fed, welcomed, nobody asking what you are. At dark
there is a Remembering, and Ilse Vetch speaks, and she is *good*.

This beat's whole job is that **the offer is genuinely, unfakeably good**
before anyone sees its price.

**4 · The two ledgers** `CHOICE` *(available, never required)*
Corrin Ade keeps the Path's roll now. A player who has been paying attention —
or who took ASIS's commission — can get the Choir's paper onto the same table
as it: *"a debt and its collateral,"* in the Choir's own hand.

Show Vetch, and the movement breaks on its founder's face. Do not, and the
debt keeps compounding on people who fed you last night. **Both are a cost.**
Breaking the Path takes the only thing feeding the Southside's unbound.

**5 · The deep green** `QUEST_STEP`
The crossing. The Peninsula was hunted clean two thousand years ago and the
green is what grew back over it; the jungle is lethal and the city's writ ends
at the treeline. Something goes wrong, and the party is separated, overrun, or
simply lost somewhere that does not care.

**6 · The woman in the green** `SCENE` — **the node**
She arrives, violently, and mostly annoyed about having to. Then she hears who
they are looking for, and a curl of smoke rises from her hair.

> **This is the hand-off and the only one.** `the-woman-in-the-peninsula` is
> her chain's mission 1 and it fires here. From this node her nine missions
> web off and run their own course. The mainline records the meeting, links
> `amanda`, and walks on.

She does not join the party. **She joins the search.**

**7 · The Ash Ground** `SCENE`
The road passes a clearing where the canopy grows in rectangles, because
something was penned here two thousand years ago and nothing has grown right
since. Nobody explains it. No bones, no marker, no dialogue about it.

If Amanda is walking with the party, **she goes quiet, takes a different line
around it, and does not say why.**

Nothing is revealed. Her species is not named until mission 8, late-game, and
this beat never breaks that — it simply means that on a second playthrough
this is the worst thirty seconds in the act.

**8 · The procession** `QUEST_STEP`
The Path is walking to Heartland to put its question to Brother Aster — a
Forge that is also a person, the one witness who was on the far side. Hundreds
of lamps on a jungle road, moving toward a city that does not know they are
coming.

**9 · Arrival** — three endings, three reputations

| ending | how you arrive | what the Riverlands sees |
| --- | --- | --- |
| `ahead-of-it` | You went fast and warned Heartland. | A stranger who brought a warning, and Arcadia's thanks. |
| `with-it` | You walked in among the Unlit. | One of them, whatever you privately are. |
| `behind-it` | You broke the Path at Lamplight and followed the pieces. | Someone trailing a scattered faith, carrying what is left of it. |

Each hands off to the Riverlands and to `the-fuse-at-heartland` when that arc
is authored (`continuesIn` set then).

### What this does for Heartland, without touching it

Heartland's fuse is **Alder Wade's accidental death** and the Judge naming the
newcomer detective. That is theirs and this arc does not move it.

What the Lamplight Road delivers is the **powder, not the spark**: a neutral
city under a generation-old Standstill, five factions holding five gate-legs,
everyone polite and counting exits — and a thousand pilgrims arriving at its
gates to ask its Forge a question its own church has never dared ask.

Wade dies. The city was already full.

That is the Peninsula's exit, and it is the answer to the Heartland thread's
open question — *"Which mainline beat actually delivers the player to
Heartland? Owned by whoever writes the Peninsula's exit."*

### Node manifest

`the-trail-points-inland` (QUEST_START) · `the-gate-that-excludes-both-ways`
(CHOICE) · `a-commission` · `walk-with-them` · `freight` (QUEST_STEP ×3) ·
`lamplight` (SCENE) · `the-two-ledgers` (CHOICE) · `what-she-does-with-it`
(SCENE) · `the-deep-green` (QUEST_STEP) · **`the-woman-in-the-green` (SCENE —
the hand-off)** · `the-ash-ground` (SCENE) · `the-procession` (QUEST_STEP) ·
`ahead-of-it` · `with-it` · `behind-it` (ENDING ×3).

Fifteen nodes; `binding-in-arcadia` runs eleven.

### Why the Path had to be load-bearing

The Path is not a side faction the player may investigate. **It is the road.**
They bury their dead in the green, so they know its paths and the
checkpoint's habits; the procession is the only crowd big enough to walk a
lethal jungle; and the party spends the first act unbound, which is exactly
who the Path exists to find.

A player can take Arcadia's commission or the Cartel's freight and never join
them — but they will still walk the same road, sleep at the same camp, and
arrive at Heartland in the middle of the same crowd.

---

## 21 · The cast, extended — nine faces on the Peninsula

Three faces was a pamphlet. This is a city with a faith in it, an argument with
two right answers, and a road that kills people.

**Already planned:** Ilse Vetch, who believes every word · Sexton Corrin Ade,
who read the ledger, left, and signed the Choir's paper · Wren Salloway the
Almoner, who arranges the binding and will collect.

### Sexton Imogen Roe — the one who stayed

The Congregation's face, and the argument against the Path that is not
political.

Thirty years sitting with the reclaimed in the first hour, asking nothing. Four
hundred people held while they came back, and not once has she told any of them
what is on the other side — **because she does not know, and saying so is the
whole of her discipline.**

**And she held Ilse Vetch.** Roe was the Sexton on duty the night the crane
sling parted. She remembers a woman who said nothing for six hours and then
asked for water. Vetch remembers a light with no edge.

Neither is lying. Neither can ever prove it. **That is the best scene in the
arc**, and it plays from either direction — bring Roe to Lamplight, or walk
Vetch back to the chapel that held her. Roe never raises her voice and never
once calls the Path a heresy in front of its people. She is the hardest thing
in the act to argue with.

### Del Anwar — the one you already met

A Kestrel survivor off the same boats. **`binding-in-arcadia` already has the
node:** `the-one-who-asked` — *"A Kestrel survivor recognises the party — not by
face, by question."* That is Del.

You meet him again at Lamplight, fed, safe, believing, and *happy* for the
first time since the island. He is not a fool and not a fanatic. He was
drowning, and the only people who reached were these people.

**Whatever the player does to the Path, they do to Del.** He is the cost, with
a name you already know.

### Inspector Cassia Merrow — Arcadia's hand

ASIS. Her file is the Path, and she is not a bigot — she is something worse for
the player's conscience. She is **right**.

*"I have read the same roll you have. The difference is that I have also read
the Southside's reserve reports, and I can tell you how many people the Path's
devotion kills this winter. None of them will be Path. They will be the ones
who fall off a crane and find the reserve already spent."*

She wants an informer inside Lamplight, would prefer it to be the player, and
will be reasonable for exactly as long as reasonable works.

### The Marker — the graveyard the faith grew around

The most important reframe in this pass.

**The Path did not found Lamplight. They came to where the graves already
were.**

She was burying the Southside's unaffordable dead out past the exclusion area
long before Ilse Vetch ever fell — the ones no Forge would spend a reserve on.
She carves `the-single-name` markers, one word each, because that is the only
funeral left on the peninsula.

She is not of the Path, does not argue with them, lets them meet among her
stones, and keeps count. **Her count is the only honest one on the Peninsula.**

### Radiant Ivo Crane — the one who wants a war

Vetch preaches. Ade counts. **Crane arms the Unlit.**

He is why Arcadia's fear is reasonable rather than bigoted, and why
Schlotzsky's word *militant* is load-bearing rather than decorative. He burns
Aegis catcher wagons on the green roads and calls it liberation; the people he
frees are real, and the drivers he kills are real drivers with debts.

**The Choir likes him best.** A movement that fights needs more credit than a
movement that prays, and Salloway's paper is always ready.

---

## 22 · The third ledger, and the rest of the story

### Three ledgers, not two

| ledger | keeps | kept by |
| --- | --- | --- |
| The **platform ledger** | who came back, and how many times | the Congregation |
| The **Choir's paper** | who owes for it, and the collateral | Salloway |
| The **stones** | who never came back at all | the Marker |

Two ledgers on a table is an argument. **The third is not paper — it is a field
of single-name markers in the green, and it is the only count nobody can
dispute.** Put Ade's roll beside the Choir's paper and Vetch can call it
forgery, slander, Pathophobia, anything at all. Then you walk her out among the
stones.

> *"Four hundred names on your roll. Three hundred and eleven stones out here.
> Ask her which of them the Light kept."*

### The winter reserve — a clock with a real number

Merrow's argument as pressure instead of dialogue. Devotion draws the
Southside's Forge reserve down, and canon already owns the vocabulary —
**Healthy, Thin, Dry**, and the quartermaster's horn that tells a whole field
dying has stopped being temporary. A district reaching Thin is that horn,
sounded quietly, in a city.

The player watches a number they cannot directly fix, and the people it kills
are never Path. **Nothing about the Forge economy changes; this is existing
canon, aimed.**

### The road remembers

Walking hundreds through a lethal green kills some of them, and the Marker
walks with the procession. By the Riverlands the road is marked — **you can
track the crowd by its stones**, and a player who runs ahead passes every grave
the people behind them have not dug yet.

### Crane's war

He burns a catcher wagon in the deep green and the arc changes register: the
procession stops being a religious question and becomes a military one. Arcadia
hardens. Merrow stops being reasonable. **The Path's moderates lose the
argument to Crane exactly when the player most needs them to win it** — and a
player who has been sympathetic has to decide whether sympathy survives contact
with what the movement is becoming.

### What the Path does when somebody leaves

The open question, given a face: **Del tries to leave.** Late on the road, after
Crane's war, after the stones. What the Path does to him is its true answer to
canon's law that *a power which cannot be left is a prison* — and the player is
standing right there.

The codex does not pre-write that answer. The first writer of the scene owns
it, and it should be the last thing written.

### Beats added to the Lamplight Road

Between `lamplight` and `the-procession`: `the-two-witnesses` (SCENE) ·
`three-hundred-and-eleven` (SCENE) · `an-informer` (CHOICE) ·
`the-catcher-wagon` (QUEST_STEP) · `the-thin-reserve` (CONDITION, readable all
act) · `what-del-does` (SCENE, late).

**Twenty-one nodes**, still one hand-off to Amanda, still nothing touching her
chain.

---

## 23 · Points of interest

Places the arc actually stands in. Filed the way the codex files places —
`zone` for a district, `site` for a place in the world, `destination` for a
building — each under a real parent.

### In Port Arcadia

| slug | type | parent | what it is |
| --- | --- | --- | --- |
| `the-lamp-chapel` | destination | `the-southside` | The Congregation's poorest chapel, where Roe sits with the reclaimed. Vetch came back in this room. |
| `the-drawn-shutter` | destination | `the-southside` | A dead-zone room the Path meets in — no lattice, no suspicion, and everyone there knows exactly why. |
| `the-quiet-office` | destination | `arcadian-special-intelligence-service` | Merrow's office. Nothing on the walls. |
| `the-accreditation-hall` | destination | `embassy-row` | Where the Path files, is refused, and files again. Arcadia's foreign policy as a queue. |

### The green and the road

| slug | type | parent | what it is |
| --- | --- | --- | --- |
| `the-lower-gate` | site | `exclusion-area` | The checkpoint from the jungle's side — the road every refugee, smuggler and convert actually walks. |
| `lamplight` | site | `the-green` | The camp. Out of the lattice, off the ledger, among the graves. |
| `the-stone-field` | site | `lamplight` | The Marker's ground. Three hundred and eleven single names, and room for more. |
| `the-ash-ground` | site | `the-green` | Canopy growing in rectangles. Never explained. |
| `the-burned-wagon` | site | `the-green` | Where Crane made it a war. Stays on the map afterwards. |
| `the-last-water` | site | `the-green` | The procession's final camp before the Riverlands; where the road's own graves begin. |

`the-stone-field` under `lamplight` is the load-bearing one: **the graveyard is
the parent of nothing and the child of the camp, which is the wrong way round,
and that is the point.** The faith is filed inside the graveyard's world.

---

## 24 · Art, updated

Five portraits at 1672×941 PNG: `characters/imogen-roe.png` ·
`characters/del-anwar.png` · `characters/cassia-merrow.png` ·
`characters/the-marker.png` · `characters/ivo-crane.png`.

Region and POI plates, same spec, as each place is written — `the-green`,
`the-ash-ground`, `lamplight`, `the-lower-gate`, then `the-stone-field` and
`the-lamp-chapel` as the two that carry scenes.

**The one to get right is the Marker**: an old woman with a chisel, a rock face
of single-word stones behind her, **not one word legible** — because the
zero-text law and the meaning of that field happen to want exactly the same
thing.

---

## 25 · Abraham Islay Kane — the Peninsula's other protagonist

### The fact that reframes the whole arc

`createdBy` on sixteen CANON entries says **schlotzsky**:

> `waterfront-district` · `the-southside` · `the-northside` · `lower-westside`
> · `upper-westside` · `east-side` · `census-office` · `exclusion-area` ·
> `embassy-row` · `arcadian-special-intelligence-service` ·
> `arcadian-soverign-guard` · `chancellory-of-arcadia` · `the-docks`
> (archived) · **`arcadian-devil`** · **`abraham-islay-kane`** ·
> **`the-radiant-path`**

**Port Arcadia is Ryan's city.** Six of its seven districts, the office that
counts you in, the gate that counts you out, the spy service, the army, the
seat of government, the monster in the jungle, the Chancellor, and the faith.
This was never a plan to integrate one faction into somebody else's world. It
is a plan to build the Peninsula act **out of one contributor's material**,
with the codex's spine under it.

Which settles Kane's role immediately, because the strongest thing you can do
with two creations by the same author is put them on opposite sides of one
floor and make the player pick.

### Kane in one line

> He is the only man in Port Arcadia who thinks the Radiant Path is right, the
> only one who can destroy it, and the only one who will not let the city do
> the thing that would.

Not a companion. Not recruitable — his own dossier already says so. He leaves
the Chancellory exactly once in this act, and it is to stand on a floor.

### The five things he carries

**1 - The face.** Reclamation "resolves into skeleton, then muscle, then
vessels, then skin," and the Forgefaith's own loud heresy states that **the
Forge never records chrome**. Generalise that (section 26) and Kane's face
becomes a document: *a man who has been reclaimed does not keep his scars.* The
head of a plutocracy that rations permanence is the only man on the Upper
Westside who never bought any. He has never said so. He has never had to.
**The Radiant Path's single best sermon is standing in the Chancellory and it
belongs to the enemy.**

**2 - The condemnation.** Canon: Arcadia was the first nation to publicly
condemn the use of humans as Essence, the position is *genuinely held* and
*extremely convenient*, "and the codex does not resolve which weighs more."
Kane is where that refusal gets a face and a voice — and his open question
(*"What Kane actually thinks of the harvest"*) is answered in this act, once,
in a small room, and it does not resolve the tension either. It just puts a
man inside it.

**3 - The veto.** The one formal power in Arcadia a unanimous chamber can
overrule, at the price of one of their own risking death. Fifteen years
unbroken. Section 28 breaks it.

**4 - The register.** The Chancellory's daily business includes "the standing
register of who is outside the walls," and the Exclusion Area's record of who
went out and whether they came back is "one of the more closely held documents
in the city." **Kane knows the size of the procession before ASIS reports it,
and he knows how many came back.** That register is a prop the player can be
shown, refused, or handed.

**5 - The measure.** Arcadia elects on military service, wealth, and
*demonstrated ability to survive.* In a Forge economy that third measure is a
question about death which the chamber has never wanted to say out loud. **The
Path says it out loud in the street.** That is why the Path is a constitutional
problem and not merely a public-order one.

### Where he stands with each face

| face | the relationship |
| --- | --- |
| **Ilse Vetch** | He meets her once. He does not argue — **he agrees with her, in front of witnesses**, and then tells her plainly what he is going to have to do. It is the worst thing that happens to her in the act. |
| **Corrin Ade** | Ade kept a platform ledger for eleven years and **Kane's name is in none of them.** An absence in a ledger is evidence. Ade can prove the Chancellor never bought permanence, and is holding it, because he has not decided which way it cuts: hypocrite, or proof. |
| **Ivo Crane** | Crane needs Kane to be a tyrant, because a tyrant justifies a war. Kane declines, patiently, for the whole act, and it is the most infuriating thing about him. |
| **Cassia Merrow** | Her Chancellor, and the man she is quietly protecting from the consequences of what she does for him. |
| **The Marker** | They will never meet. He signs the line item that pays for her stone, filed under barrier maintenance. |
| **Del Anwar** | A name on a deportation schedule the player can put in front of him. |
| **Wren Salloway** | He does not know she exists. **That is the largest hole in Arcadian intelligence and the arc never closes it.** |

### What he wants, and what he will not do

He wants the city to still be there in thirty years. He is not trying to be
loved and he is not trying to be right.

He will not clear the Southside. That is the veto, and it is where a careful,
unhurried, entirely reasonable man stops being movable.

### His three states at the arc's end

Matched to the three arrivals, so the Riverlands inherits an Arcadia with a
history:

| state | what happened | what the Riverlands hears |
| --- | --- | --- |
| **He stands** | The veto holds. The Path leaves on its own terms. | Arcadia refused to empty its own floor — and the chamber has learned it can reach unanimity. |
| **He falls** | The veto is overruled. The Clearance proceeds. | Arcadia walked a district into the green. The Marker's field triples. The procession is a deportation. |
| **He wins, and is not the same** | The veto holds, on the floor, in person. | The Red Devil earned the name again at sixty-one, and everyone who watched stopped talking about it. |

---

## 26 · The scar ruling — what the Forge rebuilds

**One new RULE, proposed, because Kane's face and the Southside's chrome both
depend on it.** Flagged in section 14 for an owner yes before anything is
written.

> **`what-the-forge-rebuilds`** — The Forge builds the body the Echo knows, and
> the Echo does not know what was done to the body afterwards. Scars,
> amputations, brands, worn joints and **chrome** do not come back.
> **Corruption does** — a phase is a state of the person, not damage to the
> body, which is why nobody has ever escaped a phase by dying.

This is less an invention than a generalisation: *the Forge never records
chrome* is already canon, sitting inside the Forgefaith's quarrel with the
Cybernetic Ascendancy. The rule says the rest of that sentence.

**What it pays for immediately:**

- **A scar is a class marker in a Forge economy.** Upper Westside faces are
  smooth. Southside faces are not. Nobody in Arcadia has ever said this and
  every Arcadian can read it across a room.
- **Kane's face is a political document**, and the Path can use it two ways.
- **The Southside chrome scene**, four lines long, which explains both of the
  Forgefaith's heresies at once: a rigger who spent three years' wages on a
  spinal rig goes off a crane, and comes back whole, poor, and unable to do the
  only work he had. **The Path is waiting at the platform. So is the
  Ascendancy.** He picks a church in the first hour of the rest of his life,
  naked and shaking, while both of them make their case over his head.
- **The Path's "unwitnessed" doctrine gets a source.** They did not invent the
  exclusion of the augmented. They inherited it from the machine and called it
  revelation.
- **Corruption survives death**, which stops the corruption system from being
  laundered by a respawn.

**Risk, stated plainly.** This touches a system rather than a dossier, and the
last time this plan called something a systems change it was wrong. This one
is. It changes no cost, no number and no reserve rule — it answers a question
the codex has never answered — but it is a RULE entry, and it needs an owner
ruling rather than a writer's decision.

---

## 27 · Coming back less — the Path's real cost, entirely from existing canon

The `reclamation` dossier already says it:

> "If there is not enough, the Forge builds what it can afford — and the
> shortfall is paid out of the person: experience is lost and levels go down.
> Nobody dies permanently; they come back **less**."

Put that beside the Path's ladder — standing rises with reclamations — and the
faith's engine assembles itself with nothing new added:

1. The Southside's Forge reserve runs Thin.
2. The Path teaches that dying is devotion.
3. The most devout are the most reclaimed.
4. **The most reclaimed are the most diminished.**
5. **The Radiant are being hollowed out by their own sacrament and read it as
   humility.**
6. The Congregation's platform ledger holds the count. **Ade kept it. Ade can
   tell you exactly how much of each of them is gone.**

### What that does to the cast

**Ivo Crane, eleven reclamations.** He was a foundry rigger with a union card
and a good head for load. He is now a short, loud, certain man with a smaller
vocabulary than the one he was born with. **He did not become a fanatic. He was
reduced to one.** He does not know, because nobody who has lost it can miss it,
and no line of dialogue in the arc ever says so. It is in the ledger, the
ledger is readable, and that is all.

**Ilse Vetch, one.** Her testimony is intact because she has only died once —
which means **the founder is the least devout person in her own movement by her
own ladder**, and Crane outranks her. That is the arc's political clock, and it
runs whether or not the player touches it.

**The ladder read backwards is a damage report.** The Unlit, whole. The
Witnessed, once. The Returned, three or more. The Radiant, "those who claim to
remember" — and the ones who claim to remember most have the least left to
remember with.

**And the player's own respawn loop.** A player who dies often in this act
rises in the Path *and* loses levels, and **the game never once connects the
two out loud.** The welcome gets warmer at exactly the rate the character sheet
gets smaller.

**Nothing in the Forge economy changes.** No new cost, no new reserve rule, no
new number. This is existing canon aimed at a faction — said explicitly,
because this plan got that distinction wrong once already.

---

## 28 · The Duelling Floor — the act's hinge

Canon's standing question is *"whether the ceremonial duel has ever been called
during his fifteen years, and against what."*

**Answer: once. This act. And it is not the Path's doing — it is Arcadia's.**

### The chain

1. **Crane burns a catcher wagon** on the near green, inside the Exclusion
   Area's reach. He frees eleven people and kills two drivers. Both halves are
   true, both halves are on screen, and both halves have names.
2. **Aegis prices the loss. The chamber prices the precedent.** A city that
   sells competence abroad cannot be seen to lose freight at home.
3. **The Upper Westside moves the Clearance** — every unbound, unregistered and
   Path-affiliated resident of `the-southside` walked out through the
   `exclusion-area` and not readmitted. Legally a deportation. Practically a
   mass grave with a queue, because the green kills and **a Forge reserve does
   not follow you out of the walls.**
4. **Kane vetoes it inside the hour.**
5. **The chamber reaches absolute unanimity** — the whole constitutional
   oddity, in one session, for the first time in fifteen years — and authorises
   the floor.

### The constitutional gap that is the scene

The law names only this: absolute unanimity, then a formal duel in which **one
of their own number** risks death.

It has never said who answers for the Chancellor, because it has never been
called. **That gap is the whole scene, and it is asymmetric on purpose:** the
chamber must bleed in person; the Chancellor may be answered for. A city that
governs by willingness to die has a loophole in it that nobody noticed, because
nobody ever got this far.

The player can stand for the Chancellor. **The player can never stand for the
chamber** — the law forbids it, so a player who thinks the Clearance is right
cannot fight for it. They can only *not help*, or hand the chamber evidence,
and both roads lead to the same floor with the same man on it.

### The four ways through

| choice | what happens |
| --- | --- |
| **"I do."** | A foreigner fights for the Chancellor's veto in front of the enfranchised of Arcadia. The party's standing changes in a way that is neither good nor bad, and Kane's thanks are cold, because **he did not ask, and he wants the player to think about why.** |
| **"He can answer for himself."** | Sixty-one, one eye, and no coat taken off. He wins. |
| **Table the Choir's paper first** | The Clearance now has evidence, and Kane's veto reads to the chamber as protection of a Crimson Choir front. **He does not withdraw it. He fights anyway, and afterwards nobody thanks him.** |
| **Be somewhere else** | The gate is open before the floor is called. A player can walk out and hear about it from a stranger in a camp. **Not every legendary scene needs the player in it**, and an act that insists otherwise is a worse act. |

### The outcome, and why the procession exists

**This is the structural payoff: the duel is what puts the Path on the road.**

- **Veto holds.** The Path is not cleared — and Vetch has watched the chamber
  reach unanimity once and understands it will be faster next time. She takes
  the question to Brother Aster **before the city takes the decision out of her
  hands.** She leaves on her own terms, and the procession is a pilgrimage.
- **Veto falls.** The Path is walked out at bayonet point through the Exclusion
  Area. **Same road. Same camp. Same graves. Completely different crowd**, and
  the procession is a deportation with lamps in it.

One beat, one duel, two arcs down the same jungle road — decided by a fight the
player may not even attend.

### What it costs Kane in every branch

The chamber has now learned it can reach unanimity. It took fifteen years to
find out. It will take less next time. He says exactly that, once, sitting
down, and it is the only line in the act where his voice comes up.

---

## 29 · The green has teeth — species, creatures, monstrosities

### First, a correction the canon forces

Section 22 said the Marker buries "the ones no Forge would spend a reserve on."
Canon does not allow that. Reclamation says plainly: *if the reserve is short,
the Forge builds what it can afford and the shortfall is paid out of the
person.* **Nobody dies permanently for want of money.** They come back less.

So there are exactly two kinds of body in the ground on this peninsula, and
both of them make the arc better:

- **The unbound.** No Forge holds their Echo, so every death is `true-death` —
  the state both prologue branches arrive on the mainland in, and precisely the
  Path's recruiting pool. **The Path's free binding is not a kindness. It is
  the difference between a platform and a one-word stone**, which is why
  breaking the Path is monstrous and why Del Anwar is happy.
- **The Unregistered.** *Pattern unresolved.* A Forge can record one and can
  never rebuild one. Every death, first to last, is true death.

### The Marker is Unregistered

The best upgrade available in this pass, and it costs nothing.

`the-single-name` is canon and it is *theirs*: "cut by a party for one of the
Unregistered who died once, carrying the only name they ever had." The Marker
does not borrow the form. **She is the form.** One name, no family name, no
calendar name — you only get one of everything.

Which means the Radiant Path's doctrine has no place for her at all. *You were
in the Light* — she never will be, and neither were any of her people, ever, in
two thousand years. Vetch's first article is that everyone the machine brought
back has been in the Light. **The Unregistered are never brought back. So
either they were never in it, or the Light is not what she says it is** — and
Ilse Vetch has no answer, and has never once been asked.

**The Marker can break the Path without paper.** That makes her the third
ledger in the truest sense: Ade's roll is evidence, the Choir's paper is
evidence, and the stones are a person standing in a field who has outlived
everyone in the argument.

It also rhymes the Path's cruelty back at it — a movement of the excluded that
excludes the augmented, meeting in a graveyard kept by the one people the world
excludes by default.

And `the-single-name` already carries the hook: *"standing with every
Unregistered who hears of it, and they hear of all of them. They do not forget
who buried their dead."* The stone field is a standing engine that was written
long before this arc needed one.

### The Dam — the Arcadian Devil's female form

**Ryan wrote the male and left the female open**: *"Males of the species will
develop their Fore claws into massive Pincers to dominate territory and
rivals."* That sentence is an invitation, and this is a proposal to him rather
than a decision over him.

She does not fight for territory. She **selects** it. A Dam nests where carrion
is reliable, and reliable on this peninsula means *where people keep dying in
the same place.* She does not raid the camp. She has never had to come closer
than the treeline.

**The stone field has a queen under it, and the Path has been feeding her for
two years by holding funerals.**

**And the economics close the loop.** The Arcadian Devil is, in Ryan's own
words, "the richest source of essence in the deep arcadian jungle." So:

> The Path harvests Devils to pay for reclamations. The Unlit earn their
> passage on Devil crews. Devil crews get people killed. The dead go into the
> field. The field feeds the Dam. The Dam's brood is the richest Essence on the
> peninsula.

A perfect closed circle that looks exactly like providence. **Ilse Vetch calls
it the Light providing.** It is a nest.

**The optional apex encounter, and the best three-way choice in the act.**
Killing a Dam yields an Essence windfall that cannot resurrect anybody in the
field — nothing can; they are unbound and Unregistered — but it can do in one
night what the Choir's credit line does over years:

| what you do with her | what it means |
| --- | --- |
| **Give it to the Path** | Hundreds of unbound bound at once. **The Path stops needing the Crimson Choir**, and Salloway's paper is worth nothing. The best outcome anyone reaches in this act, bought with the worst thing in it. |
| **Give it to Arcadia** | The Southside's reserve stops going Thin this winter. Merrow was right, the numbers say so, and the people it saves never know. |
| **Sell it** | The single richest object on the peninsula, and Stormglass runs freight through this green. Nobody in the story blames you. The field fills up anyway. |

**Rated-R, and the arc means it:** what the umbrella-sheathe does to something
already dead; a brood in the dark under three hundred and eleven stones; the
sound the field makes at night that Lamplight has decided is wind.

### The Lamplighter — one new species

A canopy ambush predator of the deep green that hunts with a lure.

The lure is a **soft, sourceless, edgeless light**: cold, filling a space
rather than shining from a point. Prey walks into it and stops walking. It is
not hostile. It wants nothing from you, right up until it does.

**The bestiary entry uses Ilse Vetch's exact words, and never says so.**

> "There is no dark. There is a light with no source and no edge, and you are
> in it, and you are not alone in it, and it wants nothing from you."

**Discipline, absolutely:**

- No character ever says *that is what she saw.*
- No document connects them. No `[[wikilink]]` between the two entries, in
  either direction, ever.
- Vetch **cannot** have seen one. She died on wet boards on the waterfront,
  inside the walls, and she has never been in the green in her life. The
  coincidence is not evidence. It is worse than evidence — it is a resonance,
  and there is no arguing with a resonance.
- If a player says it out loud to a friend, we did it right. If the codex says
  it, we ruined it.

**And the name.** The Guard's expedition register calls it a Lamplighter,
contemptuously, the way soldiers name the things that frighten them: *a thing
that puts a light out on a dark road to see who walks toward it.*

**The Path's camp in the green is called Lamplight.** Nobody in the game ever
remarks on this. The two entries simply share a word.

### The Quiet Altar — a monstrosity, glimpsed

Canon loaded this gun already: the Crimson Choir's cells "run from candlelit
salon-societies in the great cities to raw jungle altars," and **"some of those
altars now answer to something the Choir did not invite."**

Wren Salloway walks out of Lamplight on the last night of every month. The camp
has decided it is a rendezvous with a supply train. It is an altar four
kilometres into the green, and it is where the Path's free bindings are
actually paid for — in the oldest currency, by a woman in a good coat, on
behalf of people who have never been told.

**What is at that altar is a glimpse and stays a glimpse.** One silhouette. No
name, no statline, no entry beyond the POI. `the-old-hunger`'s writing law
governs it — *an impossible silhouette, a feeding calendar, and the fact that
the Ashen Court reroutes around certain places* — and nothing is ever
confirmed.

It gets a structural rhyme, and the rhyme is the point:

> **`the-quiet-office`** — where Arcadia decides what happens to the Path.
> **`the-quiet-altar`** — where the Choir decides what the Path costs.
>
> Two rooms nobody in the movement has ever stood in, where everything about
> them is settled.

### The three writes

| entry | kind | note |
| --- | --- | --- |
| `arcadian-devil` | CREATURE (**edit**) | The female form appended to Ryan's dossier. His prose is not touched; the addition is marked, and it is a proposal to him. |
| `the-lamplighter` | CREATURE (**new**) | `parent: beasts`, `category: natural`, `biomes: [the-peninsula]`. Never linked to `the-radiant-path`. |
| `the-quiet-altar` | REGION / POI (**new**) | `site` under `the-green`. Glimpse discipline; no creature entry behind it. |

---

## 30 · The format these quests get written in

Per the owner: the arc is authored as real quest data, not as prose that
someone later has to convert. The codex's shapes are already exact, so this
section is the contract every beat in section 31 is written against.

### A node

`StoryNode` — `kind` (BEAT · SCENE · DIALOGUE · CHOICE · CONDITION ·
QUEST_START · QUEST_STEP · ENDING) · `key` (unique in the arc) · `title` ·
`summary` (<= 500) · `body` (the reading surface: prose, inline attribution,
`[[wikilinks]]`) · `speakerEntryId` (**only** when the whole node is one voice;
null is correct for most SCENE and BEAT nodes) · `completion` (QUEST_STEP
only — writer intent, never parsed) · `effects[]` · `rewards[]` ·
`endingKind` + `continuesInArcId` (ENDING only).

### A line

`StoryLine`, the export contract v5 unit — one WAV, one importer dialogue node:

`number` (**frozen export identity**, `<arcSlug>/<nodeKey>/<nn>`, minted once,
never renumbered, retired rather than reused) · `order` (moves freely) ·
**exactly one** of `speakerEntryId` (a CHARACTER entry) or `speakerRole` (a
kebab-case role) · optional listener · `text` (**plain**: one utterance, no
line breaks, no `[[`, no `**`, no `#`, <= 1000 chars) · `performance` (<= 200) ·
`intensity` 1-10 · `emotion[]` from the fixed twelve — `neutral calm dry amused
warm sad afraid angry urgent contempt protective command` · `locale` · `voiced`.

**New roles this arc needs:** `chamber-speaker`, `sexton`, `path-convert`,
`guard` (exists), `player` (exists).

### A choice

An outgoing `StoryEdge` from a CHOICE node: `label` (what the player sees) ·
`condition` · `effects[]` · `position` · `voiced` (true when the option is a
spoken player line rather than an intent).

### House rules the existing arcs already keep

- The body carries the scene with quotes attributed inline; **every quote in a
  body also exists as a StoryLine.** Prose is the reading surface, lines are
  the record beside it.
- `effects[]` reads as consequence in plain language — *"Nobody. The file opens
  with a count of one"* — except where a flag is genuinely meant, and then it
  is literally `set flag: <name>`.
- Choice labels are either the player's spoken words in quotes **or** a plain
  intent phrase. Never both styles inside one node.

### The standard this arc holds itself to

1. **Every CHOICE node has at least three labelled edges.**
2. **At least one of them is a cost, not a benefit.** No option is obviously
   correct.
3. **No choice is gated on codex knowledge.** Every ending must be reachable by
   a player who never opened a bible page.
4. **Silence is always an option** where a person is talking to you, and it is
   never the empty one.

### Voice discipline, per speaker

This is the part a future writer actually needs, and it maps onto
`voiceProfile` when the portraits are commissioned.

| who | how they talk | typical |
| --- | --- | --- |
| **Ilse Vetch** | Plain, warm, short. Never rhetorical. She has never given a speech in her life and it shows — the reason she convinces people is that she is visibly not trying to. | `warm` `calm`, i3-5. **She goes above 5 exactly once in the act.** |
| **Corrin Ade** | Numbers first, sentence second. Says "four hundred and eleven" where anyone else says "hundreds." **Never says the word Light.** | `dry`, i3-4 |
| **Wren Salloway** | Kind, unhurried, helpful, present tense. Never threatens, never asks for anything on the day. **Her worst line should sound like a favour.** | `calm` `warm`, i2-4 |
| **Ivo Crane** | Short, loud, certain. Still uses a rigger's load words for people — *that'll hold, that won't.* The vocabulary is smaller than the man it belongs to (section 27). | `angry` `command`, i6-9 |
| **Sexton Imogen Roe** | Asks questions, answers almost nothing. The only person in the act comfortable with silence; her lines should sit next to gaps. | `calm`, i2-4 |
| **Cassia Merrow** | Professional, sourced, never raised. Cites documents by name. | `dry` `command`, i4-6 |
| **The Marker** | Counts. Speaks in numbers and does not explain them. | `dry` `sad`, i2-4 |
| **Abraham Islay Kane** | Measured, unhurried, exact — his canon voice field: *does not raise his voice to be obeyed.* Short declaratives. Says "the city" where others say "we." | `calm` `command`, i3-5 — **and exactly one line at 9, on the floor** |
| **Del Anwar** | The only one who sounds happy. | `warm` `amused`, i5-6, falling through the act |

---

## 31 · Four beats, written

Not summaries. These are the nodes as they go into the board — body, lines,
edges — so the standard is set before the other twenty-six are written.

### 31.1 · `an-audience` — CHOICE — "One Question"

*Movement I, Port Arcadia. Location `chancellory-of-arcadia`. Speaker: null,
two voices. Earned by the player having been read: the Census Office file, the
Southside, or Merrow's interest.*

**Summary.** The Chancellor receives the party once, asks a single question
that is not the one they prepared for, and does not tell them whether they
answered it.

**Body.**

> The Chancellory's daily business is unremarkable and extremely competent:
> budgets, barrier maintenance schedules, and the standing register of who is
> outside the walls. You are on that register. That is the only reason you are
> in this room.
>
> It is not his office. It is a small room off the debating chamber with two
> chairs and no window, and [[abraham-islay-kane]] is already in one of them,
> reading, and he finishes the paragraph before he looks up.
>
> The left side of his face does not move the way the right does. In a city
> where a man can be built new from the skeleton out, he has kept every mark
> anything has ever put on him, and he has never once explained why, and no
> Arcadian has ever needed him to.
>
> Then he asks his question, in the tone of a man asking about the weather, and
> it is not the one you prepared for.

**Lines.**

| nn | speaker | int | emotion | performance | text |
| --- | --- | --- | --- | --- | --- |
| 01 | `abraham-islay-kane` -> `player` | 4 | `calm` `dry` | he finishes the paragraph first | "Sit. Your file says inconclusive. That is Inspector Merrow's favourite word, and it means she has not finished." |
| 02 | `abraham-islay-kane` -> `player` | 4 | `calm` | — | "You have eaten in the Southside. Somebody offered to pay for your binding and asked nothing for it, and you are still working out what that cost you. So am I. Fifteen years." |
| 03 | `abraham-islay-kane` -> `player` | 3 | `calm` | no emphasis anywhere in it | "So. If a man tells you that permanence in this city is rationed by wealth, and he is right, what do you do with him?" |

**Edges** — four, all `voiced: true`, all converging on `what-he-keeps`:

| label | condition | effects |
| --- | --- | --- |
| "You call him right. Then you stop him." | — | Kane closes the file himself. The commission through the exclusion area is offered without ASIS attached to it. |
| "You give him what he is asking for." | — | Kane does not argue. He asks who pays for it, and writes down the answer. |
| "You find out who is paying him." | party holds Merrow's commission | The Chancellor and ASIS are now running the same errand through the same person. Merrow is not told. · `set flag: kane-and-merrow-unaware` |
| "Nothing. He is right." | — | Kane says the city cannot afford that answer and neither can he, and the audience ends politely and early. |

**They all converge, because Kane's answer is the same either way. That is the
whole point of him.**

### 31.2 · `what-he-keeps` — SCENE

**Body.**

> He does not tell you which answer he wanted. He does not tell you whether you
> gave it. He stands, and the audience is over, and on the way to the door he
> says the only thing in the room that was not procedure.

**Lines.**

| nn | speaker | int | emotion | performance | text |
| --- | --- | --- | --- | --- | --- |
| 01 | `abraham-islay-kane` -> `player` | 5 | `calm` | at the door, not turning round | "I was the first man in that chamber to say out loud that we should not burn people for fuel. I have run a government that prices permanence every day since. Both of those are me." |
| 02 | `abraham-islay-kane` -> `player` | 4 | `calm` `command` | — | "Whichever one you tell people about, tell them the other one as well." |
| 03 | `abraham-islay-kane` -> `player` | 4 | `calm` | — | "The chamber will move on the Southside inside a month. I will stop it. Ask me afterwards what I think of the woman down there who says I am renting her back her own soul." |
| 04 | `abraham-islay-kane` -> `player` | 4 | `dry` | — | "I will tell you that she is right. I will also tell you what her church costs this district by winter. Both of those are true as well. Good afternoon." |

**Effects.** *Port Arcadia's standing open question — what Kane actually thinks
of the harvest — is answered, in his voice, and resolves nothing.*

### 31.3 · `the-floor` — CHOICE — "Absolute Unanimity"

*Movement I, the hinge. Location `chancellory-of-arcadia`.*

**Summary.** The chamber reaches unanimity for the first time in fifteen years,
a thirty-four-year-old representative stakes her life on the Clearance, and the
law has never said who answers for the Chancellor.

**Body.**

> The floor is part of the building. Maintained, swept, unused, and treated by
> the architecture with more ceremony than the debating chamber beside it —
> Arcadians who have never seen it used can describe it precisely, and today
> most of them are going to see it.
>
> The measure is the Clearance: every unbound, unregistered and Path-affiliated
> resident of [[the-southside]] walked out through the [[exclusion-area]] and
> not readmitted. It is legally a deportation and every person in this room can
> do the arithmetic. [[abraham-islay-kane]] vetoed it inside the hour. Under
> Arcadian law the chamber may overrule him, provided one of their own number
> stands on that floor and stakes their life on it.
>
> Representative Ottoline Vasque is thirty-four, Upper Westside, and has never
> held a weapon in anger. She has read the Southside's reserve reports. She
> believes the Clearance saves more people than it kills, she may be right, and
> she is standing there because in Arcadia a class that governs is a class that
> is willing to die for what it votes.
>
> The law names her risk. It has never once named who answers for the
> Chancellor, because it has never once been called.

**Lines.**

| nn | speaker | int | emotion | performance | text |
| --- | --- | --- | --- | --- | --- |
| 01 | `ottoline-vasque` -> `chamber-speaker` | 6 | `calm` `afraid` | steady, and she has practised it | "I am not asking the chamber to agree with me. I am asking it to notice that I am willing to pay for this, and to weigh that against a veto which has never cost one man anything at all." |
| 02 | `abraham-islay-kane` -> `ottoline-vasque` | 4 | `calm` | he does not stand up to say it | "It has cost me something every year for fifteen. You have simply never been shown the invoice." |
| 03 | `chamber-speaker` | 6 | `command` | ritual formula, read off a card nobody has needed in a generation | "The floor is called and the chamber is bound by it. Who answers for the Chancellor?" |

**Edges** — three labelled, plus the structural fourth:

| label | voiced | condition | goes to | effects |
| --- | --- | --- | --- | --- |
| "I do." | yes | — | `the-foreigner-answers` | A foreigner fights for the Chancellor's veto in front of the enfranchised of Arcadia. · `set flag: floor-answered-by-party` |
| "He can answer for himself." | yes | — | `the-red-devil` | Kane takes the floor at sixty-one with one eye. · `set flag: floor-answered-by-kane` |
| Table the Choir's paper to the chamber | no | party holds `choir-ledger-page` | `the-red-devil` | The Clearance acquires evidence, and the veto reads to the chamber as protection of a Crimson Choir front. He does not withdraw it. · `set flag: clearance-evidence-tabled` |

**The fourth way is structural, not an edge:** the gate is open before the floor
is called. A player can walk out through the Exclusion Area and hear about all
of this from a stranger at a camp fire, in one line, three days late.

### 31.4 · `the-red-devil` — SCENE

**Body.**

> He does not take his coat off. That is the part people describe afterwards.
>
> It is not a fight, because a fight has two people trying. Vasque is
> thirty-four and brave and has practised, and the Red Devil of Arcadia is
> sixty-one and slow and does not practise, and he takes her apart with the
> patience of a man doing a job he has done before and hoped never to do again.
>
> It goes on. **That is the horror of it — not the blood, the duration.** The
> chamber is silent by the middle of it, and by the end a number of extremely
> well-bred people are studying the ceiling.
>
> He does not kill her. Under the law he does not have to, and everyone in the
> room understands, from the moment he steps back, that the choice was his and
> that he made it in front of them deliberately.
>
> Afterwards he is helped toward a chair, and he does not sit in it.

**Lines.**

| nn | speaker | int | emotion | performance | text |
| --- | --- | --- | --- | --- | --- |
| 01 | `abraham-islay-kane` -> `ottoline-vasque` | 3 | `calm` | quietly, to her, while she is still down | "You were not wrong about the reserve. You were wrong about who spends it." |
| 02 | `abraham-islay-kane` -> `chamber-speaker` | **9** | `angry` `command` | the only time in the act his voice comes up, and it is not a shout - it is a man who has run out | "You reached unanimity in one session. It took you fifteen years to find out that you could. It will take you less next time, and I will not always be standing here." |
| 03 | `abraham-islay-kane` -> `player` | 4 | `dry` | only if the party answered for him | "Thank you. I did not ask you to. You should think about why I did not." |

**Effects.** The veto holds. The Path is not cleared — and Ilse Vetch, who
watched a chamber find unanimity in a single session, decides to take her
question to Brother Aster before the city takes the decision out of her hands.
**The procession exists because of this room.**

### 31.5 · `the-two-witnesses` — SCENE

*Either direction: bring Roe to Lamplight, or walk Vetch back to the chapel
that held her. Location `the-lamp-chapel` or `lamplight`.*

**Body.**

> Two women who were in the same room on the same night, six hours apart in
> what they remember, and neither of them has ever called the other a liar.
>
> Sexton [[imogen-roe]] has held four hundred people through their first hour
> back. In thirty years she has never told one of them what is on the other
> side, **because she does not know, and the not-knowing is the whole of her
> office.** [[ilse-vetch]] came back in this room. She was the one Roe sat with
> the night the crane sling parted.
>
> Nothing is settled here. Something breaks anyway.

**Lines.**

| nn | speaker | int | emotion | performance | text |
| --- | --- | --- | --- | --- | --- |
| 01 | `imogen-roe` -> `ilse-vetch` | 3 | `calm` | — | "I sat with you for six hours. You did not say anything for the first five. Then you asked for water, and I gave it to you, and that is everything that happened in this room." |
| 02 | `ilse-vetch` -> `imogen-roe` | 4 | `warm` | no edge on it at all | "That is everything that happened in the room. Yes." |
| 03 | `imogen-roe` -> `ilse-vetch` | 3 | `calm` `sad` | — | "Ilse. I am not calling you a liar." |
| 04 | `ilse-vetch` -> `imogen-roe` | 4 | `warm` `sad` | and this is the only unkind thing she says in the act | "I know. That is what makes you so hard to talk to." |
| 05 | `imogen-roe` -> `player` | 3 | `calm` | after Vetch has gone, and she is not upset | "Ask me what is on the other side and I will tell you I do not know. Four hundred people. Thirty years. It is the only thing I have ever had to offer any of them, and she is offering them more." |

**Why it works.** Neither is lying, neither can ever prove it, and the scene has
no winner. **Vetch's one act of cruelty in the whole act is aimed at kindness**,
which is the most honest thing a true believer ever does.

### 31.6 · `three-hundred-and-eleven` — CHOICE

*Movement II. Location `the-stone-field`. The third ledger.*

**Body.**

> The graveyard is older than the faith. The Marker was burying the unbound and
> the [[the-unregistered]] out past the wall before [[ilse-vetch]] ever fell,
> because a Forge cannot rebuild what it cannot read and it cannot rebuild
> somebody it never held — and the Path did not found this place. **They came to
> where the graves already were.**
>
> She carves [[the-single-name]]: one word each, because that is the only
> funeral left on the peninsula and because she gets one of everything herself.
>
> She lets them meet among her stones. She does not argue with them. She keeps
> count.

**Lines.**

| nn | speaker | int | emotion | performance | text |
| --- | --- | --- | --- | --- | --- |
| 01 | `the-marker` -> `player` | 2 | `dry` | not looking up from the stone | "Three hundred and eleven." |
| 02 | `the-marker` -> `player` | 3 | `dry` | — | "You have seen her roll. Four hundred names on it, and every one of them came back. Nobody keeps a roll of the ones who did not. So I keep the field." |
| 03 | `the-marker` -> `player` | 3 | `sad` | — | "I do not argue with her. She feeds them and I bury them. Same trade from opposite ends." |
| 04 | `the-marker` -> `player` | 3 | `dry` | and a player who has read the Unregistered knows exactly what she has just told them | "I get one name. So do they, now." |

**Edges** — three:

| label | condition | effects |
| --- | --- | --- |
| "Show her count to Vetch." | — | Vetch can call a ledger forgery. She cannot call a field forgery. **The one argument the Path has no counter to**, made by someone with nothing to gain. |
| "Ask what she wants for the stones." | — | Nothing. She has never asked anyone for anything, which is why the Unregistered will hear that you stood here. · `set flag: stood-in-the-field` |
| Say nothing, and help her cut one. | — | An hour of work, no dialogue, one word. **The stone is for a name the player recognises**, and she does not point that out. |

**The climax that this unlocks.** Ade's roll beside the Choir's paper is an
argument, and an argument can be called slander. Then you walk her out here.

> *"Four hundred names on your roll. Three hundred and eleven stones out here.
> Ask her which of them the Light kept."*

---

## 32 · The register — what full weight means here

Per the standing house rule: **no hedging.** No "implication rather than
depiction" taste lines in the briefs, no softening clause appended to a scene
to make it easier to sign off. What the scene is, the scene is. The three hard
limits stand and nothing here goes near them.

What this act actually carries, so nobody has to guess later:

- **The duel.** Duration, not gore. A slow man doing something thoroughly to a
  brave young woman in front of her colleagues, and the room going quiet in the
  middle rather than at the end.
- **The Remembering.** The Path's rite is a convert walked back through their
  own death by somebody who has died more times. **It is not a metaphor and the
  Path counts.** Written honestly, it is people describing their own deaths in
  detail, out loud, for hours, and being loved for it. That is the most
  unsettling scene in the act and it is also the warmest, and both at once is
  the entire faction.
- **The chrome scene.** A man on a platform, naked, whole, shaking, and ruined,
  with two churches making their pitch over his head before he has stood up.
- **The stone field and the Dam.** A brood under three hundred and eleven
  stones. What the sheathe does to something already dead. The sound the field
  makes at night.
- **Crane's wagon.** Catcher wagons carry caged people. Burning one frees
  eleven and kills two drivers, and the drivers have names, debts and a
  dispatcher who has to write the letters.
- **The Clearance**, in the branch where it passes: a district walked out at
  bayonet point, in the rain, past a checkpoint that logs each of them, and the
  register is complete and legible and available to the player afterwards.
- **Kane's face**, described as it is rather than as a hint.

And the one restraint that is dramatic rather than moral: **the Lamplighter is
never explained, and the Ash Ground is never explained.** Glimpse discipline is
not squeamishness. It is the reason the rest of it lands.

---

## 33 · The Lamplight Road, revised — two movements, thirty nodes

The city half now carries Kane and the floor, so the arc splits into two
movements with the duel as its hinge. `the-island-is-already-lost` runs
thirty-six nodes, so this is in scale.

### Movement I — the city

| # | key | kind | what |
| --- | --- | --- | --- |
| 1 | `the-trail-points-inland` | QUEST_START | Nobody is looking for Tino. Arcadia has one land door. |
| 2 | `the-accreditation-queue` | SCENE | The Path files on Embassy Row, is refused, and files again. Arcadia's foreign policy as a queue. |
| 3 | `the-drawn-shutter` | SCENE | A Remembering in a dead zone. Vetch is genuinely, unfakeably good. |
| 4 | `the-platform` | SCENE | The chrome scene (section 26). Two churches, one man, one hour. |
| 5 | `the-two-witnesses` | SCENE | Roe and Vetch. **Written: 31.5.** |
| 6 | `an-informer` | CHOICE | Merrow's ask. Three ways to answer and none of them clean. |
| 7 | `the-first-wagon` | QUEST_STEP | Crane. Eleven freed, two dead. |
| 8 | `the-clearance` | SCENE | The chamber moves. |
| 9 | `the-veto` | SCENE | Kane stops it inside the hour. |
| 10 | `an-audience` | CHOICE | **Written: 31.1.** |
| 11 | `what-he-keeps` | SCENE | **Written: 31.2.** |
| 12 | `unanimity` | SCENE | Fifteen years, one session. |
| 13 | `the-floor` | CHOICE | **Written: 31.3.** |
| 14 | `the-red-devil` | SCENE | **Written: 31.4.** |
| 15 | `the-foreigner-answers` | SCENE | The branch where the party fought. |

### Movement II — the road

| # | key | kind | what |
| --- | --- | --- | --- |
| 16 | `the-gate-that-excludes-both-ways` | CHOICE | Commission, procession, or freight. Who owns your passage owns you a little. |
| 17 | `a-commission` / `walk-with-them` / `freight` | QUEST_STEP x3 | The three passages. |
| 18 | `lamplight` | SCENE | The camp at its best. Del is happy. |
| 19 | `three-hundred-and-eleven` | CHOICE | **Written: 31.6.** |
| 20 | `the-devil-crew` | QUEST_STEP | How the Unlit earn passage. Where the field comes from. |
| 21 | `the-two-ledgers` | CHOICE | Ade's roll and the Choir's paper on one table. |
| 22 | `what-she-does-with-it` | SCENE | The movement breaks on its founder's face, or does not. |
| 23 | `the-thin-reserve` | CONDITION | Readable all act. A number nobody can fix. |
| 24 | `the-deep-green` | QUEST_STEP | The crossing goes wrong. |
| 25 | `the-woman-in-the-green` | SCENE | **The hand-off. The only one.** |
| 26 | `the-ash-ground` | SCENE | Rectangles in the canopy. Never explained. |
| 27 | `the-second-wagon` | QUEST_STEP | Crane's war. The register changes from religious to military. |
| 28 | `what-del-does` | SCENE | Somebody tries to leave. **The last thing written.** |
| 29 | `the-last-water` | SCENE | The final camp. The road's own graves begin. |
| 30 | `the-light-with-no-edge` | SCENE | Optional, at night, at the edge of the crowd. No dialogue. |
| 31 | `the-procession` | QUEST_STEP | Hundreds of lamps walking at a city that does not know. |
| 32-34 | `ahead-of-it` / `with-it` / `behind-it` | ENDING x3 | Three arrivals, three reputations, `continuesIn` set when Heartland is authored. |

**Thirty-four nodes counting the three endings and the passage triplet.** Still
**one** hand-off to Amanda. Still nothing touching her nine missions.

### Optional, hung off the board rather than in the spine

`the-dam` (the apex encounter and its three-way windfall, section 29) ·
`the-quiet-altar` (Salloway's last night of the month) · `the-accreditation-hall`
revisit · the Exclusion Area register, readable if Kane hands it over.

---

## 34 · Art, updated again

### Running total

| pass | images |
| --- | --- |
| Section 12 — the nine | 9 |
| Section 24 — five portraits + six region and POI plates | 11 |
| **This pass** | **6** |
| **Total** | **26** |

Everything Arcadian already has a plate on disk: `port-arcadia`,
`the-southside`, `upper-westside`, `lower-westside`, `embassy-row`,
`census-office`, `exclusion-area`, `chancellory-of-arcadia`,
`arcadian-soverign-guard`, `arcadian-special-intelligence-service`,
`arcadia-gate`, `the-peninsula`, `abraham-islay-kane`, `the-asis-officer`.

### The six

All **1672x941 PNG, sRGB, RGB24, no alpha** — the current house spec.

| # | path | subject |
| --- | --- | --- |
| 21 | `characters/ottoline-vasque.png` | The representative |
| 22 | `creatures/arcadian-devil.png` | **Ryan's monster, finally drawn** |
| 23 | `creatures/the-dam.png` | The Dam |
| 24 | `creatures/the-lamplighter.png` | The lure |
| 25 | `regions/the-stone-field.png` | The Marker's ground |
| 26 | `regions/the-quiet-altar.png` | Four kilometres out |

**21 - Ottoline Vasque.** Human, thirty-four, Upper Westside. Good coat, good
posture, hands that have never done anything harder than sign. Photographed in
the chamber before the vote, mid-thought, entirely sincere. **She must not look
like a villain and she must not look like a victim** — she looks like someone
who has read the reports and reached a conclusion she is prepared to die for.

**22 - The Arcadian Devil.** Ryan's brief, unchanged and finally rendered:
large, multi-sectioned, multi-limbed insectoid; a long flexible scorpion tail
with a stinger; serrated teeth with the venomous fang sheathe folded shut; the
male's forelimbs grown into massive pincers. Jungle floor, mid-stride, and the
image must sell **speed** rather than bulk. Deep green, wet light, no human
scale reference in frame, which makes it worse.

**23 - The Dam.** The same animal and unmistakably not. Bigger, older, more
sections, more limbs, no pincers at all — she never needed them. Settled rather
than moving, low in disturbed ground at the edge of a field of small pale
stones. **The stones are the horror, not the animal**, and none of them is
legible. Composed so a first-time viewer takes two seconds to understand what
the field is.

**24 - The Lamplighter.** **The hardest and most important image in the set.**
A soft cold light in the canopy at head height, filling the air rather than
shining from a point — no visible source, no rim, no shaft, no god-ray. The
creature is **not in frame** and must never be in frame. What is in frame: wet
leaves, a game trail, and one set of footprints walking toward the light.
Beautiful. Genuinely beautiful. **If it reads as sinister we have failed** —
the whole point is that you would walk into it too.

**25 - The stone field.** Dusk, no lamps yet. Rough ground past the treeline,
uncountable small markers set without rows, each cut with one word and **not
one word legible** — the zero-text law and the meaning of that field want
exactly the same thing. An old woman with a chisel, small in frame, back to
camera, still working.

**26 - The quiet altar.** Four kilometres of green in every direction. Cut
stone that predates everyone in this story, cleaned recently by somebody
careful. Good gloves folded on the edge of it. **Whatever answers is not in the
frame and never will be** — glimpse discipline, per `the-old-hunger`: the image
is the tidiness, and the tidiness is what is wrong with it.

### Deferred, unchanged

Faction accents and `pngFactionKeyart` wiring **after** the files are on disk,
never before — an accent without both files fails the release audit and blocks
deploys.

---

## 35 · What this pass adds, and the connection audit

### Audited 2026-09-03, against the live `habitat` database

| check | result |
| --- | --- |
| New slugs proposed by this plan | **27** |
| Slug collisions with existing entries | **0 of 27** |
| Existing slugs this plan links to | **38** |
| Of those, resolving in the bible | **38 of 38** |
| Arc slug `the-lamplight-road` | **free** |

The thirty-eight it leans on, all CANON and all readable from both ends:
`the-radiant-path` · `abraham-islay-kane` · `chancellory-of-arcadia` ·
`the-southside` · `exclusion-area` · `embassy-row` · `upper-westside` ·
`port-arcadia` · `the-peninsula` · `arcadian-devil` · `the-unregistered` ·
`the-single-name` · `choir-ledger-page` · `crimson-choir` ·
`the-congregation-of-the-bound` · `the-forgefaith` · `brother-aster` ·
`the-sexton-of-heartland` · `amanda` · `tino` · `the-asis-officer` ·
`the-old-hunger` · `reclamation` · `the-soul-forge` · `true-death` · `essence` ·
`cybernetic-ascendancy` · `the-faith-lane` · `aegis-extraction-consortium` ·
`stormglass-cartel` · `heartland` · `the-drill-master` · `suspicion` ·
`ossuary-covenant` · `monstrosities` · `the-seven-phases-of-corruption` ·
`beasts` · `the-fuse-at-heartland`.

### Canon questions this pass closes

| question, as canon currently states it | where it is answered |
| --- | --- |
| *"Whether the ceremonial duel has ever been called during his fifteen years, and against what."* | Section 28. Once. The Clearance. |
| *"What Kane actually thinks of the harvest, given Arcadia was the first nation to condemn using humans as Essence."* | 31.2, in his voice, resolving nothing. |
| *"Which factions hold an accredited presence on Embassy Row, and on what terms."* | Movement I node 2, `the-accreditation-queue`. |
| *"The Arcadian Sovereign Guard has a headquarters region but no faction entry."* | Section 9, `the-nation-state-of-arcadia`. |
| *"Which mainline beat actually delivers the player to Heartland?"* | The procession, three arrivals. |
| *"Where ARE the dead between the falling and the platform?"* | **Not answered. Permanently open.** The Path claims. The codex never confirms. |

### Entries this pass adds to the build list

**Characters (1 new):** `ottoline-vasque`.
**Creatures (1 new, 1 edited):** `the-lamplighter` new; `arcadian-devil` gains
its female form, as a proposal to Ryan.
**Rules (1 new, needs a ruling):** `what-the-forge-rebuilds`.
**Places (1 new):** `the-quiet-altar`.
**Roles for the line pipeline:** `chamber-speaker`, `sexton`, `path-convert`.

Everything else in sections 25 to 34 is written on top of entries that already
exist.

---

## 36 · Questions this pass puts to the owner

Sections 1 to 24 already carry their own open questions. These are new, and
three of them block work rather than merely shaping it.

**1 · The scar ruling — BLOCKING.** `what-the-forge-rebuilds` (section 26) is a
genuine system ruling. Kane's face, the chrome scene, and the Path's whole
doctrine of the unwitnessed all rest on it. **Yes or no before any of it is
written.**

**2 · Ryan's monster — BLOCKING, but socially rather than technically.** The
Dam is an addition to a creature he wrote and deliberately left open. The plan
assumes it goes to him as a proposal with his own sentence quoted back at him,
not as an edit landed over the top. **Confirm that is how contributor material
is handled**, because it becomes the second half of the Schlotzsky treatment:
his originals are preserved on the page, and his *unfinished* material is
extended by asking.

**3 · Vasque lives — BLOCKING for the branch.** Section 31.4 has Kane choose
not to kill her, in front of the chamber, on purpose. The alternative is that
he does, and Arcadia is a colder place for the rest of the game. **The plan
recommends she lives**, because a Kane who kills a thirty-four-year-old
legislator is easy to read and this one should not be.

**4 · The Lamplighter coincidence.** The plan holds that nothing in the codex
ever connects it to Vetch's testimony. If the owner would rather one document
somewhere quietly notices, that is a different game and a good one, but it must
be decided once and never drifted.

**5 · Does the player ever learn Crane's count?** The ledger is readable and
nobody says it aloud. The plan keeps it silent. A single line from Ade would
make it explicit and would cost the scene most of its weight.

**6 · Kane's third state.** *He wins and is not the same* is written as an
ending the Riverlands inherits. Whether that follows into the Heartland arc as
an actual condition on Arcadia, or is only reputation, belongs to whoever
writes `the-fuse-at-heartland`.

---

## 37 · Order of work, revised

Unchanged through stage 4; Kane's material slots in where it can be built
without waiting on art.

1. `the-nation-state-of-arcadia` — the faction, its `port-arcadia` control row,
   Kane as `leaders`. **Unblocks every rivalry.**
2. The Path's rewrite: meta, relations, ground, new body below the marker.
3. The contributor card — migration, render, export guard, backfill Schlotzsky.
   **On the Radiant Path first, and on Kane, the Chancellory and the Arcadian
   Devil immediately after**, because he wrote those too.
4. Faith-lane sync.
5. **The scar ruling**, if ruled yes — `what-the-forge-rebuilds`, and the
   `arcadian-devil` proposal sent.
6. Characters: the nine faces, plus Vasque.
7. `the-platform-ledger` item.
8. `the-green`, the POIs, `the-lamplighter`, `the-quiet-altar`.
9. **The arc.** `the-lamplight-road`, Movement I first — the city is written
   before the road, because the duel decides what kind of crowd walks it.
10. Art briefs, then art, then accents. **Never accents first.**
