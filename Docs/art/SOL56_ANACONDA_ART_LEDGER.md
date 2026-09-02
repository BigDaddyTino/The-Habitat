# SOL 5.6 — The Blackweir Anaconda art ledger

**Status:** ACCEPTED, INSTALLED, AND VERIFIED — 25/25 plates

**Commission issued:** 2026-09-02

**Asset execution completed:** 2026-09-02

**Authority:** `Docs/art/SOL56_ANACONDA_ART_PROMPT.txt`
**Canon:** `Docs/bloomfall/BLOOMFALL_BLACKWEIR_ANACONDA.md`

## Acceptance summary

- Commissioned and installed: **25/25 plates** — 2 figures, 3 scenes, 3 spoils, and 17 ability tiles at the exact named private paths.
- Format gate: **PASS — 25/25** decode as non-palette, 8-bit RGB/sRGB PNGs with no alpha. The eight large plates are exactly 1672x941; all seventeen tiles are exactly 256x256. All final SHA-256 values are unique.
- Visual gate: **PASS — 25/25**. The set uses peat black, wet steel, bone, sick filtration green, and localized Blackbloom violet. No final contains visible writing, labels, insignia, UI, brass, coin-warm gold, rainbow Essence, collage framing, or gratuitous gore.
- Story-lock gate: **PASS**. Vey remains attentive and clinical; Phase Two is infrastructure-scale with one tiny amber-lit adult; the transformation is violent without anguish; and the catalogue derives its horror from intact repetition.
- Crop gate: **PASS — 8/8 large plates**. All defining reads survive the exact centered 564x941 directory crop; Phase One also keeps face, both hands, and torso inside the centered 1122x941 character crop. Nothing essential falls in the bottom ten percent.
- Tile gate: **PASS — 17/17** at the commissioned 96px stress size and the live page's stricter 44x44 implementation size. Each remains a distinct single-action silhouette in one lighting family.
- Resolver and coverage gate: **PASS**. All paths round-trip through the authenticated private resolver. `audit-codex-art-coverage.ts` reports `bosses: 20/20 mythic plates present`, and the character, creature, and item shelves all include their commissioned plates.

## Plate ledger

One row per commissioned plate. `revised` means at least one generated candidate was rejected or
superseded during visual QA; the reason is stated in the row. `refused` means a generation tool
declined the subject — the row records the refusal and retains the full spec, per house law.

| Plate | Final path | Status | Bytes | Final SHA-256 | Accepted generated source / source SHA-256 | QA and revision record |
| --- | --- | --- | ---: | --- | --- | --- |
| Phase One — the Mire Stalker | `apps/web/private/codex-art/characters/elias-vey.png` | **revised** | 2,206,397 | `99e3b3333d9816b0de8678b5e0003ba2f58fb1772afb1ab0b1065f2c4cdcfb00` | `exec-a983bc5e-4023-4c6a-b5ec-f208ceba00af.png` / `0c0f53c15080ee2f9b03bdff3be8c6aa77abd5879426214ae0cea8cc230209bc` | Accepted v4: legless serpentine anatomy, calm measuring expression, long forelimbs, rotted coat fragment, and sparse fused hose/harness remnants. |
| Phase Two — the Blackweir Coil | `apps/web/private/codex-art/creatures/the-blackweir-anaconda.png` | **revised** | 2,131,845 | `5a348c35ff3e2ec6051a75e774ec3d67905cb35f9f2bdd3dbad7485aadfeac50` | `exec-54653b1a-37aa-480d-913f-5095dc45c784.png` / `534ad1cd5e1a5b8e1c6bccb0ab572a9a17293f0083645580b27c19d5bfff63d0` | Accepted v3: unresolved infrastructural coils, complete calm head, blank plates, and the only amber-lit adult all survive the exact center crop. |
| The Fight Ground | `apps/web/private/codex-art/bosses/blackweir-arena.png` | **delivered** | 2,362,925 | `3ac016802ab865ce91f78271107696eed53a33e980d401afd3f4116ad130cee4` | `exec-fd86fd6b-ed64-4779-817a-b1ac91c3af4a.png` / `2d85e74a362a813eaa7c376c965d4dd35e657ee40d5482a4da014c6afb112187` | First attempt: empty flooded weir interior, broken rail beds, walk/swim depth changes, vent plumes, and local banded pylon sources. |
| Letting Go of the Shape | `apps/web/private/codex-art/bosses/the-transformation.png` | **revised** | 2,225,308 | `55cf61f368a3664b27a3c759e7a6d69dcdca126575241204b78bec551ec2a910` | `exec-df361ff3-13ef-4aff-909e-249812944b6f.png` / `57b1ee88d8a5b8954fc0cda4a3e1e40f354c248ed8b85d79b3bc44615c50f48b` | Accepted v4: continuous long body, complete composed head, two diminished forelimbs, loaded pylons, and one empty two-sleeved coat survive the crop. |
| The Specimens | `apps/web/private/codex-art/bosses/the-catalogue.png` | **delivered** | 2,025,649 | `0b8f51f4c3093417c7377bdebce229234131b0c164b948adc6acfecc3847df8e` | `exec-c57e94fe-8618-429e-9d66-3b8bbde80fcc.png` / `6de1e20622ca9a707d4da3d4a2d0dfa919fb9b74ba127d519ff13f6e6051172c` | First attempt: intact adults in one unending repeated row, blank throat discs, clear shallow water, no creature, damage, or gore. |
| Blackweir Heart | `apps/web/private/codex-art/items/blackweir-heart.png` | **revised** | 2,001,168 | `fecf17c341c6ad75eb7bbb680b823683d53721eb27f35ad07f3aef71e6f58cc6` | `exec-3bcd747b-5cfd-4998-a26c-32502cc882b6.png` / `467797220d47234cf78ec83d7f35adfbf3c0e9cac0134e1a84fe2323a7279545` | Accepted v2: upright barrel-scale filtration organ, chamber-banded and root-threaded on tarpaulin, with dim violet seams and a complete crop-safe silhouette. |
| Anaconda Hideplate | `apps/web/private/codex-art/items/anaconda-hideplate.png` | **delivered** | 2,525,047 | `15a296313b7cd76f3e85e6909c6aa9d07c3408e60503dd2e9a63860d514c2e18` | `exec-27d5fdac-5244-4a14-9399-d03ec33cd1fd.png` / `5a3e353ff2fdb08207475a47711bb5ae9c42ace38a387392b86028a08b7bfc9a` | First attempt: one shield-scale biological lamination, reactor-pitted with resin between layered edges, propped against wet steel without armor fittings. |
| Mutated Fang | `apps/web/private/codex-art/items/mutated-fang.png` | **revised** | 2,127,081 | `2c3ceeb496c50635a56efbae354402674a659b7ae7294ce826fa2350545a57ef` | `exec-25cabaa6-ccfb-4cca-8044-468764e0389f.png` / `6a3294e9cca916f4597d303c0531bbb65a61851173e41d3c99b01c5a47fa3194` | Accepted v2: one near-vertical forearm-length recurved hollow-root fang with repeated mineral bands and unmarked tools, entirely inside the center crop. |
| Foreign Material | `apps/web/private/codex-art/bosses/ability-foreign-material.png` | **delivered** | 87,782 | `39c372fce37c9b4f3e4cc376178d9e3ee1690d5677587af9359fd4acf08fd6c2` | `exec-868914ff-73b3-4f36-b140-51a6c3f6c264.png` / `4b1524c3392f8961b39d7b6bbbd07f75c25b14262fb5612938918d96e0803b17` | Blank bone-resin specimen disc held by one black coil; clean circular read at 44px. |
| Prisma Re-Roll | `apps/web/private/codex-art/bosses/ability-prisma-re-roll.png` | **delivered** | 89,354 | `6bfeb8198f048b7a6f2d2d20f0b9b6656d4809e229039ed57eda1af7529a20b9` | `exec-94750e1a-b12e-4604-94dc-c39f8c7c11f0.png` / `14e1241f0bde63898be3ac5a8458e55fa2bd665541544cee76adf08e07fa7c3d` | One banded scale refracts one white source into exactly five unequal violet bands, one visibly open. |
| Pylon Draw | `apps/web/private/codex-art/bosses/ability-pylon-draw.png` | **delivered** | 78,793 | `691ae825b6551caee7910e58176aea0a34adc6aed7be36a822e2db8adf946e98` | `exec-a264e2c0-6746-4e3b-868e-572575526f5f.png` / `d30a778115e9dacd022efe6ca4de1f017d82ee8a8fadf2e0b5b019f78c1f261d` | Single standing pylon and unmistakable downward violet discharge into green-underlit black water. |
| Reactor Weather | `apps/web/private/codex-art/bosses/ability-reactor-weather.png` | **delivered** | 83,220 | `80cad7f51aa0ae055df33951367df0eb196178b967c934b3f33e2a28e4cc2616` | `exec-8f9561ae-58a8-41ca-84a1-ed1e00233e69.png` / `241e4440417c07b698e2aee57476eed7670f1abb32f884b5dc7564b858040eb4` | Hostile green-underlit plume front dominates a small Blackweir basin and broken causeway. |
| Lunge | `apps/web/private/codex-art/bosses/ability-lunge.png` | **delivered** | 130,205 | `b4a74a124893146b75bafa68b01c7e4236d9a2ec70e03ecaa4cae2b6f6c49bdd` | `exec-59501f9d-1af7-471f-ae30-58d564410ab4.png` / `74f65bff76a41aa2460db5c67c8ce3b1c85e7fec3bb06dfc1ad35feba8dc58ec` | Low closed-mouth head, two long slashing forelimbs, and an explosive diagonal waterborne reach. |
| Tail Whip | `apps/web/private/codex-art/bosses/ability-tail-whip.png` | **delivered** | 111,190 | `2d432ee2d3f1a8416aab3e05a433399eb7309ee6c91068a727bdec9ae2ca1475` | `exec-76ac81d2-cddd-4088-8a20-55665a5c88be.png` / `b55fd1b55ef121522cb8931e90678766e7a15f073e19411261309417fd852cf6` | One broad low armored tail crescent and a single cold spray fan. |
| Acid Spit | `apps/web/private/codex-art/bosses/ability-acid-spit.png` | **delivered** | 105,485 | `b16d82fc813b54aee4b8434a908ff06304d92389a3e1fccbe58752458a938392` | `exec-a787e0ea-c518-4788-aa28-ebe3b1353792.png` / `d72a91eaa45d8b8df081c3156323f75926dce7e2c3f193b3ce6f46656d7087ca` | One black-green corrosive stream and compact pool visibly eating a single rail tie. |
| Ambush Dive | `apps/web/private/codex-art/bosses/ability-ambush-dive.png` | **delivered** | 56,161 | `a1936bff6c7ee046d3059f5014be0af7446dd28e3080b3087d370f12661e12dd` | `exec-ef472f72-a2ca-46eb-94b9-f16dc91ab380.png` / `df47dc01cade37565b963e65422addffbe13b75a548b67bf1caa5b8238416737` | One plated rear-body arc disappears into black water through a tight spray crown. |
| Shedding Strike | `apps/web/private/codex-art/bosses/ability-shedding-strike.png` | **delivered** | 93,057 | `500a4cd23a904d9458e0af6ec8a381312122de44cbee09794466f38af5e104e0` | `exec-39110164-9cf0-44d5-9707-0e291f4e2c4c.png` / `b7cf32f4c1fd073e6462423f3ecc177476810ed3d82a67fb53e42d6452fb9969` | One clawed swing with exactly three broad hide sheets releasing behind it. |
| Grab and Drag | `apps/web/private/codex-art/bosses/ability-grab-and-drag.png` | **delivered** | 106,063 | `8a5f59ca449b62b70a9f0065f0e21c763a22ba58d1d7a674aff52fdc4d4e28b3` | `exec-6957e6b3-6a5f-41fe-9de7-ceceef36e590.png` / `8eb9e2e6f986f6a92287aef08eee4d6641f0923b65c87ce0aa20d32721207609` | One scaled coil closes around a steel causeway handhold while water pulls hard to frame edge. |
| Devouring Surge | `apps/web/private/codex-art/bosses/ability-devouring-surge.png` | **delivered** | 124,297 | `05f02b5003d321b7e2d864b7e66e71d31986b9ab2c5584dd5a94b73fbfa88b96` | `exec-a96a7848-8b9a-4d8a-85a3-231f85dc684f.png` / `69a639f2f25e58ca7ac92c65ffff77d95ef150cd3f44b3100e5832ddbcc7b3c6` | Colossal closed-mouth head drives straight through a causeway in a centered V of slabs and water. |
| Coil Crush | `apps/web/private/codex-art/bosses/ability-coil-crush.png` | **delivered** | 93,440 | `5ea7c503f24f9f9b83c7f27d4ba5ded562d678fcc2caa2cdbd6bfe3ebfac0fa7` | `exec-2c82ad35-a164-4d6b-85f7-2775baa2c004.png` / `7cc1c94674d5f87dc878ae930f9e4bad99d3c5ef4af52a8416ba1c2098b6dbc0` | A near-closed plated ring visibly bows one trapped channel-gate support. |
| Toxic Flood | `apps/web/private/codex-art/bosses/ability-toxic-flood.png` | **delivered** | 110,425 | `14a2bdbfb2fcef6eafbe532de1f557bc32742af5b2638a9e461397043e6c9ca9` | `exec-b9c7f029-c635-4f6a-8d89-ec7ffa01fcfd.png` / `b5803e01787faa94214f4fff282a96ddf4359d2ab68814a10b21a3c6804656e5` | Dense peat-black advancing flood front fills a concrete channel with one sick-green subsurface edge. |
| Tail Tsunami | `apps/web/private/codex-art/bosses/ability-tail-tsunami.png` | **delivered** | 107,740 | `e9e22e91d6fd78728cc0600239e8ca5c9757875fb93262bb76a9644520507482` | `exec-470a843b-c011-427d-ad90-c1fc056456aa.png` / `acd279800ebe495c6994ec126cde56a404a4f2543dae854b5b5e8c4f1ebd4e68` | A distant colossal tail drives one arena-wide vertical wall of real water over a causeway. |
| Bile Eruption | `apps/web/private/codex-art/bosses/ability-bile-eruption.png` | **delivered** | 93,433 | `e6b1c0eba4a5c0cba945cea4adc02b5a08104da0c26146f30cc179e5445e119c` | `exec-63a9ece7-19fc-48d0-a631-8c9bf8be861c.png` / `12a257fa0df385f0bfaab7c25583e7e5dc15414fa1d8f1c4dde0efec7c26313b` | One compact black-green geyser rises from an underlit cracked resin bed. |
| Venomous Roar | `apps/web/private/codex-art/bosses/ability-venomous-roar.png` | **delivered** | 90,979 | `7270594c05ffad002b317f07ab90b43cfc5ff4b4136676e05e4dee86b18ea8c6` | `exec-aa1dd346-38b2-4d38-88e3-9acec2a02876.png` / `914ef08e029884d22bcad90874335acda40206c60c3e6896a5eb9bae48cabcfe` | A clinical colossal head drives a pressure-cleared wedge through physical vent vapor, with no magic beam. |
| Submerged Stalk | `apps/web/private/codex-art/bosses/ability-submerged-stalk.png` | **delivered** | 63,264 | `63cc22fdc163b6a9d32b015fcc76ea5b32eaac5c2c4bde4a3079070b06747d02` | `exec-bae387cc-a07f-4100-947d-f8f311936abb.png` / `d9d0e7ed111284a4f66979d661db8776ab232f6e422addb1ec5d44a3a322445d` | Still black channel water is broken by exactly one centered V-wake and a dim submerged violet trace. |

## Explicit non-commission

- `apps/web/private/codex-art/regions/blackweir.png` already exists and is **not** replaced. The
  arena plate is a separate slot under `bosses/` because it is the same place at a different hour
  and water level, shot from inside the fight rather than from the road.
- The two-phase dossier layout itself is **not** commissioned as an image. It is built as a real
  page at `/codex/bosses/the-blackweir-anaconda`, because the zero-text law makes a
  generated infographic impossible and because real text is searchable, themeable, and editable.

## Refusal and revision record

- **No ImageGen safety or moderation refusal occurred.** The human-derived plates were prompted
  from non-human anatomy and environment first, as commissioned; their content was not softened.
- `elias-vey` v1 was superseded because the intact vest and symmetrical build read too close to a
  conventional armored snake-person. V2 corrected the anatomy but lost too much research
  provenance. V3 over-corrected with rigid shoulder guards. Accepted v4 keeps the long, legless,
  composed organism and only sparse asymmetrical coat, hose, strap, and blank-fitting remnants.
- `the-blackweir-anaconda` v1 put the human outside the narrow crop; v2 moved the only human and
  amber source correctly but still clipped the head. Accepted v3 keeps the complete head,
  neck-to-coil junction, blank plates, and the scale figure together in the exact center crop.
- `the-transformation` v1 remained too upright and left an ambiguous body-shaped clothing heap.
  V2 established the long body and empty coat but only one withdrawing forelimb read. V3 restored
  both forelimbs but clipped the snout in the center crop. Accepted v4 keeps the complete calm
  head, both diminished forelimbs, continuous body, loaded pylons, and empty two-sleeved coat.
- `blackweir-heart` v1 read at full width but became a strapped cargo bundle in the narrow crop.
  Accepted v2 is an upright, complete, asymmetrical filtration chamber with loose lifting straps.
- `mutated-fang` v1 lost root and tip in the center crop. Accepted v2 turns the single hollow-root
  fang nearly vertical beside the same unmarked extraction tools.
- The remaining **20 plates** were accepted on their first generated attempt.

## Canon and live-entry discrepancy record

- The attached commission and `Docs/art/SOL56_ANACONDA_ART_PROMPT.txt` are text-identical after
  newline normalization. `Docs/bloomfall/BLOOMFALL_BLACKWEIR_ANACONDA.md` remained the visual
  authority throughout the run.
- Canon describes sequential specimen-disc numbers beyond three hundred, while the plate law
  explicitly requires blank discs. The catalogue uses visually blank discs; searchable HTML copy
  carries the numbering. No tiny or pseudo-legible marks were introduced as a compromise.
- `lib/mythic-dossier.ts` calls the prototype failed even though canon's point is that it worked.
  The art follows canon: Vey is an operating filtration organism, not a failed experiment.
- The authored kill ending currently grants both Aegis and Warden satisfaction despite canon's
  three-way issuer conflict. No plate illustrates an issuer outcome, so the art remains neutral.
- The boss dossier applies harvesting consequences to every reward, while canon makes Hideplate
  and Fang clean drops. Their plates are neutral recovered specimens, not functioning organs torn
  from the active weir.
- The page shortens `Stabilization Cycle` to `Stabilization`; the zero-text images encode neither.
- Creature metadata lists Heartfen and Drowned Intake as biomes even though canon denies Vey
  control or reach there. Every commissioned environment is unmistakably Blackweir.
- Existing convention provenance says `Mythical creature`, while canon distinguishes the Mythic
  designation from a mythical species. The creature plates stay grounded, engineered, and
  human-origin rather than mythological.
- Canon section 17 omits Mutated Fang from its new-entry list, while section 14, live data, and the
  commission include it. The plate follows the latter three sources and is delivered.

## Generator, normalization, and retained evidence

- Generator: **OpenAI built-in ImageGen**. Every distinct initial plate and every targeted revision
  used a separate generation/edit call. The controlling prompt set is the issued commission at
  `Docs/art/SOL56_ANACONDA_ART_PROMPT.txt`; execution prompts expanded its per-plate constraints
  without changing the subjects or visual laws.
- Machine provenance: `tmp/sol56-anaconda/manifest.json`. It records all 35 generated attempts,
  accepted and superseded source IDs, raw/final SHA-256 values, byte counts, metadata, dispositions,
  and QA notes. Raw generated sources are preserved under `tmp/sol56-anaconda/raw/` and at the
  recorded Codex generated-image root.
- Mechanical publication operation: Sharp Lanczos3 normalization to exact commissioned geometry,
  alpha removal, sRGB conversion, and non-palette 8-bit RGB PNG encoding. No generative content was
  silently repaired by scripted paint-over.
- Retained visual QA: `tmp/sol56-anaconda/qa/wide-finals-contact.png`,
  `wide-center-crops.png`, `elias-centered-1122x941.png`, `tiles-256-contact.png`,
  `tiles-96-contact.png`, and `tiles-44-contact.png`. The closest pair under a coarse 64-bit
  average-hash comparison still differs by eight bits; all cryptographic hashes are unique.

## Validation record

- `pnpm exec tsx scripts/audit-codex-art-coverage.ts`: **PASS** — `bosses: 20/20 mythic plates
  present`; character, creature, and item shelves include all five dossier/spoil entries. Its two
  remaining Codex gaps are unrelated pre-existing faction/flag commissions.
- `pnpm test` from `apps/web`: **PASS — 582/582** tests, including all seven commission-specific
  inventory, resolver, decoded-metadata, duplicate-hash, ledger, page-wiring, and live-44px guards.
- Workspace `pnpm typecheck`: **PASS** across all seven projects. Workspace `pnpm lint`: **PASS**
  with zero errors and one pre-existing `@next/next/no-img-element` warning on the class directory.
- Workspace `pnpm build`: **PASS**. Next compiled, typechecked, and generated all 71 static pages;
  its existing private-art dynamic-trace warning remains non-blocking.
- Anonymous direct access to the local private creature route returned **404**. In the owner's
  authenticated Chrome session, all **25/25** production `/codex-art` endpoints loaded at their
  exact native dimensions (eight 1672x941 and seventeen 256x256), and the Phase Two hero rendered
  cleanly with no browser warnings or errors.
- The authenticated production dossier URL currently returns the Habitat **404** page because the
  running production application build does not yet contain the authored Mythic route. Therefore
  desktop/mobile page-layout QA is deliberately **not claimed**. This art-only delivery does not
  deploy or restart production; source-level page wiring and a clean production build are verified.

## Publication boundary

Every path in this ledger is under `apps/web/private/` and resolves through the authenticated
`/codex-art` route. The dossier and boss page pick the files up on reload. Art delivery changes no
StoryEntry, authoring database row, frozen game release, public asset, credential, infrastructure
address, or server-control surface.
