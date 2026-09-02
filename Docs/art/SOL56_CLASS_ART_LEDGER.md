# SOL 5.6 — The Eight as People art ledger

**Status:** ACCEPTED, INSTALLED, AND VERIFIED — static, regression, authenticated live-browser, and unauthenticated privacy gates PASS  
**Commission issued:** 2026-09-01  
**Asset execution completed:** 2026-09-01  
**Authority:** `Docs/art/SOL56_CLASS_ART_PROMPT.txt` → class/talent canon audit → generated-source and crop QA

## Acceptance summary

- Baseline: **8 commissioned class slots, 8 placeholders**. Final private inventory: **8/8 plates installed; 8 → 0 placeholders**.
- Installed convention: `apps/web/private/codex-art/classes/<slug>.png` for `bastion`, `spector`, `conduit`, `surger`, `archon`, `procurator`, `cypherist`, and `maverick`.
- Format gate: **PASS — 8/8** are 1672x941 PNG, sRGB, 8-bit `uchar`, 3 channels, no alpha (RGB24).
- Static crop gate: **PASS — 8/8** reviewed at full frame, exact shelf crop, center-45-percent dossier simulation, and stacked-banner simulation. Every protected portrait crop retains the class figure's head, working hands, and defining action/object.
- Visual gate: **PASS — 8/8** read as action stills, use one shared codex-dark family, retain one class-owned motivated color, and contain no visible text, labels, numbers, logos, watermarks, or shaped insignia.
- Gate 6b: **PASS**. The Conduit's lantern-gold pool light and the Maverick's ember are allowed to own their frames at full brightness.
- Canon discipline: these figures are **representative embodiments of class mechanics, not named canon characters**. Their observed faces, species, ages, genders, clothing details, and biographies do not establish or alter character canon.
- Publication audit: the shelf and dossiers already resolve the private convention path and retain the class constellation as fallback. No database, API, credentials, infrastructure address, taxonomy, or public asset route changed in this run.
- Regression test: **PASS** — the focused class-art contract and relevant resolver/privacy/talent suites passed 21/21; strict web TypeScript and focused ESLint also passed.
- Authenticated live-browser QA: **PASS** — all eight shelf plates loaded at native 1672x941 with no fallback-path text, warning/error console output, or horizontal overflow; responsive Conduit dossier checks passed at desktop, tablet, and mobile sizes.
- Unauthenticated privacy QA: **PASS** — a direct request to `/codex-art/classes/bastion.png` without session credentials returned HTTP 404 and disclosed no private file.

## Scope, route, and crop contract

The class shelf and each class dossier call the existing private art resolver for `classes/<slug>.png`. The files are runtime disk assets: once present they are available on authenticated reload, subject to the resolver's short cache, without replacing the constellation-chart fallback or introducing public-path copies.

The commissioned 1672x941 master is checked against three explicit crop simulations:

| Surface | Source rectangle | Purpose |
|---|---:|---|
| Shelf card | `left=483, top=0, width=706, height=941` | Exact 3:4 portrait crop from the 16:9 master. With full source height retained there is no vertical overflow; the CSS `object-position: center 30%` therefore does not move this source rectangle. |
| Dossier hero | `left=460, top=0, width=752, height=941` | The brief's approximate center 45% of source width at full height. |
| Stacked/mobile banner simulation | `left=0, top=115, width=1672, height=557` | Wide crop used to expose likely vertical loss when the dossier stacks at narrower widths. This is a QA simulation, not a claim about a single browser's exact CSS pixel rectangle. |

The source crop contract and final metadata are machine-recorded in `tmp/class-art/qa/final/qa-manifest.json`. The generated contact sheets are:

- `tmp/class-art/qa/final/full-contact.png`
- `tmp/class-art/qa/final/shelf-crop-contact.png`
- `tmp/class-art/qa/final/dossier-center-45-contact.png`
- `tmp/class-art/qa/final/stacked-banner-contact.png`
- `tmp/class-art/qa/final/<slug>-shelf.png` for each exact shelf crop

The captions visible below the cells in those contact sheets are QA overlays created after cropping. They are not present in any shipping plate.

## Generator and prompt provenance

- Generator: OpenAI built-in ImageGen through the Codex `image_gen__imagegen` tool.
- Generation mode: one call for each distinct new image or targeted edit; no batch contact-sheet generation was used as a shipping source.
- Retained generator root: `C:\Users\administrator.MARTINOBEAR.000\.codex\generated_images\01a05e0a-8110-71e1-93b0-a43b60303524\`.
- The issued commission is retained verbatim in `Docs/art/SOL56_CLASS_ART_PROMPT.txt`. That file is the exact shared prompt authority.
- The runtime did not retain a separate verbatim transcript of every ImageGen invocation. The per-asset blocks in this ledger are therefore explicitly labeled **reconstructed accepted execution prompt records**. They preserve the accepted request, crop protections, and iteration corrections, but are not represented as quoted call logs.
- No generated image was silently passed off as a named person. Diversity across the eight bodies is an art-direction choice for the build-system archetypes, not a canon cast assignment.

### Shared execution rules — reconstructed from the verbatim commission

```text
Give each class one body and one decisive action moment, readable without words like a fighting-game character select.

Final format: 1672x941 RGB24 PNG, cinematic 16:9. Both the dossier hero (roughly the center 45% at full height) and the shelf's 3:4 portrait crop must read. Keep the figure's head and working hands inside the portrait window; let expendable world detail spill into the side fields.

Standing character-portrait law with motion: mature AAA grounded cinematic photorealism, real lenses, real weather and wear, physically credible bodies and equipment, near-future military-industrial kit, magic treated as infrastructure. These are action stills, not posed portraits. Zero text anywhere and all insignia blank. No fantasy-gloss armor.

One set palette: charcoal, wet grey, bone, muted rust, and storm blue. One motivated class color per plate: Bastion brass; Spector cold grey-blue; Conduit lantern-gold; Surger red; Archon green-gold; Procurator ledger-white; Cypherist contained cyan; Maverick ember.

Gate 6b remains in force: where the class earns a bright plate, especially Conduit and Maverick, the motivated light owns the frame at full weight.
```

The block above is a condensed execution record reconstructed from the commission, not a verbatim ImageGen call log. The complete exact issued wording and all eight scene commissions remain in `Docs/art/SOL56_CLASS_ART_PROMPT.txt`.

## Final generated-source manifest

The following are the accepted **generative** sources before any documented mechanical normalization or side-field adjustment. Each path is the generator root above plus the exact filename shown.

| Class | Accepted generated source ID / filename | Dimensions / source pixel format | Bytes | SHA-256 |
|---|---|---:|---:|---|
| Bastion | `exec-42125201-cbf7-4eec-bb97-276a827c9792.png` | 1672x941 PNG · RGB24 | 2,537,597 | `5fad2053bdadb51acaef9dd3afe8f750f29dee44ea62b99974f11697aa01dacb` |
| Spector | `exec-d01c137f-f50f-41e1-a59f-61504979fc02.png` | 1672x941 PNG · RGB24 | 2,271,586 | `c69c1433d0ee2b5e14fc77267655f2e8699babbe67ef6025b5be774f7e834afc` |
| Conduit | `exec-d0387640-222e-475e-8508-fc1619e4650b.png` | 1667x943 PNG · RGB24 | 2,271,479 | `ba1faba1d4d88c6ee9c05f90e496bef6e3eab5e96ee09ead63e2d00cbf7fc3e9` |
| Surger | `exec-7ca59c77-0976-4fe0-ba68-73c4731dd6e9.png` | 1671x941 PNG · RGB24 | 2,292,395 | `81c342f098bd0cb16dcfdb2906afa709bcb663c950866590c31c87f05fe0a645` |
| Archon | `exec-b7998101-117d-491d-9257-a9701d0b97c5.png` | 1667x943 PNG · RGB24 | 2,212,398 | `9574a96e8ada54fb8eaf1014ca1e6f966f5a86b33fb1cc72faa84ae1ca965f08` |
| Procurator | `exec-88c51f28-921a-47e2-bf54-99fb10d5eafe.png` | 1672x941 PNG · RGB24 | 2,727,637 | `e633ce058eeecc4e6cf05251c0626530a9112b851c3b0c249b82c3dd67ca24ed` |
| Cypherist | `exec-df195a2f-4186-482a-b5a8-86a17ff2cccf.png` | 1671x941 PNG · RGB24 | 2,382,642 | `46fcf7b81a92f86a5b13a39ece063977386648043dc24f10c4122e75d89624fb` |
| Maverick | `exec-2053a620-d6b5-4a8e-83c8-2db6e9f9f491.png` | 1672x941 PNG · RGB24 | 2,155,685 | `713fd0af0eae39e733a2aa9910f0a76f9898f7dfab37cf3a8a826afae77ccc77` |

## Mechanical normalization and side-field record

No accepted subject was generatively altered after the accepted source listed above. Sharp performed only the following deterministic publication operations:

| Class | Staged accepted source | Deterministic operation | Staged SHA-256 |
|---|---|---|---|
| Bastion | `tmp/class-art/sources/bastion-v1.png` | Already exact; installed byte-for-byte. | `5fad2053bdadb51acaef9dd3afe8f750f29dee44ea62b99974f11697aa01dacb` |
| Spector | `tmp/class-art/sources/spector-v1.png` | Already exact; installed byte-for-byte. | `c69c1433d0ee2b5e14fc77267655f2e8699babbe67ef6025b5be774f7e834afc` |
| Conduit | `tmp/class-art/sources/conduit-v6.png` | Resize source 1667x943 → 1672x941 with `fit: fill`; extend 128 px on the left using mirrored expendable side field and crop the rightmost 128 px, shifting the accepted action 128 px right; overlay a 340 px left-edge charcoal gradient (0.8 opacity at edge to transparent); flatten/remove alpha and encode sRGB RGB24. The protected subject/action is otherwise unchanged. | `68797a21d81f4dacb3ad23a354b1f5fe6d5d315f73c27862e19019b283027cb1` before RGB24 flatten |
| Surger | `tmp/class-art/sources/surger-v5.png` | Resize source 1671x941 → 1672x941 with `fit: fill`; the same 128 px mirrored-side-field shift and 340 px charcoal vignette used for Conduit; flatten/remove alpha and encode sRGB RGB24. This moves both gripping hands into the protected crop while changing only expendable side fields around the accepted action. | `b050ff127baf260e28e6dc836bc515c5f5242d19030699911cf7a43b38551be2` before RGB24 flatten |
| Archon | `tmp/class-art/sources/archon-v4.png` | Resize 1667x943 → 1672x941 with `fit: fill`; encode sRGB RGB24. | `9574a96e8ada54fb8eaf1014ca1e6f966f5a86b33fb1cc72faa84ae1ca965f08` |
| Procurator | `tmp/class-art/sources/procurator-v1.png` | Already exact; installed byte-for-byte. | `e633ce058eeecc4e6cf05251c0626530a9112b851c3b0c249b82c3dd67ca24ed` |
| Cypherist | `tmp/class-art/sources/cypherist-v3.png` | Resize 1671x941 → 1672x941 with `fit: fill`; encode sRGB RGB24. | `46fcf7b81a92f86a5b13a39ece063977386648043dc24f10c4122e75d89624fb` |
| Maverick | `tmp/class-art/sources/maverick-v2.png` | Already exact; installed byte-for-byte. | `713fd0af0eae39e733a2aa9910f0a76f9898f7dfab37cf3a8a826afae77ccc77` |

The exact scripts are retained at `tmp/class-art/shift-finals.mjs`, `tmp/class-art/vignette-shifted-finals.mjs`, and `tmp/class-art/normalize-install.mjs`. A blurred-side-fill experiment (`conduit-v5` / `surger-v4`) was rejected because its vertical transition was visible. The accepted vignetted mirror extension is confined to the left side field and was reviewed at full-frame scale.

## Final SHA-256 manifest

| Relative path | Dimensions / pixel format | Bytes | SHA-256 |
|---|---:|---:|---|
| `apps/web/private/codex-art/classes/bastion.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | 2,537,597 | `5fad2053bdadb51acaef9dd3afe8f750f29dee44ea62b99974f11697aa01dacb` |
| `apps/web/private/codex-art/classes/spector.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | 2,271,586 | `c69c1433d0ee2b5e14fc77267655f2e8699babbe67ef6025b5be774f7e834afc` |
| `apps/web/private/codex-art/classes/conduit.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | 2,125,809 | `83b4cbabc7613303031781df2d35cc7403c8812098d51310bf04ba044c56691c` |
| `apps/web/private/codex-art/classes/surger.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | 2,095,307 | `9010bc4e94f887074eea93c4257d5e93e0ece3e13baaf8295abcaf5848f5b7ec` |
| `apps/web/private/codex-art/classes/archon.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | 2,090,614 | `551a9155802ab408cd563256cb3e3bd82452b1b239678be60f8bfe6d1470aae7` |
| `apps/web/private/codex-art/classes/procurator.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | 2,727,637 | `e633ce058eeecc4e6cf05251c0626530a9112b851c3b0c249b82c3dd67ca24ed` |
| `apps/web/private/codex-art/classes/cypherist.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | 2,255,072 | `f4c5b95f4c4d506e722b1955e59a8b3880d40621f452768127a5bf225f4b9cec` |
| `apps/web/private/codex-art/classes/maverick.png` | 1672x941 PNG · sRGB · RGB24 · uchar · no alpha | 2,155,685 | `713fd0af0eae39e733a2aa9910f0a76f9898f7dfab37cf3a8a826afae77ccc77` |

Machine-readable source/final provenance is retained in `tmp/class-art/qa/final/install-manifest.json`.

## Per-asset accepted prompt and QA records

### classes/bastion.png — THE DOORWAY

- Representation: original representative Bastion embodiment; not a named canon soldier.
- Generated source: `exec-42125201-cbf7-4eec-bb97-276a827c9792.png`.
- Final path / SHA-256: `apps/web/private/codex-art/classes/bastion.png` / `5fad2053bdadb51acaef9dd3afe8f750f29dee44ea62b99974f11697aa01dacb`.
- Class/canon gate: practical plated soldier, shotgun low rather than hero-aimed, doorway-width Seal ward with physical heat-shimmer weight, squad visibly advancing inside its protection, no fantasy-gloss armor.
- Owned color: restrained Bastion brass in the ward anchors and breach light.
- QA: **PASS** — full frame reads the wall that answers back; exact shelf and dossier crops retain face, both gun-working hands, shotgun, ward edge, and protected squad context; stacked banner retains breach, body, weapon, and brass ward logic.

**Reconstructed accepted execution prompt record (not a verbatim call log):**

```text
Create a final shipping-quality 16:9 class action plate for BASTION — THE DOORWAY. An adult Black woman soldier in scarred, practical near-future plate fills a freshly breached industrial doorway from inside, body braced and shotgun held low across her torso. A Seal ward stands exactly in the doorframe like heat shimmer with mass, expressed through brass anchor hardware, displaced rain and dust, and pressure in the air. Behind her, squadmates move forward inside the ward. The image must say: the wall answers back.

Use mature AAA grounded cinematic photorealism, real lens/weather/wear, charcoal/wet-grey/bone/muted-rust/storm-blue set palette with only motivated brass. This is a violent action still, not a portrait. Keep her head, both working hands, and shotgun inside the exact central 3:4 shelf window and center-45-percent dossier window. Zero text, numbers, labels, logos, watermarks, heraldry, or shaped insignia; blank surfaces; no fantasy-gloss armor.
```

### classes/spector.png — ONE ROUND

- Representation: original representative Spector embodiment; not a named canon marksman.
- Generated source: `exec-d01c137f-f50f-41e1-a59f-61504979fc02.png`.
- Final path / SHA-256: `apps/web/private/codex-art/classes/spector.png` / `c69c1433d0ee2b5e14fc77267655f2e8699babbe67ef6025b5be774f7e834afc`.
- Class/canon gate: the fired weapon is a marksman rifle; a separate suppressed carbine rests beside the figure as the second option; no invisibility effect, supernatural transparency, or muzzle-flash spectacle.
- Owned color: cold grey-blue rooftop and city light.
- QA: **PASS** — full frame reads the half-second after a single shot; shelf/dossier crops preserve eye-to-glass, face, both hands, optic, fired rifle, casing, and enough of the separate suppressed carbine; stacked banner retains the prone silhouette and unaware city.

**Reconstructed accepted execution prompt record (not a verbatim call log):**

```text
Create a final shipping-quality 16:9 class action plate for SPECTOR — ONE ROUND. An adult East Asian marksman lies prone on a rain-black rooftop at night, eye still to the glass one half-second after firing a long marksman rifle; show a newly ejected casing and physical recoil settling, not a muzzle-flash pose. A separate compact suppressed carbine lies beside them like a second opinion. The distant city remains unaware. Nobody was there, but do not depict invisibility or a ghost effect.

Use mature AAA grounded cinematic photorealism, true wet-roof optics and worn near-future kit, the shared codex-dark family with cold grey-blue as the sole motivated class color. Keep head, eye, both working hands, optic, and rifle action inside both protected center crops. Zero text, numbers, labels, logos, watermarks, or insignia.
```

### classes/conduit.png — THE LANTERN

- Representation: original representative Conduit embodiment; not a named canon caster.
- Generated source: `exec-d0387640-222e-475e-8508-fc1619e4650b.png`; accepted subject shifted mechanically in expendable side fields as documented above.
- Final path / SHA-256: `apps/web/private/codex-art/classes/conduit.png` / `83b4cbabc7613303031781df2d35cc7403c8812098d51310bf04ba044c56691c`.
- Class/canon gate: Siege Lantern / Deep Pool expression, not Live Wire; artillery-precise physical boundary around the burning grid square; allies remain visibly untouched outside it; sidearm is holstered and forgotten.
- Owned color / Gate 6b: lantern-gold at full frame weight; no compromise dimming.
- QA: **PASS** — final full frame retains siege line, exact burning boundary, protected allies, and holstered sidearm; the 128 px composition shift puts face and both complete casting hands with margin inside shelf and dossier crops; stacked banner retains both pools of hand light and the burning square.

**Reconstructed accepted execution prompt record (not a verbatim call log):**

```text
Create a final shipping-quality 16:9 class action plate for CONDUIT — THE LANTERN. A striking adult South Asian woman caster stands mid-cast in a wet siege line, both complete hands pouring dense pool light with artillery precision. Behind her, one exact grid square burns inside a visibly physical rectangular boundary while nearby allied soldiers remain untouched immediately outside it. Her practical sidearm stays holstered and forgotten. This is Siege Lantern / Deep Pool infrastructure, not Live Wire electricity.

Use mature AAA grounded cinematic photorealism, scorched concrete, rain, real wear and industrial spell hardware. Keep the shared codex-dark family, but let lantern-gold own the frame under Gate 6b. Keep her head, both complete casting hands, wrists, and holstered sidearm inside both protected center crops. Zero text, numbers, labels, logos, watermarks, UI, runes, or insignia.
```

### classes/surger.png — THE ENGINE

- Representation: original representative Surger embodiment; not a named canon berserker.
- Generated source: `exec-7ca59c77-0976-4fe0-ba68-73c4731dd6e9.png`; accepted subject shifted mechanically in expendable side fields as documented above.
- Final path / SHA-256: `apps/web/private/codex-art/classes/surger.png` / `9010bc4e94f887074eea93c4257d5e93e0ece3e13baaf8295abcaf5848f5b7ec`.
- Class/canon gate: hot back rig plus two-handed industrial blade; phase-two edge shown as medically plausible dark/lit vascular stress beneath skin, not cracking lava, mutation, shapeshifting, or a monster form; damage is the fuel; wet blade remains restrained rather than obscuring the class read.
- Owned color: motivated Surger red confined to the hot rig, vascular edge, and sparse industrial warning light.
- QA: **PASS** — full frame reads motion and enjoyment without losing human anatomy; shelf/dossier crops retain face, both grip hands, blade root, vascular stress, and hot rig; stacked banner preserves the swing vector, blade, expression, and red engine light.

**Reconstructed accepted execution prompt record (not a verbatim call log):**

```text
Create a final shipping-quality 16:9 class action plate for SURGER — THE ENGINE. An adult Middle Eastern man infused berserker is caught mid-swing with a heavy two-handed industrial blade. His back rig runs dangerously hot in contained red; medically plausible stressed veins show beneath the skin at the phase-two edge. The blade is rain-wet with a restrained fresh blood smear. He is still fully human and visibly enjoys the momentum: damage becoming fuel.

Use mature AAA grounded cinematic photorealism, real anatomy, rain, wear, and near-future industrial hardware. Do not use glowing body cracks, lava skin, monster anatomy, fantasy armor, or shapeshifting. Keep head, both complete gripping hands, blade root, and hot rig inside both protected center crops. Shared codex-dark palette; only motivated red. Zero text, numbers, labels, logos, watermarks, or insignia.
```

### classes/archon.png — THE CHORUS

- Representation: original representative Archon embodiment and a different consenting Hypogriff mount; neither is the named Unridden.
- Canon comparison inspected: `apps/web/private/codex-art/characters/the-unridden.png` for species-sheet anatomy only, not identity copying.
- Generated source: `exec-b7998101-117d-491d-9257-a9701d0b97c5.png`.
- Final path / SHA-256: `apps/web/private/codex-art/classes/archon.png` / `551a9155802ab408cd563256cb3e3bd82452b1b239678be60f8bfe6d1470aae7`.
- Class/canon gate: exact Hypogriff plan — eagle head/beak/neck/chest, two wings, two eagle forelegs with talons, horse barrel/hindquarters, two horse rear legs with hooves, and horse tail; rider and mount are bonded/consenting; a flock of distinct bonded shapes rises around them.
- Owned color: green-gold in the altitude break and bonded flock light.
- QA: **PASS** — final full frame shows corrected eagle-front/horse-rear anatomy and chorus scale; shelf/dossier crops retain rider head and both control hands together with mount head and bonded shapes; stacked banner retains rider, mount face/wings, flock, and altitude.

**Reconstructed accepted execution prompt record (not a verbatim call log):**

```text
Create a final shipping-quality 16:9 class action plate for ARCHON — THE CHORUS. An adult Black beastmaster rides a consenting bonded Hypogriff at dangerous altitude while a flock of bonded avian and machine shapes rises around them. The mount is a different individual from the Unridden but follows the same exact species anatomy: eagle head, beak, neck and chest; exactly two wings; exactly two eagle forelegs ending in talons; horse barrel and hindquarters; exactly two horse rear legs ending in hooves; horse tail. Show trust, control, and multiplication rather than domination: more of you than the fight started with.

Use mature AAA grounded cinematic photorealism, real wind/load/anatomy and worn harness hardware. Keep rider head and both complete control hands, mount head, and at least several chorus shapes inside both protected center crops. Shared codex-dark palette with one green-gold cloud break. Zero text, numbers, labels, logos, watermarks, heraldry, or insignia.
```

### classes/procurator.png — THE SAND TABLE

- Representation: original representative Procurator embodiment; not a named canon commander.
- Generated source: `exec-88c51f28-921a-47e2-bf54-99fb10d5eafe.png`.
- Final path / SHA-256: `apps/web/private/codex-art/classes/procurator.png` / `e633ce058eeecc4e6cf05251c0626530a9112b851c3b0c249b82c3dd67ca24ed`.
- Class/canon gate: a tactile blank radial order wheel is the brief-authorized physical analogue, never literal game UI or a hologram; three distinct groups of troops look to the commander; the composition sells weakness alone and force through numbers without asserting an exact canon headcount.
- Owned color: ledger-white work lamp and map-table highlights.
- QA: **PASS** — full frame preserves tarp, physical sand table, radial order wheel, and three groups; shelf/dossier crops retain face, both command-working hands, and wheel; stacked banner retains the commander at the center of the watching formation.

**Reconstructed accepted execution prompt record (not a verbatim call log):**

```text
Create a final shipping-quality 16:9 class action plate for PROCURATOR — THE SAND TABLE. An older adult East Asian woman commander works a physical sand-table map under a rain-dark field tarp, one hand decisively turning a blank tactile radial order wheel and the other planted among plain terrain pieces. Three visibly distinct squad groups around the table look to her. She is weak alone and unbeatable in numbers: shoot the numbers.

Use mature AAA grounded cinematic photorealism, practical field gear, real tarp/weather/wear, no glamour pose. The radial wheel is physical brass/steel hardware, never a hologram or literal UI; map pieces and surfaces are blank. Keep face, both hands, and wheel inside both protected center crops. Shared codex-dark palette with ledger-white as the sole motivated light. Zero text, pseudo-writing, numbers, labels, logos, watermarks, or insignia.
```

### classes/cypherist.png — BENCH ANYWHERE

- Representation: original representative Cypherist embodiment; not a named canon technician.
- Generated source: `exec-df195a2f-4186-482a-b5a8-86a17ff2cccf.png`.
- Final path / SHA-256: `apps/web/private/codex-art/classes/cypherist.png` / `f4c5b95f4c4d506e722b1955e59a8b3880d40621f452768127a5bf225f4b9cec`.
- Class/canon gate: Pilot / Uplink expression remains mechanically coherent; the technician stands outside an opened, inert warframe while servicing it; drones lift from the field bench; one eye tracks the physical frame and one the optical feed; no autonomous/emotive machine face.
- Owned color: cyan contained to tool, frame, feed, and drone status lights.
- QA: **PASS** — full frame reads the remote-war workshop; shelf/dossier crops retain head, both tool-working hands, actuator/feed, bench, and enough opened frame; stacked banner retains technician, opened frame, drones, and physical work line.

**Reconstructed accepted execution prompt record (not a verbatim call log):**

```text
Create a final shipping-quality 16:9 class action plate for CYPHERIST — BENCH ANYWHERE. An adult white male field technician stands outside a half-open, inert near-future warframe at a rain-soaked bench, actively servicing an exposed actuator with both hands while compact drones lift from the table. One eye is on the physical frame and one on a small optical feed. The scene communicates Pilot / Uplink remote war without turning the machine into an emotive character.

Use mature AAA grounded cinematic photorealism, credible cables, tools, grease, rain, and industrial wear. Keep head, both complete working hands, actuator/tool, feed, and drone launch inside both protected center crops. Shared codex-dark palette; cyan strictly contained to tool lights, frame service lights, feed, and drone status points. Zero text, numbers, labels, logos, watermarks, readable UI, or insignia; no robot face.
```

### classes/maverick.png — TWIN IRONS

- Representation: original representative Maverick embodiment; not a named canon gunslinger.
- Generated source: `exec-2053a620-d6b5-4a8e-83c8-2db6e9f9f491.png`.
- Final path / SHA-256: `apps/web/private/codex-art/classes/maverick.png` / `713fd0af0eae39e733a2aa9910f0a76f9898f7dfab37cf3a8a826afae77ccc77`.
- Class/canon gate: exact Iron & Ember branch — one pistol and one lit ember hand, not two pistols plus magic; Southside is a dense, wet, vertical waterfront street, never a Western frontier town; coat and crowd motion sell a visible, loud draw.
- Owned color / Gate 6b: ember at full frame weight, supported only by motivated warm street spill.
- QA: **PASS** — full frame contains exactly one pistol, one open ember hand, moving coat, and crowd already stepped back; shelf/dossier crops retain face, drawing hand/pistol, complete ember hand, and coat action; stacked banner preserves both irons and Southside witnesses.

**Reconstructed accepted execution prompt record (not a verbatim call log):**

```text
Create a final shipping-quality 16:9 class action plate for MAVERICK — TWIN IRONS. A striking adult Latina gunslinger is caught at the instant of drawing in a dense, wet, vertical Southside waterfront street. Show exactly one practical pistol in one hand and exactly one open spell hand burning with contained ember — the Iron & Ember branch, not a second pistol. Her long worn coat snaps with the draw and the nearby crowd has already stepped back. Loud, fast, seen; never a Western frontier image.

Use mature AAA grounded cinematic photorealism, rain, real street depth, worn near-future kit and motion. Keep face, pistol/drawing hand, complete ember hand, and coat action inside both protected center crops. Shared codex-dark family, but let ember own the frame under Gate 6b. Zero text, numbers, signs, labels, logos, watermarks, heraldry, or insignia.
```

## Superseded generated attempts and exceptions

All paths in this table use the retained generator root stated above. Superseded files remain provenance only and were not installed.

| Asset / attempt | Generated source ID | Dimensions | SHA-256 | Reason superseded |
|---|---|---:|---|---|
| Conduit v1 | `exec-0f1e0312-1c50-4023-ac03-386289a40575.png` | 1672x941 | `9ccbb186feb7e236a5329f36ab9f5b8181c2233824c4738e2875542a38953fdd` | Far casting hand clipped by exact shelf crop. |
| Conduit v2 | `exec-14e9d333-a221-40cd-be7c-e625c151d7b0.png` | 1672x941 | `c8464740d1a8ce898fc0f53d03230651b474d6285486791a913ac1f2513ef858` | Recomposition improved the spell geometry but still failed complete-hand margin in the shelf crop. |
| Conduit v3 | `exec-d0387640-222e-475e-8508-fc1619e4650b.png` | 1667x943 | `ba1faba1d4d88c6ee9c05f90e496bef6e3eab5e96ee09ead63e2d00cbf7fc3e9` | Accepted generative subject, but its far hand remained at the crop edge; deterministic 128 px side-field shift produced the installed composition. |
| Surger v1 | `exec-aed4b6ea-9ff9-49b5-a681-5f91514e8587.png` | 1672x941 | `87f1fd52e1979f1b03c5f28fdc0ac46307966aacd6a0ab59956c045ca1b9503c` | Vascular effect read as fantasy/neon body cracks and the grip hands did not clear the protected crop. |
| Archon v1 | `exec-f43fdfe5-6bb4-48db-b295-4aba0c96aaab.png` | 1672x941 | `3f57d4a58e37991a4e4768dc2762ea9794edccc36a0baf9db38ed67c15fb7bbc` | Hypogriff rear anatomy remained avian instead of the locked horse barrel/hindquarters/rear hooves. |
| Archon v2 | `exec-3ea5c6e5-caba-425d-a7e5-ac456d0374c7.png` | 1672x941 | `b78522ed7bb843cbaa253eb511e17fe6b299d67ea2c9efeb377d934a41d96869` | Species plan corrected; rider control hand still sat outside/at the shelf crop boundary. |
| Archon v3 | `exec-4bec672a-4d9b-4228-8133-2006c9d41920.png` | 1667x943 | `d5a528c90f0efa1e578533bcb0c03c0075a7437582846a4bad326fb6c6bad2b6` | Hand placement improved but did not yet provide reliable complete-hand margin. |
| Cypherist v1 | `exec-a05e4063-4823-4d41-a88b-154806be3914.png` | 1671x941 | `cbdb09ea0c0a4d5bf68e8380bbe8adf93b89b13e86dc21cb256be41565f7f82b` | Working hand/actuator relationship clipped in the exact shelf crop. |
| Cypherist v2 | `exec-54b977c8-bbe6-4a9a-bfa3-9e10146dad5d.png` | 1671x941 | `3f9cb5d0e81b1123ad88619bad6bb53ca7186737e9a2cf7320038b586e45e20c` | Improved bench framing, but a defining working hand remained too close to/outside the protected crop. |
| Maverick v1 | `exec-67520c61-5d66-47be-9a78-9ac927bfebf7.png` | 1672x941 | `6e435f75d6c44d1a54c48089774af85c780b6653e91eccbe33eebb4d10d625d9` | Ember hand clipped in the exact shelf crop; Iron & Ember could not read cleanly without it. |

One attempted targeted Surger edit was refused by the generation safety filter and produced no file. The run continued with a fresh, more restrained phase-two Surger generation. This exception changes no source or final manifest count.

Mechanical composition trials `conduit-v4` / `surger-v3` (mirror extension without the final vignette) and `conduit-v5` / `surger-v4` (blurred side fill) were QA intermediates, not ImageGen outputs. The first exposed repeated side-field geometry at native inspection; the second exposed a blurred vertical strip. The accepted `conduit-v6` / `surger-v5` add the documented charcoal vignette and preserve the protected subject crops.

## Run-wide visual and canon QA

### Full-frame review — PASS

- All eight are action frames rather than neutral poses: breach hold, post-shot settle, mid-cast strike, powered swing, altitude flight, live command, active field service, and draw.
- The shared charcoal / wet grey / bone / muted rust / storm-blue family makes the run hang as one set without flattening the class-specific silhouettes.
- Each plate has only its motivated class color. There is no cross-contamination from another class's accent strong enough to confuse the shelf.
- Conduit and Maverick meet Gate 6b at full weight. Their bright sources are spatially motivated and do not wash out faces, hands, or equipment.
- Surger remains human and physically plausible at phase two; Archon's mount passes the locked eagle-front/horse-rear Hypogriff plan; Cypherist's frame remains inert machinery rather than an emotive robot.
- Women in Bastion, Conduit, Procurator, and Maverick are framed as decisive operators, never decorative observers.

### Exact shelf crop review — PASS

- Exact source rectangle: 706x941 from `x=483, y=0`.
- Eight of eight retain head, both required working hands, class action, and defining object/relationship.
- No class becomes a generic bust: ward/shotgun, optic/rifles, pool-light hands, hot rig/blade, mount/chorus, radial wheel/table, frame/tools/drones, and pistol/ember remain distinguishable.

### Dossier center-45-percent review — PASS

- Exact simulation rectangle: 752x941 from `x=460, y=0`.
- Eight of eight retain the same action locks with slightly more lateral world context than the shelf crop.
- No face, required hand, or class-defining object is lost.

### Stacked-banner simulation — PASS

- Simulation rectangle: 1672x557 from `x=0, y=115`.
- Eight of eight retain a readable action silhouette and their owned-color cue.
- This static pass does not replace live testing of the actual responsive layout.

### Authenticated live-browser review — PASS

- Target: `https://habitat.martinobear.com/codex/classes` in the authenticated in-app browser session.
- Shelf: all eight class cards completed image load at intrinsic 1672x941; no constellation fallback path text remained; no warning/error console output appeared; the mobile shelf retained all eight plates with no horizontal overflow.
- Conduit dossier at 1500x900: hero rendered at 539x418 and retained the face, both casting hands, lantern light, and siege geometry.
- Conduit dossier at 720x900: stacked hero rendered at 676x240 with `object-fit: cover` and `object-position: 50% 25%`; the class action remained legible and there was no horizontal overflow.
- Conduit dossier at 390x844: stacked hero rendered at 346x240 with the same fit/position contract; the class action remained legible and there was no horizontal overflow.
- The QA browser was returned to the class shelf after verification.

### Zero-text, logo, identity, and access review

- **Zero text / logo: PASS by native visual inspection.** Shipping plates contain no readable text, letters, numbers, pseudo-writing, labels, captions, UI copy, watermarks, branded marks, heraldry, or shaped insignia. Plain mechanical geometry and the Procurator's blank physical radial wheel are allowed nonlinguistic forms.
- **Identity separation: PASS.** Faces, ages, body types, silhouettes, equipment, motion vectors, and environments are distinct across all eight. None is claimed to be an existing named character.
- **Canon status: PASS.** Art publication does not make a class representative CANON, does not assign a fixed class to a named person, and does not collapse class choice into species, sex, origin, or background.
- **Static private-resolution audit: PASS.** Assets exist only under `apps/web/private/codex-art/classes`; shelf and dossier resolver calls are convention-based; the existing authenticated art route is the only delivery mechanism; constellation fallback remains in place.
- **Unauthenticated live route check: PASS.** `curl.exe -s -o NUL -w "%{http_code}" "https://habitat.martinobear.com/codex-art/classes/bastion.png"` returned HTTP `404` without browser-session credentials, preserving private-art non-disclosure.

## Regression and runtime gates

Status is recorded per gate so static image QA, automated validation, and runtime evidence remain independently auditable:

1. **Focused class-art regression test — PASS.** `apps/web/lib/class-art.test.ts` asserts the exact eight talent-class slugs and PNG inventory, convention-path resolver round-trip, non-empty private files, and exact 1672x941 sRGB 8-bit RGB24/no-alpha metadata.
2. **Relevant existing test suite — PASS.** `pnpm --filter @habitat/web exec tsx --test lib/class-art.test.ts lib/codex-art-privacy.test.ts lib/dossier-art.test.ts lib/talent-trees.test.ts` passed 21/21. `pnpm --filter @habitat/web typecheck` passed, and `pnpm --filter @habitat/web exec eslint lib/class-art.test.ts` passed with no findings.
3. **Authenticated live shelf QA — PASS.** All eight thumbnails replaced constellation placeholders; all loaded at native 1672x941 with no fallback path text, console warning/error, or mobile horizontal overflow.
4. **Authenticated live dossier QA — PASS.** Conduit passed at 1500x900, 720x900, and 390x844 with the dimensions and responsive behavior recorded above.
5. **Unauthenticated privacy QA — PASS.** A credential-free direct request to `/codex-art/classes/bastion.png` returned HTTP 404.
