# SOL 5.6 — The Faiths, Kept art ledger

**Status:** ACCEPTED, INSTALLED, AND VERIFIED — 4/4 commissioned plates

**Commission issued:** 2026-09-02

**Asset execution completed:** 2026-09-02

**Authority:** `Docs/art/SOL56_FAITH_ART_PROMPT.txt`

## Acceptance summary

- Installed the exact four-file private inventory: one 1672x941 Congregation faction plate, one 1024x1024 faction emblem, and two 1672x941 character portraits.
- Format gate: **PASS — 4/4** decode as PNG, sRGB, RGB24 (8-bit `uchar`, three channels), non-palette, with no alpha. All four SHA-256 values are unique.
- Visual gate: **PASS — 4/4** at full size. Both portraits also pass the exact 706x941 centered 3:4 shelf crop; the emblem remains distinct as ring, single tally, and bell at exactly 32px.
- Story-lock gate: **PASS**. Brother Aster is never a figure; the Core is restrained blue-white infrastructure light; the Forge is a worn pedestal in physical rings and cabling; no cross, halo, glowing altar, saint lighting, church ornament, fantasy-faith iconography, readable text, logo text, or marked insignia appears.
- The First Hour remains gentle and unsettling without menace: the reclaimed soldier is alive and disoriented, Edda's hand is on the platform edge rather than the person, and the waiting queue sits beneath one practical lamp. The wall carries only the commissioned non-linguistic tally strokes.
- Anouk remains a working host rather than clergy: her dry shoulder coil is being mended and is not drawing water; exactly two riders drink from the same bucket with weapons slung; indigo is the only saturated color.
- Resolver gate: **PASS**. The Congregation's PNG hero and emblem are registered as one faction identity, and both character portraits resolve by the authenticated private convention path on the directory and dossier surfaces.
- Coverage gate: **PASS for this commission**. The audit reports all **42/42 portrait-eligible characters** illustrated and records the Grand Advocate separately as one reserved seat without a portrait. It reports **36/37 factions** illustrated; the one remaining gap is the separately out-of-scope Radiant Path.
- The six existing Faith Lane plates commissioned under `SOL56_RIVERLANDS_ART_PROMPT.md` §XI were not regenerated, replaced, or edited.

## Plate ledger

One row is retained for each commissioned plate. `revised` means at least one generated candidate was rejected or superseded during visual QA; the reason is stated in the row and expanded below.

| Plate | Final path | Status | Bytes | Final SHA-256 | Accepted generated source / source SHA-256 | QA and revision record |
| --- | --- | --- | ---: | --- | --- | --- |
| The First Hour | `apps/web/private/codex-art/factions/the-congregation-of-the-bound.png` | **delivered** | 3,078,734 | `3518c9acd557f8dad84f8e9c40ee90b757867e12d82e0488c27368bd2b8085f6` | `exec-ad7bb851-d3da-4ee4-b791-4aeaecfebbcd.png` / `09e708b11e4d481b68d64e033263c060fb5cbce2710db9c872983918b7388fb0` | First attempt accepted: industrial pedestal, rings and cabling; steady Core; living reclaimed soldier; Edda seated with her hand flat on the platform edge; patient bench queue under one lamp; tally-only board; no menace or religious gloss. |
| The Ledger and the Bell | `apps/web/private/codex-art/faction-logos/the-congregation-of-the-bound.png` | **revised** | 725,328 | `7dbdef8fb7bb926c532aa11d484f57e87cc3f332b3c61963d7062e2473868fe9` | `exec-e231a7a5-26d8-408c-9139-7b52e9edb00b.png` / `8b60b0e5431de089f40709e96ad0a51eaecb0cff7a05e0828361ec29fe8469f2` | v1 was superseded because four fasteners and beveled shading suggested a clock at 32px. Accepted v2 is flat and keeps exactly one uninterrupted containment ring, one Core-blue tally stroke, and one hanging bell on opaque charcoal. |
| Sexton Edda Brook | `apps/web/private/codex-art/characters/the-sexton-of-heartland.png` | **delivered** | 3,092,418 | `9ec970338d79b74ff5a21e89a900d99d7ae7899ccf733c8974b314d798c432da` | `exec-deff1db4-e5d5-4e06-997f-b6016a63ed46.png` / `66c8c6e2d978db75d47924ee5bae229e18ef526bac8051a7e3e794c205deca03` | First attempt accepted: broad, grey-cropped and exact; working forearms, plain coat, belt clip, closed folder, and dry expression all survive the center crop. Offset rings remain machinery, never halo or figure. |
| Anouk Sarr, the Wellkeeper | `apps/web/private/codex-art/characters/the-wellkeeper-of-honest-well.png` | **revised** | 3,137,047 | `2551c8c26c3681408d1201319774af0b49fb526ca22f622a03352d176933fcbb` | `exec-87a954ce-48b9-4018-9d78-f89d8492f17b.png` / `a06e56cc4397ec4a3ffc50f50ca3a848d791f8277f3e1601c56f754de1c5d60a` | v1 was superseded because the riders appeared to use separate vessels. Accepted v2 makes exactly two riders share one bucket, weapons slung, while Anouk's eyes-down rope repair, Honest Well, hard noon, and center-safe portrait remain intact. |

## Explicit non-commission

The Grand Advocate is an unnamed reserved seat, not a fifth commissioned plate. No portrait was generated or installed. The shared dossier-art rule identifies that explicit reserved slot and withholds resolution, the drop-in-path prompt, and the audit obligation until its `fullName` is genuinely set; appearance or model-copy edits alone cannot cast it.

## Refusal and revision record

- **No ImageGen safety or moderation refusal occurred.** `superseded` below means refused by visual QA, not by the generator.
- The emblem's first source, `exec-f1028215-99a7-4011-90cc-cdb571841812.png` (SHA-256 `4cafb2761c1b02ab9a41f2b454797770419b5bb56fd1db3ab09865572d2ca711`), had four circular fasteners, bevels, and an alpha channel. At 32px it read too much like a clock. A dedicated edit removed the fasteners and dimensional styling.
- Anouk's first source, `exec-79cfb29c-3b31-40c6-977e-c57f449beaa0.png` (SHA-256 `b59028b76d01dff33c16c2bc05cea3df9e6981ee5bc8464f1356cdea6248252e`), preserved her identity and setting but made the shared-vessel action ambiguous. A dedicated edit replaced the background action with two riders drinking from opposite edges of one bucket.

## Generator, prompt set, normalization, and retained evidence

- Generator and mode: OpenAI built-in ImageGen. Each initial asset and each targeted revision used its own call; the two revisions used `precise-object-edit` against their immediately preceding generated source.
- The accepted expanded prompts are retained verbatim with every negative lock, source ID, source path, source/final hash, decoded metadata, and attempt disposition in:
  - `tmp/sol56-faith/faction/manifest.json` — `stylized-concept` for The First Hour and `precise-object-edit` for the accepted emblem revision.
  - `tmp/sol56-faith/edda/manifest.json` — `photorealistic-natural` for Edda.
  - `tmp/sol56-faith/anouk/manifest.json` — `precise-object-edit` for the accepted Anouk correction; the initial `photorealistic-natural` prompt is retained beside it.
- Raw generated sources are preserved beneath each manifest's `raw/` directory. Full-frame, exact centered portrait-crop, faction-card, and 32px emblem evidence is preserved beneath the corresponding `qa/` directory.
- Mechanical publication operation: Sharp converts/removes alpha, writes sRGB, and encodes a non-palette 8-bit RGB PNG. The First Hour and Edda already matched the commissioned geometry. The accepted 1254px emblem was resized to 1024px square. Anouk's accepted 1448x1086 edit was Lanczos3 cover-resized north-anchored to 1672x941 to preserve her face, hands, rope repair, well, and shared bucket. No scripted paint-over or generative detail was silently substituted during normalization.

## Validation record

- `pnpm --filter @habitat/web exec tsx --test lib/faith-art.test.ts lib/faction-branding.test.ts lib/dossier-art.test.ts lib/kingdom-art.test.ts`: **23/23 pass** — exact files and formats, private resolver round trips, surface wiring, unique hashes, four reconciled ledger rows, reserved-seat behavior, and the prior Crown gate.
- Focused ESLint over the nine touched TypeScript/TSX files: **PASS**, no warning or error.
- `pnpm --filter @habitat/web exec tsx scripts/audit-codex-art-coverage.ts`: **42/42 eligible characters**, with one explicitly reserved portraitless seat; **36/37 factions**, with only the separately out-of-scope Radiant Path empty; **1 empty slot** overall.
- Independent full-resolution and display-crop review: **PASS — 4/4**, including exact 706x941 portrait crops and the exact 32px emblem.
- Anonymous direct requests for the Congregation plate returned **HTTP 404** on both available loopback web listeners, preserving the private-art boundary.
- `pnpm test`: **PASS**, including **569/569** web tests.
- `pnpm typecheck`: **PASS** across the workspace.
- `pnpm lint`: **PASS** with one pre-existing `@next/next/no-img-element` warning in `app/codex/classes/page.tsx` and no errors.

## Publication boundary

All four files remain under `apps/web/private/` and resolve through the existing authenticated `/codex-art` route. No StoryEntry, database row, seed prose, Faith Lane plate, public asset, credential, infrastructure address, server-control surface, deploy, or production service was changed by this art delivery.
