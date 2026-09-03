# The Lamplight Road — Sol 5.6 art brief

**28 images.** Everything the Peninsula act needs and does not have. Every slot
below is live in the codex right now and rendering an empty placeholder that
prints its own path, so a delivered file appears on the next page load with no
code change and no rebuild.

Canon: `Docs/codex/RADIANT_PATH_INTEGRATION.md`. Runbook:
`Docs/art/CODEX_ART_DROP_RUNBOOK.md`.

**Two hard wiring notes for whoever files the delivery:**

1. **Faction key art and logos need a code change and art first.** Adding a
   slug to `factionAccents` / `pngFactionKeyart` in `lib/faction-branding.ts`
   **before** both files are on disk fails the release audit and blocks
   deploys. Art first, accent second, never the reverse.
2. Everything else is drop-in. Filename is the entry slug, exactly.

---

Paste everything below the rule into Sol 5.6. It runs unattended.

---

You are a senior concept artist producing a finished art set for **Martino**, a
Mature-rated (17+) AAA action-RPG. I need 28 images.

**Work autonomously from here.** Read the whole brief, then generate every image
in the list, in order, without stopping. Do not ask questions. Do not ask for
approval between images. Do not stop to summarise or check whether I want you to
continue — I am not watching, and I will review the whole set at the end. If a
reply ends before the list is finished, continue with the next image in your
following reply on your own initiative.

## Content rating — read this before you soften anything

**Martino is a Mature 17+ approved title (ESRB M / PEGI 18), and always has
been.** Blood, gore, body horror, exhaustion, poverty, tobacco, alcohol and
death are all part of this world and all approved. There is no version of this
project that gets sanitised, so do not sanitise it here.

The operative content for this set is **hard-lived adult realism** — scarring,
burns, old injuries, hunger, drink, wet clothes nobody has been able to dry.
These are people in a city that prices coming back from the dead, and the ones
who cannot afford it are the ones in most of these pictures. If your instinct is
to prettify a face or clean up a coat, that instinct is wrong for this brief.

**One exception, and it is deliberate.** The faith at the centre of this act must
be drawn **beautiful**. Bright is not chaste and holy is not plain. A gorgeous
movement is a frightening one; an ugly one is a strawman. Where the brief says
warm, mean it.

## Quality bar

Shipping-quality art for a big-budget commercial game.

- **Photorealistic**, physically-based rendering. Real skin subsurface
  scattering, real fabric weave, real metal wear, real light falloff.
- **Extreme material detail** — pores, stubble, chapped lips, scar tissue,
  sweat, fabric pilling, salt staining, stone dust, scuffed leather, oxidised
  buckles, repaired seams.
- **Anatomically credible faces.** Asymmetry, real bone structure, age where age
  belongs.
- **Cinematic natural light.** Overcast daylight, lamp light, failing industrial
  lamps, wet dusk. No studio beauty lighting, no glamour, no rim-light halos.

## The zero-text law

**No legible writing anywhere in any image in this set.** No signage, no
lettering on stone, no words in a ledger, no numerals, no watermark, no logo
type. Where the subject is a document or a carved stone, the marks are marks:
edge-on, blurred, out of focus, or abstracted into strokes. This is not
negotiable and two images in this set depend on it entirely.

## The world, in six lines

A peninsula two thousand years after its magic was hunted out of it. Magic is
extracted from living things and every dose kills its source. A machine called
a Soul Forge can rebuild a dead person out of raw Essence, so death is a
purchase, and a body comes back **without** its scars, its amputations or its
cybernetics — which means in a city where permanence is bought, a scarred face
is a class marker. Port Arcadia is a walled plutocratic city-state that sells
soldiers. Beyond its wall is regrown jungle that kills people. In its poorest
district a woman who died once has started a church.

## Output spec — every image

**1672 x 941 pixels, PNG, sRGB, RGB24, no alpha**, except the two logos, which
are **1024 x 1024 PNG with alpha**.

Append this render tag to every prompt you compose:

> *Realistic AAA game concept art, Martino, photorealistic, physically-based
> materials, weathered surfaces, natural cinematic light, mature 17+ tone,
> extreme detail, no text, no lettering, no watermark.*

---

# Part one — the people (8 portraits)

Save as `characters/<slug>.png`.

**1 · `ilse-vetch.png` — Ilse Vetch.** She/her, human, thirties, the founder of
the movement. A crane rigger's build under plain clothes she has stopped
noticing. **One scar: a crane-sling mark across the collarbone**, and nothing
else anywhere on her, because the machine rebuilt everything under it — that
single mark on otherwise unmarked skin is the most important detail in the
portrait. Lit from below by a lamp somebody else is holding, in a crowded warm
room. She is mid-sentence and not performing. **She must look like somebody you
would believe on first meeting.** Not radiant, not costumed, not saintly.

**2 · `corrin-ade.png` — Corrin Ade.** He/him, human, fifties. A parish sexton's
habit with the church's marks *unpicked rather than cut off*, so the outline of
them is still visible in the cloth. Reading glasses pushed up on his head. Ink
worked permanently into two fingers. Photographed mid-thought over a ledger
rather than mid-sermon. Tired, precise, and visibly unhappy about something he
is not going to discuss. **No legible writing on the page in front of him.**

**3 · `wren-salloway.png` — Wren Salloway, the Almoner.** She/her, human,
forties. Immaculate and entirely unshowy: a good coat kept well, good gloves, a
document case held as though it weighs nothing. **Drawn attractive and genuinely
warm** — she is the most reassuring person in any room, and nothing anywhere on
her indicates the blood-magic cabal she actually works for. No occult marks, no
red, no ornament. The horror of this portrait is that there is nothing wrong
with it.

**4 · `imogen-roe.png` — Sexton Imogen Roe.** She/her, human, sixties. A working
sexton's habit, mended more than once, with a chapel's worth of candle smoke in
it. Seated, in a small stone room, beside an empty platform. Reading hands.
**She is not sad and not resigned** — thirty years of sitting with people in the
worst hour of their lives has left her at peace with not knowing, and the
portrait should show a woman who is entirely comfortable in a silence.

**5 · `del-anwar.png` — Del Anwar.** He/him, human, late twenties. A refugee off
a lost island who has just started eating regularly again — **thin in a way that
is recent**, not chronic. Somebody else's coat, obviously too big, worn with
visible pleasure. Firelight, a camp, a bowl. **He is the only genuinely happy
face in this entire set** and that has to read instantly.

**6 · `ivo-crane.png` — Radiant Ivo Crane.** He/him, human, forties by the
calendar. Broad and short, a foundry rigger's build — **and completely
unmarked**, because he has been rebuilt eleven times and the machine took every
scar the trade ever gave him. Rigger's hands that are somehow brand new. Nothing
about him is old except the way he stands. Lit hard, outdoors, at night, near
something burning. **He must not look stupid.** He is a capable man with pieces
missing that he cannot name.

**7 · `the-marker.png` — the Marker.** She/her, an old woman, and the single
most important portrait in this set. A chisel and a mallet and the forearms that
explain both. Working clothes with stone dust worked permanently into them.
**She is small in frame, back three-quarters to camera, still working**, with a
field of small pale grave markers stretching away behind her at dusk. **Not one
word on any stone is legible** — the zero-text law and the meaning of that field
happen to want exactly the same thing. **She is not tragic.** Do not make her
tragic. She has the steadiest face in the set.

**8 · `ottoline-vasque.png` — Representative Ottoline Vasque.** She/her, human,
thirty-four, gentry. Good coat, good posture, hands that have signed a great deal
and held nothing heavier than a pen. **An unmarked face, and in this world that
means money.** Photographed in a legislative chamber before a vote, mid-thought,
entirely sincere. **She must not look like a villain and must not look like a
victim.** She has read the numbers, reached a conclusion, and is prepared to die
for it, and none of that is theatrical.

---

# Part two — the factions (2 key art + 2 logos)

**9 · `factions/the-radiant-path.png` — the night procession.** Southside after
dark. Lamps carried low at waist height so **every face lights from beneath**;
wet boards and standing water throwing the light back up; a crowd walking with
open hands. Corrugated favela wall behind, harbour cranes far off and cold. The
front of the procession is out of frame — nobody is preaching, they are only
walking. Warm white-gold: the single warm source in a blue-grey district. **It
must look like something you would want to join.** No insignia anywhere.

**10 · `faction-logos/the-radiant-path.png` — the broken ring.** 1024×1024 PNG
with alpha. A ring of warm light with one hairline break at its lowest point,
and a second smaller circle inside it set off-centre — the light, and the hole
the machine makes in it. Non-linguistic, and deliberately unlike any real-world
religious or political device.

**11 · `factions/the-nation-state-of-arcadia.png` — the Chancellory steps.**
Midday, high ground. Enfranchised Arcadians on clean stone; the harbour and its
cranes far below and slightly hazed; a guard detail in undress uniform standing
easy. Bone, brass and cold sun. **Power that has never had to raise its voice.**
No insignia.

**12 · `faction-logos/the-nation-state-of-arcadia.png` — the reef bars.**
1024×1024 PNG with alpha. Austere geometry: parallel bars narrowing, the reef
that makes the sea lanes thin. Blank, abstract, institutional, cold.

---

# Part three — the objects and the rule (2)

**13 · `items/the-platform-ledger.png` — the platform ledger.** A heavy ledger
open on a chapel table beside the glow of a Soul Forge core. Columns, ruled
lines and tally strokes. **No legible writing anywhere** — the marks are marks;
any word is edge-on, blurred, or out of focus. Photographed like a parish
record, lit like an altar. It is the most dangerous object in this act and it
looks like stationery.

**14 · `rules/what-the-forge-rebuilds.png` — the rule plate.** A body resolving
on a Forge platform, caught in the second where it is still partly energy:
skeleton and vessels visible, skin arriving. Containment rings above, the room
dimming as the machine draws. **On the platform edge, in focus, in the
foreground: a spinal cybernetic and a set of clothes that came off a man who is
being rebuilt without them.** The machine keeps the person and loses everything
that was done to him. No people watching in frame.

---

# Part four — the creatures (2)

**15 · `creatures/arcadian-devil.png` — the Arcadian Devil.** *This creature was
designed by a contributor and this is the first time it has been drawn. Render
his brief exactly.* A large, multi-sectioned, multi-limbed insectoid on the
jungle floor. A long flexible scorpion-like tail with a lethal stinger. A mouth
of serrated teeth with a second set of venomous fangs behind a sheathe that
opens like an umbrella — **shown folded shut here.** The male's forelimbs grown
into massive pincers. Mid-stride, deep green, wet light. **Sell speed, not
bulk** — this thing crosses ground at a terrifying rate. No human in frame for
scale, which makes it worse.

**16 · `creatures/the-lamplighter.png` — the lure.** **The hardest and most
important image in the set, and the creature is not in it.**

A soft cold light in the jungle canopy at head height, at night. It **fills a
volume of air** rather than shining from a point: no visible source anywhere
inside it, no rim, no shaft, no god-ray, no glare, no bloom. It does not
flicker. In frame: wet leaves, a game trail, and one set of footprints in the
mud walking toward it.

**The creature must never be visible and never be implied by a silhouette.**

**Make it beautiful.** Genuinely, calmly beautiful. If this image reads as
sinister we have failed — the entire point is that you would walk into it too.

---

# Part five — the places (10)

Save as `regions/<slug>.png`.

**17 · `the-green.png`** — regrown tropical jungle over ground that was stripped
two thousand years ago. Enormous, wet, layered, and subtly *too uniform in age*
— everything here grew back at once. Green-black, standing water, no path.

**18 · `the-lower-gate.png`** — a checkpoint seen from the jungle side. The last
hundred metres of made road before the trees; a queue of people in the rain;
staging yards and quarantine sheds behind a wall; a bored garrison. It excludes
in both directions and the image should make that legible without a sign.

**19 · `lamplight.png`** — a camp in a jungle clearing at dusk, several hundred
people, warm and orderly and poor. Cook fires, shared pots, mended canvas.
**Nobody is preaching and nothing is a shrine.** It has to look like the best
night any of these people have had in a year.

**20 · `the-stone-field.png`** — dusk, no lamps yet. Rough ground past the
treeline; uncountable small markers set without rows, each cut with a single
word; **not one word legible.** An old woman with a chisel, small in frame, back
to camera, still working. Composed so a first-time viewer takes two seconds to
understand what the field is.

**21 · `the-ash-ground.png`** — a clearing where the canopy grows in
**rectangles**. Long straight interruptions in two thousand years of regrowth,
at regular intervals, in a grid. Nothing standing, nothing fallen, no bones, no
marker, no ruin, no explanation. Overcast, flat light, silent. **The geometry is
the whole image** and nothing in frame may account for it.

**22 · `the-burned-wagon.png`** — a heavy armoured transport on its side on a
jungle road, burned to the frame, cages open. Rain has been on it. Nobody has
cleared it and nobody will. Two scorched patches on the ground where the drivers
were, and nothing dramatised about them.

**23 · `the-last-water.png`** — the last reliable water before the ground rises.
Several hundred people camped in the dark, and **hundreds of small lamps being
lit for a night march.** Warm points scattered through black jungle. Behind the
camp, receding into the trees, a line of small pale grave markers along the road
they came in on.

**24 · `the-lamp-chapel.png`** — the poorest Forge hall in the city, and it
should look like a parish church that happens to contain a machine. A single
containment core, one platform, one table, mended benches, guttering light. Warm
and shabby and used.

**25 · `the-quiet-office.png`** — an intelligence service room with **nothing on
the walls.** A table, two chairs, a blind down, and a stack of documents nobody
is reading. Grey, clean, entirely unremarkable, and the most threatening
interior in the set precisely because it is not trying.

**26 · `the-quiet-altar.png`** — cut stone in a jungle clearing, four kilometres
from anywhere, far older than anyone in this story. **Recently and carefully
cleaned.** A pair of good gloves folded on the edge of it. Nothing else in
frame, and **whatever answers here is not in the frame and never will be.** The
horror of this image is the tidiness.

---

## If something fails

If an image will not generate, say which number and why in one line, then
continue with the next. Do not stop the run and do not ask what to do.

---

## Held back, deliberately

**`creatures/the-dam.png`** — the Arcadian Devil's female form: bigger, older,
more heavily sectioned, **no pincers at all**, settled low in disturbed ground
at the edge of a field of small pale stones, composed so the stones are the
horror rather than the animal. **Not commissioned yet.** The Dam is a proposal
appended to a contributor's own creature dossier and it is not drawn until he
approves the addition.

---

## Part five, continued — the two city rooms (2)

**27 · `regions/the-drawn-shutter.png`** — a back room in the poorest district,
crowded, warm, and packed with people sitting on the floor. Mended canvas over
the window, one shutter down, lamps at waist height so **every face lights from
beneath**. Somebody is standing and speaking and nobody is looking at anything
else. No altar, no symbol, no iconography anywhere in the room. It is a meeting
in a rented room and it is the warmest interior in this set.

**28 · `regions/the-accreditation-hall.png`** — a government counter. Polished
stone, a rope line, three windows, one clerk, and a queue of people holding
folders. Cold north light. **Absolutely nothing dramatic is happening**, and the
image's whole job is to make a very polite refusal look like a machine.
