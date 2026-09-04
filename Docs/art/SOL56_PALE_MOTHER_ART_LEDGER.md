# SOL 5.6 — The Pale Mother art ledger

**Status:** ART PACKAGE ACCEPTED, INSTALLED, AND VERIFIED — 22/22 plates

**Commission issued:** 2026-09-04

**Revision A issued:** 2026-09-04, while the original 20-plate pass was already running

**Asset execution completed:** 2026-09-04

**Authority:** `Docs/art/SOL56_PALE_MOTHER_ART_PROMPT.txt`

**Canon:** `Docs/codex/GRAND_RIFT_THE_PALE_MOTHER.md`

**Machine record:** `tmp/sol56-pale-mother/manifest.json`

## Acceptance summary

- Commissioned and installed: **22/22 plates** at the exact Revision A paths and in its exact order — 11 wide plates and 11 ability tiles. Four first attempts are recorded as **delivered** and eighteen plates as **revised**.
- Format gate: **PASS — 22/22** decode as non-palette, opaque, 8-bit RGB/sRGB PNGs with three `uchar` channels and no alpha. The eleven wide plates are exactly 1672x941; the eleven tiles are exactly 256x256.
- Uniqueness gate: **PASS — 22/22** final SHA-256 values and all 64-bit average hashes are unique. The closest average-hash pair is `settled-plate` / `cage-rib`, still separated by seven bits.
- Generation-history gate: **PASS — 55/55** generated attempts are preserved under `tmp/sol56-pale-mother/raw/`, with source and preserved-copy hashes reconciled in the manifest. There were no ImageGen safety or moderation refusals.
- Crop gate: **PASS — 11/11 wide plates** were reviewed at the exact centered extraction `x=554, y=0, width=564, height=941`. The retained contact sheet records that exact crop rather than an approximate portrait crop.
- Tile gate: **PASS — 11/11** were reviewed at native 256px, the brief's 96px stress size, and the current source implementation's stricter 44px size. `apps/web/app/codex/bosses/bosses.css` currently specifies the icon column and icon box at 44px; both the commissioned 96px target and that source-level CSS size remain legible in the retained contacts.
- Visual gate: **PASS — 22/22** against the plate-level QA recorded below. Death Canyon is violet heavy gas over cold blue-green fissure light; the Mother remains a faceless, wide, low fitted arachnid; the Brood is concealed except where the Vents plate deliberately reveals it; text-bearing surfaces remain blank; and no plate introduces gore, wound, or wet tissue.
- Publication gate: **PASS for private asset placement and resolver addressability only.** This is not a claim that a Pale Mother StoryEntry or Mythic page is live. The exact current integration boundary is recorded below.

## Plate ledger

One row appears for every commissioned plate, in Revision A delivery order. `revised` means at
least one generated source was superseded before the listed accepted source. The QA column is the
plate-level record stored in `tmp/sol56-pale-mother/manifest.json`.

| Plate | Final path | Status | Bytes | Final SHA-256 | Accepted generated source / source SHA-256 | Manifest QA |
| --- | --- | --- | ---: | --- | --- | --- |
| The Pale Mother | `apps/web/private/codex-art/creatures/the-pale-mother.png` | **revised** | 1,607,910 | `821ed570c825a0896fee516ed37e5a97a31a366cf7dbcef4d5b385ec9588f6e3` | `exec-6fc77265-ba18-4256-8648-60ff5cd53a1b.png` / `6f97df095c58a5639335261576c77dea06d22e09af4b6510caa6f0db212420bc` | Faceless, wide, low eight-legged fitted architecture; the closed ribbed cage is visible and occupied, pooled violet gas has a level surface, and cold blue-green light rises from fissures beneath her. |
| The Pale Brood | `apps/web/private/codex-art/creatures/the-pale-brood.png` | **revised** | 1,810,660 | `2546e5f142f764ac13ee6e4ef61a2a8108f0db2311e9e39f5282fed9d25e0b25` | `exec-9c176481-ea77-410e-9044-898792662d71.png` / `3f9b84617f82c79e3e39bde6bd6c54a1c59e381e1251511fa66c5cb45b2b8a4d` | The Mother is absent; the brood shares the gas's hue, value, and softness, while one complete sharp broodling and the wrong-moving gas remain legible in the center crop. |
| Wenna Crake | `apps/web/private/codex-art/characters/wenna-crake.png` | **delivered** | 1,915,743 | `40cf76d60be98c8f174cafca80290de441777e4848db46344f53e7cc2b6ba2f9` | `exec-53c132db-36b7-4ca0-9f94-b84217fafceb.png` / `d85e50e08823114aec00967f6dae7cbdb27f2b296350aec348bf28c364692c6b` | Calm, competent beacon-keeper mid-maintenance at a wet river outpost; amber and wet black only, with no canyon palette or horror-survivor staging. |
| Four Seconds of Seeing | `apps/web/private/codex-art/bosses/the-vents.png` | **delivered** | 2,215,350 | `176dcb3fac9b2cbfa2f6e888024205c78885cfb1b9124236a30820b342543c4b` | `exec-abf468e8-b55a-4982-a80b-536321b0c473.png` / `7765efc3d380ff58c66572027f637e7782b6e8a81e43fec1d30de16783a9ad9b` | A localized vertical vent flame reveals hundreds of brood shapes while inert violet gas closes around its base; no Mother appears. |
| The Fight Ground | `apps/web/private/codex-art/bosses/death-canyon-arena.png` | **revised** | 2,166,841 | `e0e0baadd82136b9c635276a16844936e1c49e1daa16548ce26fd30a7431425f` | `exec-f51b441f-fdd2-4e2e-b457-96e5809658d8.png` / `163ec9b261893ddea87ba42581611ea0d1ed8711ee971eaee2625ee2af7b0731` | Empty dry geology with three readable heavy-gas depth bands and blue-green fissure underlight; no creature, water, structure, vegetation, or reality failure. |
| The Cage Opens | `apps/web/private/codex-art/bosses/the-cage-opens.png` | **revised** | 2,041,707 | `efaf711d764ff1ce69b19e1402638579c4d3bc50ca491b9e95c7bcfb3da5b1e3` | `exec-66cc325d-4b43-4521-9240-309b58e0e292.png` / `306627804bf17df69bbcc920f1be0db95792466a1bcc0c32ca438a62917e57cc` | The dead-center ribbed underside hinges open onto packed blue-green-lit density; the Mother remains faceless and non-dramatic, with no wound, fluid, gore, or wet tissue. |
| The Quiet | `apps/web/private/codex-art/bosses/the-quiet.png` | **revised** | 1,864,947 | `8e6e456a9015a807eef3bbd26d1e341a1c23a4d3b18ac146080086af8171d71c` | `exec-647844b3-35c7-4ce1-a382-0c519bd1d176.png` / `cf062b99836298d55ac839b28b30dea378f5cd3fe621bb66d4cc6ec6fb686c45` | An almost-empty frame whose decisive feature is one straight line of tiny disturbances at a calm gas edge; two small figures and their lamps remain at frame right. |
| The Tally | `apps/web/private/codex-art/bosses/the-tally.png` | **delivered** | 2,313,788 | `248173806b5cbecf62546ccac94dc562c8201b6119e386eb787cd9d2a9565ac8` | `exec-a35e61d1-3da5-43c1-bbe5-d02e2671f00a.png` / `a0fd8a58dee7534d4573d1d3080c0926c4a22ec0a353fb14184953a782d9f2d5` | A reassuring, orderly river-freight landing in amber and wet black only; all tags and boards are blank and no bone, creature, violet, or blue-green appears. |
| Settled Plate | `apps/web/private/codex-art/items/settled-plate.png` | **revised** | 1,900,873 | `a0ab7b90d4b842b999cea04b7448cf201a55bd583d4f39d4d8f30a839a694a72` | `exec-5093279c-bb17-4ce9-a193-f904debf1524.png` / `dad318f26df5b3f131a06910e860e2ffa32f7705bc2709595b8e444a76163823` | One inert cart-wheel-scale curved mineral shield plate, chalk-dry and faintly banded, with fitted seating notches readable under field-object lighting. |
| Brood-glass | `apps/web/private/codex-art/items/brood-glass.png` | **delivered** | 2,027,897 | `60d4c629354dc1c8bb4ea1efedca66e875edd091a4f4ab491d623cd0ed7e4bd7` | `exec-06569ed7-a15e-4f9b-a8ac-0c06191795d2.png` / `9294c9f8537ace5b6d0de45884a748ec227aed889af19156b16cf5de67bd6dc3` | A great many irregular clear mineral beads, some smoke-clouded, lie on dark cloth beside their scorched collection tin with restrained cold and warm points. |
| Cage Rib | `apps/web/private/codex-art/items/cage-rib.png` | **revised** | 1,062,914 | `d984e493e2c843e29528247a3a67d92a68074f02597841536ae9b6ce47e30fca` | `exec-b02b42e4-bbec-4889-b82f-fe4511d72773.png` / `4ce0f987f915e4e50bc24a78633b93fd4db92ef314698c03188dc46119b29a6a` | One person-taller curved mineral rib lies across trestles with regular inner-edge fitting notches and no attachment, fluid, or glow. |
| Sweeping Foreleg | `apps/web/private/codex-art/bosses/ability-sweeping-foreleg.png` | **revised** | 117,156 | `cc8766df1971fc70b306bc70db1f31271b5b8ecb6bd21bc06eb9784ce0c59280` | `exec-eff58fdb-4cae-4b8e-99c8-a683d41fe1f7.png` / `7dd1f99ea50c971e967de515c46f88c470c0021956547a9a611b38feb93e93a4` | One plated foreleg makes a low flat arc through pooled gas, which parts behind it at 96px and 44px. |
| Shed Plate | `apps/web/private/codex-art/bosses/ability-shed-plate.png` | **revised** | 96,353 | `2513e8cdb31c6b1e77cfb824ca5ff1dc01695148139f885950d820866bdf46d6` | `exec-e4a0590e-4231-4cbb-bd10-2f905e00a97f.png` / `268ca962f74a87924c43a905c254e8d8285e7591e11b183ae310cded083588e8` | One shield plate falls free and leaves one unmistakable empty socket beneath it. |
| The Drag | `apps/web/private/codex-art/bosses/ability-the-drag.png` | **revised** | 74,077 | `e9390a2ff6a2d8af0bb204097c59d1f59172a462804be5f85984a859e06cf463` | `exec-442ad6a8-e92f-4754-8f5c-688b50165836.png` / `5b85b7001aceb4fdec5eca250d9ad53cedbad9f7085180cdb2f40de00eda4a6e` | One foreleg reaches from an opaque gas wall into clear air, with no body or second subject visible behind it. |
| Fissure Step | `apps/web/private/codex-art/bosses/ability-fissure-step.png` | **revised** | 98,918 | `0e4a056eb158fceb9466ed6109556e83bb2dee632ce04332d99e2561783a1d20` | `exec-cf6befbe-afb3-452c-b06d-ee2cf41f529a.png` / `61de27d58641651c7d9004b3445e144a88ee049187e2deb305fbe034cfa77dd2` | A pale low mass disappears into deep gas with only the near two legs still readable. |
| Settle | `apps/web/private/codex-art/bosses/ability-settle.png` | **revised** | 105,556 | `d2f87cf6e12558024fbd7be665f23d2cc205aae346c5b434e887dbdda690cc85` | `exec-f72b7d4e-d5a0-4228-81e4-35101e2b8ef7.png` / `a13bd681400d9a8d218909228607213dc505b0cb944b4dc010adac28985b6985` | A hollow ribbed underside deliberately smothers a burning vent, crushing the flame sideways; it reads as putting a light out, not resting. |
| Cradle Slam | `apps/web/private/codex-art/bosses/ability-cradle-slam.png` | **revised** | 94,613 | `0945396999123928203af3f6ebd954663fde05aad74740559848a22e4cafd72d` | `exec-5e450397-9df8-460d-a569-4657383eb544.png` / `dd2fb6242917c533706a3aa2dc38ee8d079a5c72fd83c0b7ce6a37577f046682` | The whole low body hits stone and drives one flat outward dust ring and displaced-gas disc. |
| Opening the Cage | `apps/web/private/codex-art/bosses/ability-opening-the-cage.png` | **revised** | 116,747 | `ea41d53ea7395d4b4aa0a41021e09de87d5de326ce858550c9e05e6a0e1d0dd1` | `exec-24c7aaeb-f6a4-4cb6-bdc6-b8c8904a912c.png` / `5040069ec2769de1b5472f93b8f552e362a40e16cf378aa86752caf01bcfa03b` | Ribbed underside plates hinge apart onto packed density with individual small forms resolving at the seam. |
| Gaswalk | `apps/web/private/codex-art/bosses/ability-gaswalk.png` | **revised** | 78,695 | `83eebc041e96ebebaddc6566205ec4c431b1153ca145a16f3b1059cee447eae9` | `exec-f2acee33-cc80-43a0-ab03-199187c321b0.png` / `a5988ea0cca644f483753a39ff4ad7ed9a4b473862861a2858f1bd32cbb74a7b` | A calm violet gas surface carries one straight even disturbance line and no revealed creature. |
| Climb | `apps/web/private/codex-art/bosses/ability-climb.png` | **revised** | 97,439 | `cfb15de41f4af001495936c8d4370f0214a4501ae852f3f8713f82add015d732` | `exec-674e15f1-1d3e-43eb-89a0-ced549fd4eab.png` / `508c112d407293367418d31a33b67aa0b38b0c33a322eba3c106e23586eb9ff3` | A cropped boot and shin carry four hand-sized pale climbers above the ankle, with no injury, blood, or person above the knee. |
| The Quiet | `apps/web/private/codex-art/bosses/ability-the-quiet.png` | **revised** | 122,947 | `18f445573833d59e94a6e95269154cddbb72edff07de9c42303a2d474f3d72a5` | `exec-f93f48ac-be4e-4360-a333-ca45c793355b.png` / `a6fbbcc81142e3e9792bf832dab6a9beb79329040b77b071e10b5b94f4bbfdab` | Small shapes block a single blue-green fissure mouth so its light goes out in separated pieces. |
| Reassembly | `apps/web/private/codex-art/bosses/ability-reassembly.png` | **revised** | 95,390 | `858edc0378bc8eb87c9af5010b4d6d97c2105a323c728c2b3f3939652b14ac7d` | `exec-83570192-4926-447f-96c6-49e2e798a725.png` / `04a2368effd9f5a6cda7b9b21156b5d9e166fe9d8e8dfac9341326f0b0235b23` | Two hand-sized pale spiders carry one large shield plate between them across dark stone. |

## Revision A execution record

- Revision A arrived while the original pass was in flight. It changed every Death Canyon fissure source from the superseded yellow-green register to cold blue-green marsh-teal, added `characters/wenna-crake.png` and `bosses/the-vents.png`, and replaced the subject of `bosses/ability-settle.png`. Earlier yellow-green generations remain preserved as superseded attempts; the final set does not mix the two registers.
- `the-cage-opens` was owner-accepted on subject before Revision A and became the set's structural reference: the centered hinged ribbed cage and packed interior were correct. Its accepted-subject source was superseded solely for the palette change; the final preserves that subject in blue-green light.
- `the-pale-mother` required a subject rebuild because the early hero omitted the encounter-defining closed, occupied cage and rendered the gas as mist rather than a level heavy pool. After the cage and heavy-gas read were established, the last owner direction was scale/composition only: keep the accepted subject and palette while reducing her enough for the exact 564px center crop. The final retains the cage, faceless architecture, level gas, and amber scale lamp together.
- Wenna Crake and Four Seconds of Seeing were the two new Revision A plates. Both were accepted on their first generated attempt. Wenna is level, competent, and working rather than staged as haunted; Vents is the only plate where the Brood is intentionally plain.
- `ability-settle` no longer depicts rest over a fissure. Revision A replaces that source with the Mother deliberately standing on a lit vent and smothering the fire, so the tile reads as putting a light out.
- Full-resolution Vents review counts exactly **14 vent mouths total: 13 blue-green/teal mouths plus the central orange flame mouth**. The exact center crop keeps the flame column, the gas contact at its base, and the plain brood mass together. The gas itself is not shown burning.

## Brief and canon reconciliation

- The current Revision A attachment at `C:\Users\administrator.MARTINOBEAR.000\.codex\attachments\28b3627e-9a2d-412f-b4f5-33d5de2d5f83\pasted-text.txt` is 25,247 bytes with CRLF line endings and raw SHA-256 `f1832fa0a88313bc325a63f3b7e6739f99d96d0a4ce6cd8532bf5eff3b173f77`. `Docs/art/SOL56_PALE_MOTHER_ART_PROMPT.txt` is 24,817 bytes with LF line endings and raw SHA-256 `d376e0aa6a3127a64ca6f8d25c5eaa22c89b7baa18180c848f21eae82521c040`. They are text-identical after CRLF/LF normalization, and their normalized UTF-8 SHA-256 is the workspace hash recorded by the manifest.
- The earlier 20-plate pasted brief remains a superseded input. Attachment/workspace identity in this ledger refers specifically to the later 22-plate Revision A attachment, not that original brief.
- The canon document recorded by the package is `Docs/codex/GRAND_RIFT_THE_PALE_MOTHER.md`, 22,436 bytes, SHA-256 `17496fa79c4483c83f6ecf9eb701cc5890c299c285239bd6d12191b98e390f84`.
- The generic no-wet QA line yields to three explicit plate instructions: Wenna is at a drizzled, wet-stone river outpost; The Tally is a wet landing in drizzle; and Climb specifies a wet boot and wet stone. These are intentional setting details, not wet tissue, gore, wounds, or decay.
- The canyon two-light law likewise has explicit local exceptions in the brief: amber lamps carried or operated by people, the localized vent flame in Vents and Settle, and low warm field-object lighting for the three spoil plates away from the fissures. Wenna and The Tally are also explicitly off-canyon amber-and-wet-black scenes.
- The prohibition on “blue” is applied as a prohibition on a primary-blue wash. Revision A expressly makes the canonical fissure light a cyan-leaning cold blue-green marsh-teal; using that blue-green is compliance, not an exception or a return to the superseded palette.

## Generator, normalization, and retained evidence

- Generator: **OpenAI built-in ImageGen**. There were **55 attempts**: 33 superseded, 18 accepted revisions, and 4 accepted first attempts. No generation request was refused.
- Every source attempt is retained under `tmp/sol56-pale-mother/raw/`. `tmp/sol56-pale-mother/manifest.json` records source IDs, source and preserved-copy byte counts and SHA-256 values, decoded metadata, dispositions, reasons, accepted finals, authority hashes, and final average hashes.
- Mechanical publication used **Sharp 0.35.3** with Lanczos3 resizing to the exact commissioned geometry, alpha flatten/removal, sRGB conversion, and non-palette 8-bit RGB PNG encoding. No scripted paint-over or fabricated scene content was introduced during normalization.
- Package builder: `tmp/sol56-pale-mother/build-package.mjs`.
- Wide visual review: `tmp/sol56-pale-mother/qa/wide-finals-contact.png`.
- Exact 564x941 center-crop review: `tmp/sol56-pale-mother/qa/wide-center-crops.png`.
- Tile reviews: `tmp/sol56-pale-mother/qa/tiles-256-contact.png`, `tmp/sol56-pale-mother/qa/tiles-96-contact.png`, and `tmp/sol56-pale-mother/qa/tiles-44-contact.png`.

## Honest live-integration boundary

- All 22 files live under `apps/web/private/codex-art/` and are addressable by the allow-listed disk resolver and the authenticated `/codex-art/<kind>/<file>` route. They are not public static assets.
- Six files follow generic StoryEntry dossier conventions: the two creature plates, Wenna's character plate, and the three item plates. They become wearable without a hand-maintained art map only when matching StoryEntry rows exist.
- A read-only query against the currently configured local database returned zero matching rows for those six slugs and no `the-pale-mother-bounty` arc. No authoring script was applied.
- `mythicDossiers` and `bloomfallCreatureFieldGuide` remain Blackweir Anaconda-only. Consequently `/codex/bosses/the-pale-mother` follows the page's `notFound()` branch, and the five boss scenes plus eleven ability tiles — all **16 boss assets** — are resolver-addressable but not wired to a live page.
- `scripts/audit-codex-art-coverage.ts` can prove art resolution for eligible StoryEntry rows returned by its database query and for boss plates derived from the existing `mythicSlugs` registry. It cannot count this unregistered Pale Mother set, prove that all 22 commissioned paths exist, validate their pixel contract or hashes, or prove a Pale Mother page is live. The commission-specific regression test owns those asset-contract checks.
- This delivery did not deploy or restart an application, apply a database authoring script, add StoryEntry rows, create the bounty arc, alter the Mythic registry or field guide, or change a public asset. No browser or live-page QA is claimed.

## Validation record

- `node tmp/sol56-pale-mother/build-package.mjs --replace`: **PASS** — wrote the 22 finals, preserved and reconciled all 55 attempts, verified exact family counts and metadata, rejected duplicate SHA-256 finals, computed unique average hashes, and generated the retained QA contacts and manifest.
- `pnpm exec tsx --test lib/pale-mother-art.test.ts` from `apps/web`: **PASS — 5/5** focused tests, covering ordered inventory, private resolver/auth-boundary source contract, exact decoded metadata, SHA-256 uniqueness, and ledger path/byte/hash reconciliation.
- `pnpm --filter @habitat/web exec tsx --test lib/pale-mother-art.test.ts lib/dossier-art.test.ts lib/codex-art-privacy.test.ts`: **PASS — 20/20**, combining the commission contract with the existing resolver and private-placement gates.
- `pnpm exec eslint lib/pale-mother-art.test.ts` from `apps/web`: **PASS**.
- `pnpm exec tsc --noEmit --incremental false --pretty false` from `apps/web`: **PASS**.
- `pnpm test`: **PASS** across the workspace, including **612/612** web tests.
- `pnpm typecheck`: **PASS** across all seven participating workspace projects.
- `pnpm lint`: **PASS** with zero errors and one pre-existing `@next/next/no-img-element` warning on the class directory page.
- `pnpm build`: **PASS**. Next compiled, typechecked, and generated all 72 static pages; the existing private-art dynamic-trace warning remains non-blocking.
- `pnpm --filter @habitat/web exec tsx scripts/audit-codex-art-coverage.ts`: **PASS for its registered scope** — the reported `bosses: 20/20` is the existing Anaconda registry and deliberately does not count or validate this unregistered commission.
- `git diff --check`: **PASS**; Git emitted only line-ending conversion notices for existing working-tree files.

## Publication boundary

This is an art-package delivery only. It installs private originals, their permanent ledger, and a
focused asset-contract regression test. It does not make the Pale Mother encounter, dossier,
StoryEntry data, bounty, or boss page live.
