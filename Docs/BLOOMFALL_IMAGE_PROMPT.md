# Bloomfall creature art — ChatGPT generation brief

Paste everything below the rule into ChatGPT (web, with image generation + the
Python/data-analysis tool enabled). It runs unattended: 31 plates generated back
to back with no check-ins, then one zip to download.

Filenames are the Codex binding convention — keep them exact and the images can be
wired straight into the dossiers.

---

You are a senior creature concept artist producing the final reference set for
**Martino**, a Mature-rated (17+) AAA action-RPG. I need 31 images.

**Work autonomously from here.** Read the whole brief, then generate every image in
the list, in order, without stopping. Do not ask me questions. Do not ask for
approval or confirmation between images. Do not stop to summarise, recap, or check
whether I want you to continue — I am not watching, and I will review the whole set
at the end. If a reply ends before the list is finished, immediately continue with
the next image in your following reply on your own initiative. The only reason to
stop early is a hard technical failure, described at the bottom.

## Quality bar

This is shipping-quality art for a big-budget commercial game. Every plate must look
like it came out of a AAA studio's creature department:

- **Photorealistic**, physically-based rendering. Real subsurface scattering in
  flesh, real specularity on wet surfaces, real light falloff.
- **Extreme material detail** — pore-level hide, matted fur, waterlogged tissue,
  mineral crust, oxidised metal, industrial grime, dried and fresh fluid on skin.
- **Anatomically credible.** Correct bone structure, correct joints, believable
  muscle mass and weight distribution for the size of the animal. Weight must read.
- **Mature (17+) tone.** Grim, unsentimental, genuinely unsettling. Visible old
  scarring, healed-over wounds, damaged and regrown tissue, parasites and rot where
  it makes sense. The register is *The Last of Us Part II*, *Resident Evil*
  remakes, *Elden Ring* and *Bloodborne* creature design — horror achieved through
  anatomy, decay and restraint rather than through shock gore.
- **Cinematic natural light.** Overcast daylight, storm light, or the flat orange of
  failing industrial lamps. No studio rim-lighting, no hero glow.

Append this render tag to the end of every image prompt you compose:

> *Realistic AAA game creature concept art, Martino / Bloomfall Reach, photorealistic,
> physically-based materials, wet tissue and industrial grime, natural cinematic
> light, mature 17+ tone, extreme detail, 4:5 portrait, no text, no watermark.*

## The world

Martino is a war fought over harvested magic. **Essence** is extracted magic, and
extraction kills whatever it is taken from. **Bloomfall Reach** is a "Living Ruin":
a former strategic Essence reserve that suffered an industrial catastrophe and is
now a mature, aggressive, mutated ecology held in check by an ancient marsh. Three
grounds:

- **The Shattercore** — the broken reactor, refinery and gridworks at the centre.
  Torn containment, vent plumes, powered corridors that still hum.
- **The Mutation Belt** — farmland, substations and forest remade into migration
  country. Open, overgrown, quietly wrong.
- **The Living Marsh** — ancient wetlands that stopped the contamination reaching
  the ocean. Black water, filtration beds, drowned industry.

**Blackbloom** is the contamination itself. On a living body it reads as dark,
faintly iridescent conductive tissue grown into the animal — never slime, never
glowing goo.

## Art direction

- **Grounded natural-history plate**, not fantasy monster art. A wildlife
  photographer and a field biologist documenting a real animal that something has
  gone badly wrong with.
- **Real animal anatomy always wins.** Every change must look like it grew and like
  it does a job.
- **Palette**: desaturated greens, wet greys, rust, bone, drowned brown. Blackbloom
  tissue is near-black with a faint oil-on-water iridescence.
- **No** neon glow, no VFX lightning bolts, no skulls-and-spikes, no decorative
  armour, no text or watermarks.
- **Format**: portrait **4:5**, single subject, full body in frame, consistent
  three-quarter angle at the animal's own eye level.

## The escalation rule — read this twice

These creatures climb a mutation ladder. A player wounds one, it escapes, and it
comes back stronger. **The previous version of this set failed because the stages
looked nearly identical.** Do not repeat that failure. Each rung must be obvious
from across a room, while the species stays recognisable.

| Rung | Mass | What must change |
|---|---|---|
| **None** | base | The honest animal. Healthy, unarmoured, alert. Blackbloom only as a dark sheen in specific tissue. |
| **Minor** | ~1.2× | Visibly hardened. **One** new material or structure, clearly readable across the body. Tense, defensive posture. First scars. |
| **Functional** | **2×** | Genuinely bigger and heavier — broader chest, thicker limbs. **Two** stacked adaptations plus **one obvious weapon feature**. Forward, aggressive stance. Fresh and healed wounds. |
| **Advanced** | **3.5×** | Enormous. Silhouette changed but the species still readable. Faint prismatic oil-slick sheen across hardened surfaces. **Three** weapon features. Heavy healed-over battle damage, missing pieces, regrown tissue. Frightening. |
| **Aberrant** | landmark | A named mini-boss. Reads as terrain or an event rather than an animal. Pull the camera back and show it against buildings, trees or water so the scale lands. Lineage still traceable in the skull and limb plan. |

Two hard rules that keep it coherent:

1. **Same individual across all five plates of a species.** After you generate the
   `none` plate, write yourself a short **design lock** — three lines naming that
   animal's exact coat markings, scars, horn or jaw shape and colouring — and repeat
   that lock verbatim inside the next four prompts. Keep it in your own working
   notes; you do not need to show it to me.
2. **Same staging.** Same three-quarter angle, same eye level, same lighting, same
   simple environment across a species' five plates, and a consistent scale cue in
   frame (a fence post, a doorway, an oil drum) so the growth is measurable.

## Output handling

For each image, in this order, with no pause between:

1. Generate it.
2. Save it to `/mnt/data/` under the **exact filename** given in the list.
3. Move straight on to the next image.

When all 31 are saved, run Python to build `/mnt/data/bloomfall-creatures.zip`
containing every PNG, and give me the download link plus a list of its contents.

**Only stop early for a hard failure:** if you cannot write generated images to
`/mnt/data/`, say so immediately in one line and stop — do not keep generating and
leave me an empty archive. Content refusals are not expected; every subject here is
non-human wildlife or a clothed, non-graphic human figure. If one specific image is
refused, note the filename in one line, skip it, and carry on with the rest.

---

# THE LIST

## 1. Blackbloom Hart — Mutation Belt / Long Graze grassland

A lean deer whose antlers carry dark conductive membrane instead of velvet, stretched
inside the branch structure like a black iridescent web. Modest charge nodules at the
neck and forequarters. Split hooves.

**Lock:** deer skull, four limbs, the same antler branch map, the same coat pattern.
**Never:** extra antler racks, demonic faces, random spikes.

- `blackbloom-hart-none.png` — **Gradient-Sensing Hart.** Healthy lean adult on open
  grass at dawn. Membranes folded thin inside the antlers. Head up, alert, mid-graze.
  Wet coat, mud to the fetlock, breath visible in cold air.
- `blackbloom-hart-minor.png` — **Charge-Raised.** Membranes engorged and lifted,
  vessels darkened and swollen around the eyes and ears, coat standing along the
  spine, charge nodules pushing visibly through the hide. Tense. Hooves planted in
  wet ground. One healed puncture scar across the shoulder.
- `blackbloom-hart-functional.png` — **Grounded Crown.** Twice the animal. Mineralized
  keratin sheathing the antler tips and lower legs, insulating fibrous bands thickened
  around the neck, broadened split hooves. Head lowered, about to charge. Torn ear,
  scarred flank, old wounds sealed over with black tissue.
- `blackbloom-hart-advanced.png` — **Storm-Tuned Relay.** Massive, heavy-shouldered.
  Broad membranes filling the entire antler structure, paired charge sacs sunk behind
  the shoulders, an unbroken sheath of insulating tissue running neck to foreleg.
  Faint prismatic sheen on the mineral plate. Storm light. Scorched ring in the grass
  at its hooves. Heavily scarred, one antler branch snapped and regrown crooked.
- `blackbloom-hart-aberrant.png` — **The Bellwether.** Landmark scale. An ancient,
  catastrophically scarred hart-lineage aberrant with a vast field-producing crown.
  Wide shot: ordinary deer small in the background, all moving on its schedule, the
  grass across the entire field bending toward it. Overcast, enormous, quiet.

## 2. Rootback Grazer — Mutation Belt / Walking Orchard

A colossal broad-backed herd quadruped carrying a living mat of soil, filter roots,
fungus, insects and seed on its back. Deep load-bearing limbs. The animal and its
carried ecology are one thing.

**Lock:** the same massive quadruped, shoulder line, head, and carried-mat footprint.
**Never:** predator teeth, extra legs, generic combat armour.

- `rootback-grazer-none.png` — **Carried-Mat Grazer.** Calm, grazing. Grass and thin
  saplings growing out of the deep soil mat on its back, insects around it. Herd
  ground, flat overcast light, mud-caked legs.
- `rootback-grazer-minor.png` — **Root-Clamped.** The carried roots visibly contracted
  and gripping around its flanks, a glossy resin film sealing the hide, centre of mass
  dropped low, root probes driven into the soil. Braced against something off-frame.
- `rootback-grazer-functional.png` — **Bastion-Back.** Twice the animal. A layered
  bark-like dermal lattice grown in beneath the mat, hooves spread wide for unstable
  ground, deep filtration sacs bulging along the ribs. Standing over torn, flooded
  earth. Splintered lattice on one flank where something hit it.
- `rootback-grazer-advanced.png` — **Standing Ruin.** Enormous — it reads like a
  collapsed building that walks. Heavy overlapping bark plating, prismatic sheen in
  the resin, roots trailing from its flanks, deep gouges torn in the ground behind it.
  Whole plates cracked and regrown.
- `rootback-grazer-aberrant.png` — **The Slow Hill.** A moving hill. A decade of
  terrain grown over it: mature trees, standing water, a broken fence line across its
  back. Legs barely distinguishable from the slope. Wide shot with small human
  structures nearby for scale, mist in the hollows.

## 3. Mirejaw — Living Marsh / Blackweir / Drowned Intake

A low, heavy amphibious ambush predator whose flexible jaw plates spread into a
root-coloured intake fan. Root-toned hide, four strong limbs, thick anchoring tail.

**Lock:** the same broad skull, jaw-plate count, limb plan, tail and hide markings.
**Never:** crocodile shorthand, extra jaws, decorative dorsal spikes.

- `mirejaw-none.png` — **Flow-Reader.** At the waterline in a marsh channel, intake
  fan half-open, completely still. Black water, reed shadow, algae streaking the hide.
- `mirejaw-minor.png` — **Silt-Veiled.** Fan folded tight, a dark silt film over the
  hide, skin matched to the channel bed, heavy mucus sheen, low sheltering posture
  beneath a root shelf. Leeches at the jaw line.
- `mirejaw-functional.png` — **Weir-Plated.** Twice the animal. Jaw plates overlapped
  into a hardened intake rim, limb webbing broadened, mineral-root scutes along the
  shoulders, jaw hinge and tail. Holding position in fast, filthy current, water
  breaking white against it.
- `mirejaw-advanced.png` — **Drownjaw.** Huge. The intake fan is now a wall of
  overlapping plate. Prismatic sheen on wet scute, black contaminated water sheeting
  off it, a collapsed debris baffle behind it and the channel running the wrong way.
  Scutes torn away in patches, the flesh beneath healed black.
- `mirejaw-aberrant.png` — **Old Drowner.** Marsh megafauna the length of a barge:
  broad filter plates, weighted root growth, a low anchoring body that has physically
  dammed the channel it lies in. Drained mud flat on one side, deep water on the
  other. Decades of scarring, drowned machinery caught in its root growth. Do not make
  it a giant crocodile.

## 4. Sump Eel — Shattercore drainage / Drowned Intake

**Important: the subject is the run, not one animal.** Every plate shows a group.
Conductive scavengers with capacitor banding, lateral-line nodes, an oil sheen and a
protective mucus.

**Lock:** the exact eel body, fin count, lateral-line layout and band spacing.
**Never:** limbs, jaws, armour shells, or cartoon lightning.

- `sump-eel-none.png` — **Sump Scavenger.** A loose run in a flooded concrete drain,
  feeding on industrial residue. Ordinary, unremarkable, faintly banded. Scum line on
  the wall, dim light from a grating above.
- `sump-eel-minor.png` — **Deep-Charge.** Thickened capacitor bands, enlarged
  lateral-line nodes, darker insulating mucus. The run tightening around a submerged
  conductor, water clouded with residue.
- `sump-eel-functional.png` — **Arcback.** The run braided close together, arcs
  jumping body to body along the channel, the water steaming and boiling where they
  pass. Scalded, sloughing tissue on the leaders.
- `sump-eel-advanced.png` — **Live Rail.** The whole pool is the animal — dozens of
  eels forming one continuous conducting mass, a prismatic film across the water
  surface, dead machinery around the edge waking up, indicator lamps coming on.
- `sump-eel-aberrant.png` — **The Braid.** Hundreds fused into a single braided
  cable-body thicker than a man, grafted into a live switchgear cabinet and running
  away through the drainage like installed infrastructure. Bodies at the seams
  half-absorbed into the mass.

## 5. Latchhound — Shattercore corridors / Splicefield Substation

A lean canine quadruped with **one** conductive jaw plate over the muzzle, cable-like
tendons visible under the skin, gripping claws and restrained charge tissue. Pack
hunter that reads machinery by touch.

**Lock:** the same canine skull, four limbs, jaw-plate lineage, tendon map and coat
markings.
**Never:** extra heads or legs, cable tentacles, robot conversion, generic spikes.

- `latchhound-none.png` — **Corridor Latcher.** Lean, latched onto a gantry rail in a
  powered service corridor, head cocked, listening through the metal. Patchy coat,
  ribs showing, working-animal condition.
- `latchhound-minor.png` — **Live-Latched.** Jaw seams open and shedding heat, tendons
  pulled taut and visible under the skin, swollen sensory tissue at the ears and feet,
  darkened contact pads. Hot, defensive posture, steam off its back.
- `latchhound-functional.png` — **Circuit Stalker.** Twice the animal. Broadened
  insulated pads, claws split for cable trays, deepened jaw resonance chambers,
  braced shoulders. Climbing a vertical cable run, moving sideways along the wall.
  Burn scarring down one side, insulation torn open and regrown.
- `latchhound-advanced.png` — **Pack Relay.** Far larger and heavier. Paired dorsal
  sensory-tendon fans rising from the shoulders (tendon continuations, not wings or
  limbs), deep capacitor sacs along the ribs, a broadened jaw plate. Prismatic sheen.
  Arcs running along every conductor it touches. Smaller pack members behind it in
  the dark. Half its face plated over old damage.
- `latchhound-aberrant.png` — **The Groundfault.** A hound fused into the substation
  itself, the floor and walls conducting through its body. Every light in the yard
  dead; the only illumination is the arcing it causes. Wide shot for scale, cables
  grown into the flesh and the flesh grown into the switchgear.

## 6. Fixed species — one plate each, no ladder

- `glasswing-kite.png` — **Glasswing Kite.** Hawk-sized aerial hunter-scavenger with
  translucent mineralized wing struts and a light predatory body, banking at a
  three-quarter angle against a restrained Crown Break pressure sky, flock behind it.
  Elegant, aerodynamic, genuinely bird-like. No heavy armour, no extra wings, no glow.
- `spore-lantern-colony.png` — **Spore Lantern Colony.** A sessile colonial symbiosis
  of tiny animals, fungus and algae: lantern shells, visible animal pores, fungal and
  algal tissue, anchored to submerged substrate in a still marsh pool. Soft, real,
  dim bioluminescence at dusk. Wet, organic, slightly repellent up close. No
  mushroom-people, no giant mouths, no theme-park neon.
- `bloommarked-remnant.png` — **Bloommarked Remnant.** **Restraint is the point.** A
  person — recognisably human, in their own worn work clothing with personal
  equipment still on them — carrying permanent Blackbloom alteration through the
  hands, jaw and shoulder. Documentary and forensic in tone, sympathetic, ambiguous,
  fully clothed. Whether they are still someone is the open question and the image
  must not answer it. Unsettling through stillness and wrongness, not through gore.
- `maintenance-unit-m-17.png` — **Maintenance Unit M-17 "Mender".** A heavy industrial
  maintenance chassis with Blackbloom organic integration: purposeful tendons, sensor
  fronds, cable roots, and tools sorted and carried on its frame. Caught mid-repair,
  doing something technically legible and quietly horrifying — patching a severed
  power cable with living vascular tissue. Worn paint, asset markings, decades of
  grime. Not a war robot, not a flesh heap.

## 7. Named mini-bosses — one plate each

- `switchmother.png` — **Switchmother.** Engineered-origin monstrosity grown into the
  Splicefield switchyard: insulating plates, brood chambers, and decades-old
  switchgear integrated into the body, current paths opening and closing through her.
  She is anchored to the yard and reads as part of the installation. Industrial,
  deliberate, wrong. Wide enough to show the yard around her. Never a generic flesh
  heap.
- `the-last-shift.png` — **The Last Shift.** **Restraint is the point.** A coordinated
  collective of former Southreach workers — individual recognisable people, repeated
  PPE, hard hats, tools, name tags — joined by purposeful Blackbloom connective growth
  and salvaged maintenance mechanisms, still carrying out an emergency procedure
  together in a wrecked plant interior. Fully clothed, faces partly visible, moving
  with terrible coordination. Whether anyone inside it is conscious is unresolved. No
  zombie horde, no hive queen, no gore.

---

When every file is saved, build the archive:

```
/mnt/data/bloomfall-creatures.zip
```

containing all 31 PNGs, and give me the download link and its contents.
