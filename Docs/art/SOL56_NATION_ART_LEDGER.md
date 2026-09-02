# SOL 5.6 — The Crown art ledger

**Status:** ACCEPTED, INSTALLED, AND VERIFIED — 12/12 plates

**Commission issued:** 2026-09-02

**Asset execution completed:** 2026-09-02

**Authority:** `Docs/art/SOL56_NATION_ART_PROMPT.txt`

## Acceptance summary

- Installed the exact private convention inventory at `apps/web/private/codex-art/nation/<slug>.png`: one 1672x941 hero, five 1200x800 rank plates, and six 1024x1024 realm-tree sigils.
- Format gate: **PASS — 12/12** decode as PNG, sRGB, RGB24 (8-bit `uchar`, three channels), with no alpha. All twelve SHA-256 values are unique.
- Visual gate: **PASS — 12/12**. The hero and ranks are standing-height rooms or places, never god views or strategy HUDs. Every visible paper, map, trade board, seal field, and banner is blank. The five ranks share late-evening storm-blue ambient light and first practical lamps.
- Story-lock gate: **PASS**. Commander Alder Wade is not depicted as a statue or casualty; no First Weir bottom, active Outfall Anchor, crossroads, anthropomorphic machine face, or figure presented as Brother Aster appears. Forge light is steady infrastructure light only.
- Material gate: **PASS**. The set stays in charcoal, wet grey, bone, muted rust, and storm blue. Brass is restrained to hand-worked controls, map furniture, and the commissioned brass objects; there is no gilt throne, velvet, heraldic lion, or fantasy gloss.
- Sigil gate: **PASS — 6/6** at full size and exact 64px. Might and Coffers were revised after an independent thumbnail review; both also pass the former 56px implementation size as a stress test. The page slot is now the commissioned 64x64 and is regression-pinned.
- Route gate: **PASS**. All twelve files round-trip through the authenticated private resolver; `audit-codex-art-coverage.ts` reports `nation: 12/12 crown plates present`.
- Authenticated browser boundary: this run's available browser had no local member session and correctly redirected `/codex/nation` to `/sign-in`, so no authenticated live-page result is claimed. Full-frame, rank-card, hero-cover, 64px, and 56px static layout simulations are retained locally instead.

## Plate ledger

One row is retained for each commissioned plate. `revised` means at least one generated candidate was rejected or superseded during visual QA; the reason is stated in the row and expanded below.

| Plate | Final path | Status | Bytes | Final SHA-256 | Accepted generated source / source SHA-256 | QA and revision record |
| --- | --- | --- | ---: | --- | --- | --- |
| The Map Table (hero) | `apps/web/private/codex-art/nation/hero.png` | **revised** | 2,092,507 | `e5bc55990dab34ec4108d6e516abfb9f14d26a339584c5ff53c7f88550879604` | `exec-a82a99fa-6c5a-4909-b251-5365ada113d4.png` / `7680254d7c54d6ec0e36c64e5b8273b22bd531285e1a130133f8b25c525026c5` | v1 showed six levers; v2 over-corrected to four. Accepted v3 has exactly five, the center lever mid-pull under the ruler's glove, cropped court figures, blank table matter, cold tea, rain, and steady Forge light. |
| Rank I · The Freehold | `apps/web/private/codex-art/nation/rank-i-freeholder.png` | **delivered** | 1,810,862 | `67530a1b67e65ddecd0d407d853dbbbd87e6571f4293940049cadca8cd62be0c` | `exec-6d30b32f-b3c7-4fdb-ae0d-2b3dc38e4a84.png` / `5ad99a7527c9c269a90e3a5f1cb7d58cb543deaa921ce044ba35008f5aa45d83` | First attempt accepted: drained ditches, new levee, half-roofed lamp-lit house, three hands eating on lumber, huge calm river, and an unlit ridge signal fire. |
| Rank II · The Ward | `apps/web/private/codex-art/nation/rank-ii-warden.png` | **revised** | 1,850,350 | `0c28eaeb061ccc49cef46cc042cc38e313dfab2d3bfb93c2d91efa9bd6d57359` | `exec-fd665108-aaee-4902-ad2b-49c87b445a8a.png` / `0be766a3d9c14b77401991d5048eeb1642baa0fc8946e639470ca0f3e4ce6f81` | v1 was superseded because only six garrison were clearly separable. Accepted v2 has exactly eight, plus the blockhouse, toll window, queued barge, patrol boat, shuttered mast, house-scale chains, and no visible gate bottom. |
| Rank III · The Township | `apps/web/private/codex-art/nation/rank-iii-magistrate.png` | **delivered** | 2,138,299 | `88cbe8613c216627e7231259e6a87f2c1dba933934fb8a98a2d9561c684f8c85` | `exec-418fcfbf-e782-44f8-89a3-54c317d68989.png` / `2bb7bbe243468621ead7a0877ec48cd8f0e2d98dd28c749d0f91e37115022acd` | First attempt accepted: own-street view, changing rooflines, blank trade boards, courthouse table and petitioner queue, and the militia admission exchange with a family and loaded cart. |
| Rank IV · The City | `apps/web/private/codex-art/nation/rank-iv-lord.png` | **delivered** | 1,764,138 | `7d43bd4b7372ddf24383054d3b87062d0a3b60b21a49afb019fc72e561916306` | `exec-34705cd7-ee70-4495-990d-4392a2f7d90a.png` / `b324b77df4b73a91c2d08fa8bc13ea54deb24dc3ed755ef3bb4a2368cd034136` | First attempt accepted: standing balcony view, two council factions in quiet dispute, working harbor, warehouses, cranes, scaffolded aqueduct, and army columns forming below. |
| Rank V · The Nation | `apps/web/private/codex-art/nation/rank-v-crown.png` | **revised** | 1,701,912 | `82181a7683628805c7c02af0df45666f54294c333d413757f11370637972a300` | `exec-31591bb1-c2ab-41e0-8572-1b9d51b01b21.png` / `0a4c97dc651fd30a308f637c9feb53ed38cef35ef0697e954c2c454667c89a94` | v1 was QA-refused for seven seated officers. Accepted v2 has exactly six seated officers and one fatigued kneeling vassal, an empty plain chair, blank banner, crowded map table, and steady side-door Forge light. |
| Sigil · Might | `apps/web/private/codex-art/nation/tree-might.png` | **revised** | 1,574,679 | `211a4c7fd9dda0e989771ba58ad42f8f6789cb12995dfc7acd2033f37fa183d6` | `exec-b9968910-4fcd-49fc-8fa8-41fbeec9109c.png` / `7e53797e32848a3caefa36d40016ac4b01d808af3f246535ae186e2381e393be` | v1 collapsed to a generic pail/canister at 64px. Accepted v2 is a visibly dented horizontal muster-roll drum with a rust-red two-point rifle sling, two swivels, adjuster, and no carry handle. |
| Sigil · Coffers | `apps/web/private/codex-art/nation/tree-coffers.png` | **revised** | 1,453,935 | `3c4a22760268988b35a8f643c4ef6d0780a53172513e314c5b6020fba91cba1d` | `exec-48019581-2bea-4011-8904-1ad84bf26e6a.png` / `c6902c4adac76c31ba94ab835232f12d357a6eae83110762f835f2dbde9b6e4d` | v1 lost its ribbon at thumbnail size and carried an unearned brass stud; v2 still read as luggage. Accepted v3 is a tall suspended lead toll-bar counterweight with compact clevis hardware, a broad ledger-white ribbon, and zero brass. |
| Sigil · Works | `apps/web/private/codex-art/nation/tree-works.png` | **delivered** | 1,803,333 | `bdc00b4c598f83423bf8e08f112d1d69a36a656cbb845901607d6fb06f8e455e` | `exec-0bc02542-3f84-44fc-8250-3d7c7424a5b5.png` / `24812698e97577f40e47281846d2326dd6ff5ee68f47bfbd289d10c8f66ea103` | First attempt accepted: one hand-worn brass lock-gate lever handle over sparse physical drainage grooves in dark slate; clear at 64px. |
| Sigil · Arcana | `apps/web/private/codex-art/nation/tree-arcana.png` | **delivered** | 1,704,143 | `ade9d7b8f225683912e4f01b7d3f7805a2db3745765ac174b5fbfab6729f52d6` | `exec-c65c1132-aa57-42fb-b78d-f917b3d297bc.png` / `06b74de69859658dba25ba57c83bcaf8c9673dbfddb8bb2aa237c53e77aae4b9` | First attempt accepted: one unmarked steel-cradled vial with a plainly visible Essence reserve and restrained steady blue-white infrastructure light. |
| Sigil · Roots | `apps/web/private/codex-art/nation/tree-roots.png` | **delivered** | 1,850,579 | `ee154a372c7a0b924df0a73fd5719465bb717afa8ac70645ac75ef1e4a59b89b` | `exec-7432fc03-20ee-40bb-8b2b-245fab2e0958.png` / `6850d71518a624dd5f3ddf8cd64e484328966bb1b2504ff61afc30b5cf8b841d` | First attempt accepted: one granary key and one blank admission-ledger stamp on homespun, with moss stitching as the only owned accent. |
| Sigil · Faith | `apps/web/private/codex-art/nation/tree-faith.png` | **delivered** | 1,779,739 | `79f73111ac5285490f26a3904967e3edc636ac812383b214d24c6c9279fbc467` | `exec-e3521b6c-6053-4c43-81ea-79c2fe528024.png` / `f268a1e2116c298171b9de0f0a210871435c4389c5946ad063c6e8e61b3dcbce` | First attempt accepted: open shrine box, exactly five materially distinct unmarked faith tokens, and one unmistakably empty sixth compartment; clear at 64px. |

## Refusal and revision record

- **No ImageGen safety or moderation refusal occurred.** `refused` below means the candidate was refused by visual QA, not by the generator.
- `hero` v1 was superseded for six levers; v2 was superseded for four. v3 is the accepted exact-five composition.
- `rank-ii-warden` v1 was superseded for six clearly readable garrison instead of eight. The targeted v2 correction is accepted.
- `rank-v-crown` v1 was QA-refused for seven seated officers. The targeted v2 correction is accepted with exactly six plus the fatigued vassal.
- `tree-might` v1 was revised because the object read as a canister and the sling as generic luggage webbing at 64px. v2 is accepted.
- `tree-coffers` v1 was revised for a lost thumbnail ribbon and unearned brass stud; v2 was superseded because its silhouette still resembled luggage. v3 is accepted.

## Generator, normalization, and retained evidence

- Generator: OpenAI built-in ImageGen. Each distinct initial plate and each targeted edit used a separate call.
- The issued commission copy is terminology-normalized at `Docs/art/SOL56_NATION_ART_PROMPT.txt`; its composition, visual requirements, and production details are otherwise retained.
  - `tmp/sol56-kingdom/root/manifest.json`
  - `tmp/sol56-kingdom/ranks-lower/manifest.json`
  - `tmp/sol56-kingdom/ranks-upper/manifest.json`
  - `tmp/sol56-kingdom/sigils/manifest.json`
  - `tmp/sol56-kingdom/sigil-revisions/manifest.json` (supersedes the original Might and Coffers final rows)
- Raw sources are preserved beneath the manifest-adjacent `raw/` or `sources/` directories and in their recorded Codex generated-image roots.
- The `tmp/sol56-kingdom/` directory name is retained only as immutable historical generation provenance. It is ignored, local evidence rather than shipped or rendered product terminology; renaming it would break the recorded manifest paths and hashes.
- Mechanical publication operation: Sharp Lanczos3 resize to the exact commissioned dimensions where necessary, convert/retain sRGB, remove alpha, and encode a non-palette 8-bit RGB PNG. No generative candidate was silently repaired with paint-over scripting.
- Final integrated QA: `tmp/sol56-kingdom/qa/final-contact.png` and `tmp/sol56-kingdom/qa/hero-cover-crops.png`. Family-specific full-size and thumbnail sheets are listed in the machine manifests.

## Validation record

- `pnpm exec tsx --test lib/nation-art.test.ts` from `apps/web`: **6/6 pass** — exact inventory, private resolver round trip, exact decoded dimensions/format, unique hashes, one reconciled ledger row per plate, all three page wiring paths, and the 64px CSS slot contract.
- `pnpm exec tsx scripts/audit-codex-art-coverage.ts` from `apps/web`: **Nation 12/12 present**. The audit's single remaining Codex gap is the unrelated pre-existing `FACTION/the-radiant-path` slot.
- `pnpm test`: **PASS**; the web package reports **554/554** tests passing.
- `pnpm typecheck`: **PASS**.
- `pnpm lint`: **PASS** with one pre-existing `@next/next/no-img-element` warning in `app/codex/classes/page.tsx` and no errors.
- Anonymous `GET /codex-art/nation/hero.png`: **HTTP 404**, preserving the private-art boundary.

## Publication boundary

The twelve files remain under `apps/web/private/`. They are served only by the existing authenticated `/codex-art` route and become visible on the next authenticated Nation-page reload. No StoryEntry, database row, public asset, credential, infrastructure address, server-control surface, or production service was changed.
