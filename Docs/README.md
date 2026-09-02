# Docs — where everything lives

Organized 2026-09-01. One rule: **loose files at this root are load-bearing**
(scripts read them by exact path) — everything else lives in a themed folder.
When adding a doc, file it in the folder it belongs to; when a script writes a
doc, it writes into these folders too.

## The folders

| Folder | What's in it | Start with |
| --- | --- | --- |
| **`codex/`** | The Story Codex's own manuals: how the writers' room works, sync, import, schemas, the character bible's process record | `codex/STORY_CODEX.md` |
| **`art/`** | Everything Sol and image work: prompts, ledgers of delivered art, the drop runbook, style law, open-slot manifests | `art/SOL56_RIVERLANDS_ART_PROMPT.md` (current brief) · `art/CODEX_ART_DROP_RUNBOOK.md` (how to place art) |
| **`sims/`** | Balance simulation findings and raw logs — talents and Nation Management | `sims/MARTINO_NM_SIM_FINDINGS.md` |
| **`bloomfall/`** | The complete Bloomfall Reach campaign record: canon architecture, visual passes, promotion/cutover reports | `bloomfall/BLOOMFALL_REACH_CANON_ARCHITECTURE.md` |
| **`atlas/`** | Atlas contracts, plans, and release records | `atlas/ATLAS_2_CONTRACT.md` |
| **`platform/`** | The Habitat itself: architecture, deployment (web/worker/game services), auth, security, operations, observability, old audits and plans | `platform/ARCHITECTURE.md` · `platform/WEB_DEPLOYMENT.md` |

## Loose at the root on purpose

- `atlas-route-authoring-backlog.json` — read by the atlas activation and
  verification scripts by this exact path; its bytes are fingerprinted. Do not
  move or edit casually.

## Frozen evidence directories — do not move, do not "fix"

These are point-in-time artifacts whose paths and/or hashes are locked in code
(`scripts/lib/atlas-v2-activation.ts` and friends). Moving or editing them
falsifies history and breaks activation locks:

- `atlas-migration-rehearsal/` — the rehearsal record; `atlas-v2-topology-manifest.json` is sha256-locked
- `atlas-master-v2-candidate/` — includes `death-canyon-dynamic-boundary-v1.json`, read by canonical topology
- `atlas-migration-manifests/`, `atlas-acceptance-evidence/`, `atlas-v2-activation/`
- `bloomfall-routes/` — `bloomfall-route-status-manifest.json` is read for parity
- `bloomfall-local-atlas/`, `geographic-hierarchy/`, `map-concepts/` — evidence and concept records

## Scripts that WRITE into Docs (their paths are updated to the new layout)

- `audit-character-bible.ts --write-art-manifest` → `art/MARTINO_CHARACTER_BIBLE_ART.md`
- `sim-talent-balance.ts` → `sims/MARTINO_SIM_RESULTS.md`
- `sim-nation-balance.ts` → `sims/MARTINO_NM_SIM_RESULTS.md`

## Fastest answers

- **"How do I place new art?"** → `art/CODEX_ART_DROP_RUNBOOK.md`
- **"What art is still owed?"** → `art/SOL56_RIVERLANDS_ART_PROMPT.md` + run `audit-codex-art-coverage.ts`
- **"How does the codex/release/export work?"** → `codex/STORY_CODEX.md`, `codex/CODEX_SYNC.md`
- **"What did the Nation sims prove?"** → `sims/MARTINO_NM_SIM_FINDINGS.md`
- **"How do I deploy the web app?"** → `platform/WEB_DEPLOYMENT.md` (and `apps/web/scripts/deploy-web.ps1`)
- **"What happened in Bloomfall and why?"** → `bloomfall/` in filename order
