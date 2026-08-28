# Timeline event key art

One image per event, named by the event's codex slug:

    images/timeline/<slug>.png     (or .jpg / .webp)

Examples: `the-great-purges.png`, `the-soul-breakthrough.jpg`.

Drop a file here, reload the page, and it appears — the art is read off disk
per request through /codex-art rather than served from the static build index,
so no rebuild or restart is needed. Events with art
render as major moments on the timeline; events without stay compact cards.

Landscape around 1200x675 reads best on the timeline cards.
