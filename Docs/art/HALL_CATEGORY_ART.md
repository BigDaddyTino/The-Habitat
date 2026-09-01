# Hall Category Art

Each hall renders exactly five category showcases, and each showcase wants its own cinematic banner.
The manifest in [`apps/web/lib/hall-categories.ts`](../apps/web/lib/hall-categories.ts) is the source
of truth for the list; `apps/web/lib/hall-categories.test.ts` fails the build if it drifts from the
seeded record catalog.

**Status: all ten banners are authored and in place.** `hall-categories.test.ts` asserts each one
exists as a PNG at exactly 2400 × 1000, so a deleted or off-spec banner fails the build.

## How the art is wired

Drop a PNG at the exact path below and it is picked up on the next web restart — no code change.
If a file is ever absent, that showcase falls back to the hall's own cinematic
(`hall-legends-cinematic.png` / `hall-shame-cinematic.png`), so a missing piece degrades quietly
instead of shipping a broken image request. Presence is resolved once per path per process.

## Specification

- **Format:** PNG, 24-bit (no alpha needed — these are full-bleed banners)
- **Resolution:** 2400 × 1000 (2.4:1). The banner is `min-height: 340px` at up to 1200px wide and is
  cropped with `object-fit: cover; object-position: center 42%`, so keep the subject in the upper
  two-thirds and leave the bottom third readable — copy sits there behind a dark veil.
- **Safe areas:** top-left ~120px and top-right ~120px carry the index number and the category icon
  badge. Bottom-left carries the headline and blurb; bottom-right carries the two-stat tally block.
- **Tone:** match the existing lodge cinematics — practical warm light, heavy shadow, no text baked
  into the image, no real logos, no recognizable real people.

## The banners

### Hall of Legends — `apps/web/public/images/halls/`

| File | Category | Art direction |
| --- | --- | --- |
| `category-legends-community.png` | Community | The lodge common room at full capacity: long table, many chairs, lantern light, coats on hooks. Warmth and volume of people. |
| `category-legends-exploration.png` | Exploration | A cartography alcove — layered maps, brass instruments, a window onto several different biomes at once. |
| `category-legends-combat.png` | Combat | An armory wall: worn blades and axes racked in order, forge light raking across steel. Weapons at rest, not a battle scene. |
| `category-legends-achievement.png` | Achievement | A badge and medal wall under gallery lighting — dense rows of engraved plates, glass and brass. |
| `category-legends-marvel-rivals.png` | Marvel Rivals | The club war room: monitors, scoreboards, a competitive-play desk lit in cool blue against the lodge's warm wood. |

### Hall of Shame — `apps/web/public/images/halls/`

| File | Category | Art direction |
| --- | --- | --- |
| `category-shame-occupational-hazards.png` | Occupational Hazards | A gravestone gallery under a wall-sized chalk tally board — ember light, gallows humour, nothing gory. |
| `category-shame-widespread-failure.png` | Widespread Failure | A wall map stuck with a great many little flags, each one marking somewhere it went wrong. |
| `category-shame-character-building.png` | Character Building | Framed defeats hung like fine art in a red-lit gallery, one crooked frame. |
| `category-shame-almost-had-it.png` | Almost Had It | A podium where only the second-place step is polished; the top step gathers dust. |
| `category-shame-supporting-role.png` | Supporting Role | Backstage: ropes, cue lights, someone's props waiting in the dark while the stage glows beyond. |

## Generation prompts

Use whatever produced `hall-legends-cinematic.png` and `hall-shame-cinematic.png` — matching the
existing renderer matters more than the wording. If that tool accepts reference images, feed it those
two PNGs as style references and the prompts below as subject only.

### House style — prepend to every prompt

> Photorealistic cinematic 3D architectural render, AAA game key art quality, ultra-detailed, shot on
> a wide lens. A dark timber-and-stone Nordic lodge interior. Deep near-black shadows with one
> dominant warm amber light source cutting through heavy volumetric haze and drifting dust motes.
> High dynamic range, strong bloom on metal and flame, polished floor catching reflections. Aged wood
> grain, wrought iron, tarnished brass, hand-carved detail. Ultrawide 2.4:1 cinematic composition with
> the subject held in the upper two-thirds and the bottom third left dark, empty and readable. No
> text, no lettering, no signage, no numbers, no logos, no watermark, no UI, no human faces.

### Hall of Legends — append this palette line

> Palette: near-black brown and forest green lit by brilliant polished gold. Shafts of cold daylight
> through tall mullioned windows onto snow peaks and pine. Green-and-gold heraldic banners, brass
> chandeliers, braziers of orange flame.

| File | Subject prompt |
| --- | --- |
| `category-legends-community.png` | The great hall's long feast table at full capacity: thirty carved chairs pushed in at angles, tankards and plates left mid-meal, cloaks and lanterns hung on iron hooks down the wall, a fire roaring in a vast stone hearth at the far end. Nobody in frame — the room is still warm from having just been full. |
| `category-legends-exploration.png` | A cartographer's alcove off the great hall: layered hand-drawn maps curling across a huge oak table, brass sextants, dividers and a great terrestrial globe, and six tall windows each looking onto a completely different landscape — snow peaks, marshland, desert canyon, deep pine, volcanic ash, open sea. |
| `category-legends-combat.png` | An armory wall: dozens of axes, longswords, spears and round shields racked in perfect ordered rows on dark timber, forge light raking hard across honed steel, a whetstone bench and oiled rags in the foreground. Weapons at rest and immaculately kept — never a battle, never blood. |
| `category-legends-achievement.png` | A trophy and badge wall under gallery lighting: hundreds of blank engraved brass plates and medals mounted in dense ordered rows behind glass, a small picture light above each row, a rolling library ladder leaning against the wall. |
| `category-legends-marvel-rivals.png` | The club war room: a competitive play desk of six monitors glowing cold blue, headsets on stands, a blank slate scoreboard on the wall, cable runs and a small equipment rack — all built into the same warm timber lodge architecture, so cold screen light fights warm lantern light. |

### Hall of Shame — append this palette line

> Palette: deep crimson and maroon under cold violet ghost-light and weak guttering candlelight. Red
> velvet rope stanchions, cracked glass display cases, a candle chandelier. The render is played dead
> straight; only the contents are ridiculous.

| File | Subject prompt |
| --- | --- |
| `category-shame-occupational-hazards.png` | A memorial gallery of failure: rows of small carved headstones on plinths under red gallery light, each with a blank uninscribed brass plate, and an enormous tally board of chalk marks filling the whole wall behind them. Solemn and absurd — no blood, no bodies, no gore. |
| `category-shame-widespread-failure.png` | An enormous pinned wall map of many different realms, so completely covered in small red flags that they overlap into clusters, red thread strung between the pins. A cabinet of spare flags stands open and nearly empty beside it. |
| `category-shame-character-building.png` | A red-lit portrait gallery of defeats: large gilt frames hung salon-style, each containing a dented shield, a snapped sword or a scorched banner mounted like fine art above a small blank brass plaque. One frame hangs visibly crooked. Velvet rope across the front. |
| `category-shame-almost-had-it.png` | A victory podium in a dim hall: the second-place step polished to a mirror and worn smooth from constant use, the first-place step above it thick with dust and cobwebs, a single spotlight aimed squarely at the silver step. A dropped laurel wreath on the floor. |
| `category-shame-supporting-role.png` | Backstage behind a lit stage: coiled ropes, sandbag counterweights, a rack of cue lights and a prop table waiting in near-darkness, while warm stage light spills in from the wings. All the machinery of someone else's applause. |

### After generating

Save each at its exact filename into `apps/web/public/images/halls/`, then restart the web service.
If the generator cannot output 2.4:1, take the widest it offers (21:9, then 16:9) — the banner crops
with `object-position: center 42%`, so a taller source loses its bottom, not its subject.

## Existing art (already in the repo)

`hall-legends-cinematic.png`, `hall-shame-cinematic.png` — hall heroes, still used and still the
fallback for any category banner that ever goes missing. `record-most-deaths.png` was deleted when
art moved from per-record to per-category; its subject is now covered by
`category-shame-occupational-hazards.png` at full spec.

The ten banners total roughly 47 MB of RGBA PNG in the repository. That is source-of-truth weight,
not delivered weight — `next/image` re-encodes and resizes them per request, so browsers receive
WebP/AVIF at the rendered width.
