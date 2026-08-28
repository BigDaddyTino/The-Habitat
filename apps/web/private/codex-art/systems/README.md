# System key art

One image per game system, named by the system's codex slug:

    images/systems/<slug>.png     (or .jpg / .webp)

Examples: `kingdom-management.png`, `the-corruption-system.jpg`.

Drop a file here, reload the page, and it appears — the art is read off disk
per request through /codex-art rather than served from the static build index,
so no rebuild or restart is needed. Until then the slot renders as a
labelled placeholder showing exactly this path.

Landscape around 1600x900 reads best on the dossier hero; the library card
crops the middle of whatever you give it.
