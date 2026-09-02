# SOL 5.6 — Talent Backdrop Ledger

**Status:** ACCEPTED, INSTALLED, AND VERIFIED — 8/8 landscapes
**Authority:** `Docs/art/SOL56_TALENT_BACKDROP_AND_ICON_PROMPT.txt`

## Final manifest

| Final file / commissioned ground | Bytes | Final SHA-256 | Accepted source ID / source SHA-256 | Superseded-attempt note |
|---|---:|---|---|---|
| `apps/web/private/codex-art/talent-backdrops/bastion.png` — THE GATE | 2,018,099 | `8b426502c2a6d4bb7b1cfb9769465662837af0b1dd5025b0748f72db9ce8da40` | `exec-c062a87d-d4ca-4f5b-9c66-c8520ae18bff.png` / `8b426502c2a6d4bb7b1cfb9769465662837af0b1dd5025b0748f72db9ce8da40` | None |
| `apps/web/private/codex-art/talent-backdrops/spector.png` — THE LONG EYE | 1,800,427 | `630661706658b132293ac1f89dfa8d2e617761e7dcac2e79025f21cd3bd9b1e8` | `exec-5123fd0d-2cb9-40c7-be9c-0b91f482b47a.png` / `630661706658b132293ac1f89dfa8d2e617761e7dcac2e79025f21cd3bd9b1e8` | None |
| `apps/web/private/codex-art/talent-backdrops/conduit.png` — THE LANTERN | 2,286,633 | `3cc0f18249381025930658a4a8f6e5e81a578184852e163a3acdaa3b083dd524` | `exec-57ff51cb-cc5c-49b0-8e21-5ec53e553412.png` / `a01aed5e57caac350d69a1cab46b1936832964e0b5c17d34ca07ac8f2b3b924c` | None; source normalized 1671×941 → 1672×941 |
| `apps/web/private/codex-art/talent-backdrops/surger.png` — THE PULSE | 1,756,755 | `fca27855fb5c364088568ad316d6e39ce4c6ea56ab1aaa1cfcde124258204ebb` | `exec-ca20706c-6466-4d01-bf94-84ee434b0056.png` / `fca27855fb5c364088568ad316d6e39ce4c6ea56ab1aaa1cfcde124258204ebb` | None |
| `apps/web/private/codex-art/talent-backdrops/archon.png` — THE CHORUS | 1,914,429 | `3bee5883ba4d264256840a8bc9643634179671ef5b78999bb003dd1a85bf4c83` | `exec-c5386075-28d2-445c-96f7-9705a996d02f.png` / `3bee5883ba4d264256840a8bc9643634179671ef5b78999bb003dd1a85bf4c83` | None |
| `apps/web/private/codex-art/talent-backdrops/procurator.png` — THE LEDGER | 1,708,318 | `9bb6896566341e871d72ad24f68ed76a48a2ac9c36d81d65e58d6e7973e97742` | `exec-5947d53f-8738-487f-b688-d15418709ffb.png` / `9bb6896566341e871d72ad24f68ed76a48a2ac9c36d81d65e58d6e7973e97742` | None |
| `apps/web/private/codex-art/talent-backdrops/cypherist.png` — THE CIRCUIT | 2,200,609 | `fc67aaecfb1158155253d4702187e4efc4d4e6bd74616a32f983765c3657a588` | `exec-44879d86-9ffb-4e08-af1b-ef687017b57c.png` / `fc67aaecfb1158155253d4702187e4efc4d4e6bd74616a32f983765c3657a588` | None |
| `apps/web/private/codex-art/talent-backdrops/maverick.png` — THE CROSSED IRONS | 2,183,937 | `b5a188872ae23b7e6fb2f9157947ac776f5f3c506534fa2f751e9271c16ebf42` | `exec-88272e32-25fa-4277-8bbf-d4ab1d814f47.png` / `b5a188872ae23b7e6fb2f9157947ac776f5f3c506534fa2f751e9271c16ebf42` | None |

## Provenance and QA summary

- All eight backdrops were generated one asset per built-in ImageGen call. Full accepted source paths, source/final bytes, SHA-256 values, and decoded metadata are retained in `.tmp/sol56-art/backdrop-source-final-map.json`; no generated backdrop attempt was superseded.
- Format QA passes 8/8: 1672×941 PNG, sRGB, RGB24 (8-bit `uchar`, three channels), no alpha. Conduit alone arrived at 1671×941 and was deterministically normalized to the required width; its raw source and distinct source/final hashes remain recorded.
- Full-frame and centered-cover contact review passes the eight commissioned grounds as environments rather than portraits, with each class's single owned light, clear central action ground, no visible text/logo/insignia, and branch-header-safe upper space.
- Current-page wash review is retained at `tmp/sol56-qa/backdrops-current-wash-contact.png` beside the unwashed `backdrops-full-contact.png`. The wash is layered on the horizontally scrollable board, so mobile scrolling does not expose an unwashed seam; inspected-road mode deepens the wash.
