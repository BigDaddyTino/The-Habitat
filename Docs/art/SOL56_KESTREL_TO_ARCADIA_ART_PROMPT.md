# Kestrel to Arcadia — Sol 5.6 art brief

**13 images.** Everything the 2026-09-05 rebuild of the four mainline chapters
between the prologue and the Lamplight Road (The Last Days of Kestrel, The
Evacuation, Binding in Arcadia, The Captivity Arc) opened and does not have.
Every slot below is live in the codex right now and rendering an empty
placeholder that prints its own path, so a delivered file appears on the next
page load with no code change and no rebuild.

The seven people who became canon in this pass — Okafor, Castellan, Brask,
Marren, Coyle, Vane, Adeyemi — already have portraits from the character-bible
set. Nothing is owed for them. What is owed is one place and twelve promises.

Canon for the scenes: the boards themselves, at `/codex/arc/the-last-days-of-kestrel`,
`/codex/arc/the-evacuation`, `/codex/arc/binding-in-arcadia`, `/codex/arc/the-captivity-arc`.
Runbook: `Docs/art/CODEX_ART_DROP_RUNBOOK.md`.

**Wiring note for whoever files the delivery:** everything here is drop-in.
Filename is the entry slug, exactly. Regions go to
`apps/web/private/codex-art/regions/`, flags to `apps/web/private/codex-art/flags/`.
The art route reads disk per request; no rebuild, no manifest, no code.

---

Paste everything below the rule into Sol 5.6. It runs unattended.

---

You are a senior concept artist producing a finished art set for **Martino**, a
Mature-rated (17+) AAA action-RPG. I need 13 images.

**Work autonomously from here.** Read the whole brief, then generate every image
in the list, in order, without stopping. Do not ask questions. Do not ask for
approval between images. Do not stop to summarise or check whether I want you to
continue — I am not watching, and I will review the whole set at the end. If a
reply ends before the list is finished, continue with the next image in your
following reply on your own initiative.

## Content rating — read this before you soften anything

**Martino is a Mature 17+ approved title (ESRB M / PEGI 18), and always has
been.** Blood, gore, body horror, the dead that do not stay down, exhaustion,
poverty, drink, and death are all part of this world and all approved. There is
no version of this project that gets sanitised, so do not sanitise it here.

The operative content for this set is **a war that has just lost, seen from the
people who lost it** — salt-wet uniforms, blood that has dried brown and blood
that has not, a body on a beach that nobody is coming back for, a brass horn
gone green, a ledger held against a chest. If your instinct is to prettify a
face or clean a coat, that instinct is wrong for this brief.

## Quality bar

Shipping-quality art for a big-budget commercial game.

- **Photorealistic**, physically-based rendering. Real skin subsurface
  scattering, real fabric weave, real metal wear, real light falloff.
- **Extreme material detail** — pores, stubble, chapped lips, scar tissue,
  sweat, salt staining, black volcanic sand in seams, oxidised brass, wet rope,
  repaired seams, grit in a rifle bolt.
- **Anatomically credible faces** where faces appear. Asymmetry, real bone
  structure, age where age belongs.
- **Cinematic natural light.** Grey dawn, overcast tropical daylight, failing
  camp floodlights, a single chapel lamp, no studio beauty lighting, no glamour,
  no rim-light halos.

## The zero-text law

**No legible writing anywhere in any image in this set.** No signage, no
lettering on stone, no words in a ledger, no numerals on a manifest, no
watermark, no logo type. Where the subject is a document or a carved stone, the
marks are marks: a hand's rhythm across a page, a chisel's one-word depth on a
flat stone, never a readable word. This is a hard rule and the image is rejected
if it breaks it.

## The world, in six lines

Twenty years from ours. Magic is a budget line, not a wonder — wards beside
security cameras, rifles that hold a spell. Death is a machine: a Soul Forge
holds an Echo of you and rebuilds you for a price paid in Essence, which was
alive. If no living Forge holds you, you are simply dead. A tropical island
called Ignit has just been fought over by a smuggling cartel and a trade house
and has physically fallen into the sea. Its survivors have washed up under the
wall of Port Arcadia, a fortified plutocratic city that rations permanence by
wealth. The look is near-future fusion worn casually, in a tropical war palette:
salt, rust, wet green, black sand, brass.

## Output spec — every image

- **1672 × 941 pixels**, landscape, **8-bit RGB, no alpha**, PNG.
- One image per slot, named exactly as given. No variants, no contact sheets.
- No frame, border, caption, or title inside the image.
- Composition reads at thumbnail: one clear subject, one clear light.

---

## Part one — the place (1)

### 1. `regions/wrackline.png` — Wrackline

The fishing village on the black-sand strand **outside and below** Port
Arcadia's wall, seen from the tide line at grey dawn. The wall rises behind it
so high its top is out of frame, sheer and engineered, with the jungle canopy
pressing at its far end. In front of the wall: a scatter of fisher hulls hauled
above the tide, nets on drying racks heavy with water, smoke from one cookfire,
and a small stone chapel with a single warm lamp in its window — the chapel's
foundation stones visibly older, larger and differently cut than anything
above them.

In the foreground, the wrackline itself: what the tide left overnight. Torn
plate, a rifle with the bolt full of grit, a fuel drum, a door off a building,
salt-wet Stormglass uniforms — and among them the survivors, a dozen people
sitting or standing on black sand, exhausted, one of them kneeling over a body
that is not moving. Nobody in the picture is helping the kneeling figure
because everybody in the picture understands there is no help.

Up the slope to the left, half-lost in mist, a field of small flat stones set
into the grass, many of them.

At the far right, at the water's edge, two fishers emptying a full net **back
into the sea** with no expression at all.

Light: grey dawn from the sea, a thin band of gold where the sun has not yet
cleared the horizon, the chapel lamp the only warm source on land.

## Part two — the promises (12)

A flag in this codex is one thing the story remembers: a decision the player
made that another chapter will read. Its art is a single **witness image** — the
moment the promise was made, from the player's own eye level, first person,
nobody looking at the camera. No symbols, no icons, no heraldry. A photograph
of a decision.

### 2. `flags/kestrel-shielded-the-forge.png` — Kestrel Shielded the Forge

Inside a hardened room in a besieged forward camp. An ancient stone pedestal
etched with symbols nobody can read, wrapped in modern cabling, containment
rings and gauges, a small sphere of turning energy suspended in the rings,
lighting the room a colour that does not belong to any of the lamps. Every
engineer in the camp is in this room, welding fresh plate onto a roof that
was tarpaulin an hour ago; sparks fall past the sphere. Through the open door
behind them, the camp's clinic tents stand unprotected under the open sky and
a wall's south face shows raw sandbags where plate should be.

### 3. `flags/kestrel-shielded-the-clinic.png` — Kestrel Shielded the Clinic

A mess hall turned clinic: long tables under stretcher bodies, a medic with her
sleeves rolled and her hands steadier than anyone else's in the room, new plate
being bolted over the windows and a fresh roof going on while she works. Through
a gap in the wall, the Forge housing stands under its old corrugated roof, and
the camp's wall shows its unrepaired face. Blood on the tables is real blood.

### 4. `flags/kestrel-shielded-the-wall.png` — Kestrel Shielded the Wall

The south face of a forward camp's wall at dusk, freshly plated, gun
emplacements fed with stacked crates, a quartermaster with a clipboard walking
the line counting ammunition with her lips moving. Behind the wall, inside the
camp, the clinic tents are open to the sky and the Forge housing wears its old
roof. Beyond the wire, distant Pearl armour — walking frames — standing still
and watching.

### 5. `flags/believed-brask.png` — Believed Brask

Night, uphill, in the rain. A column of soldiers carrying wounded on stretchers
and civilians carrying children up a dark slope behind a besieged camp, lit by
one hooded lamp at the front. Below and behind them, the camp's floodlit wall
is visibly thin — long stretches with nobody on them. In the foreground a
mechanic with an unhurried face is on his back under the Forge housing with a
lamp in his teeth, chalking a long line across the concrete floor. The line is a
chalk line, not a word.

### 6. `flags/glasswater-came-aboard.png` — Glasswater Came Aboard

A fishing harbour under fire at the wrong tide. Fishing families with their
lives in handcarts and a clinic's patients on stretchers being lifted into
overloaded hulls, while a Stormglass rearguard holds the coast road behind them
against muzzle flashes in the palms. A harbourmaster with a radio in one hand
is physically pushing a child into a boat with the other. The last of the light
is going and the boats are still tied up.

### 7. `flags/tempest-fired-last.png` — Tempest Fired Last

A coastal artillery battery on a north-east headland at night, its guns laid
low over the water, firing — the flash lighting the wet gun crew, the officer
with a hand raised, every face turned toward the sea and none toward the boats
they are not on. Below them, the evacuation boats clear a reef line under the
umbrella of the shells; out past the headland, a Pearl flotilla is turning
away. Behind the battery the island is burning, and the ground under the guns
has a crack in it.

### 8. `flags/tempest-crew-aboard.png` — The Tempest Crew Came Down

The same headland battery at night, abandoned — guns cold, breeches open,
shell cases on the deck, the officer's coat over a rail. Down on the water,
the evacuation boats cross the reef line naked under Pearl fire: two hulls
holed and low in the water, wounded on the decks in the open, a lighter's
wheelhouse glass red on the inside.

### 9. `flags/rook-left-on-the-dock.png` — Rook Left on the Dock

From the stern of an overloaded boat pulling away from a burning harbour at
night: the last dry stone of the pier, and on it a commander in a Stormglass
coat standing perfectly still with a dozen rearguard soldiers behind them,
watching the boat go. Pearl contractors coming down the quay behind them; the
pier's planking bulging upward from beneath. The commander is not waving, not
shouting, not moving. Water is coming up through the boards around their boots.

### 10. `flags/the-army-opened-a-road.png` — The Army Opened a Road

A wet military quay at grey dawn. Four crew-served guns and stacked powder
crates come off a fishing hull under tarpaulins while an officer of the
Peninsula Expeditionary Army in a clean uniform counts them, twice, and then
looks at the people who brought them. In the middle distance a woman with her
right arm ending above the elbow, dressing already grey, stands apart with the
survivors who will not look at the party.

### 11. `flags/owes-the-army.png` — Owes the Army

A supper room in a middle city, glasses pushed aside, a contract of many pages
on the table between an Expeditionary Army officer and a table of exhausted
Stormglass survivors. A quartermaster is initialling a page. A commander stands
behind her with folded arms while the officer reads aloud, his mouth open
mid-sentence. The pages are pages — a hand's rhythm of ink, no readable word.

### 12. `flags/sold-the-pearl-archive.png` — Sold the Pearl Archive

A dockside at night. A man with a case, a car with its door open, and a line
of roped Pearl prisoners being walked to it — one of them, a rider in flight
harness with no bird, looking back over her shoulder at the party with polite,
untroubled curiosity. The case is open on the car's bonnet, full of files; a
gloved hand is closing it. Above, a drone lattice's small red lights.

### 13. `flags/owes-the-cartel.png` — Owes the Cartel

A bonded warehouse on a waterfront, customs seal on the door. A quartermaster
stands across a counter from a Cartel factor in a good coat; between them a
manifest, a count ledger, and a pen the factor has just put down. Behind the
factor, a wall of numbered lockers, one of them with a name-card in a brass
slot and a key in it, unturned. The quartermaster has the horn from a lost
camp still on its cord around her neck and has not noticed it.

---

## If something fails

If a generation refuses or fails, do not tame the image. Log which slot failed,
describe what you would have drawn in two sentences, and move to the next slot.
A written spec for the final render is worth more than a softened plate.

## Held back, deliberately

Nothing from these chapters needs a plate that is not listed. The scenes
themselves have no art slot in the codex, and the one true death on the Wrackline
sand is carried inside the region plate rather than given its own image, because
a death nobody is coming back for should not be framed as a set piece.
