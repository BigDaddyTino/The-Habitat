# Putting generated art into the Codex

A runbook for whoever wires the next batch of images in — human or agent. There
are **two** art pipelines in this repo and they behave differently. Pick the right
one or the image will not appear.

Everything below has been verified against the running production service.

---

## Pipeline A — character portraits (the easy one)

**Use for:** anything in the Character section.
**Directory:** `apps/web/public/images/characters/keyart/`
**Filename:** `<entry-slug>.png` (also accepts `.jpg`, `.jpeg`, `.webp`)

### Steps

1. Drop the file in that directory, named for the entry slug exactly:
   `apps/web/public/images/characters/keyart/mara-quill.png`
2. Reload the dossier. Done.

**No code change. No rebuild. No restart.** The dossier reads the directory per
request, so a new portrait appears on the next page load. A character with no
portrait shows a slot on the page printing the exact path to drop it at — if you
are unsure of a slug, open the dossier and read the slot.

### The six exceptions

`tino`, `amanda`, `steve`, `the-kestrel-commander`, `the-war-correspondent` and
`abraham-islay-kane` are listed explicitly in `apps/web/lib/character-keyart.ts`
and that map wins over the directory. To **replace** one of those six you must
either overwrite the exact file the map names (same filename and extension) or
remove its line from the map. Overwriting a file under `public/` needs a rebuild
and restart to take effect — see the note at the bottom.

### Slugs

`mara-quill` · `keira-ansel` · `nalia-reed` · `selene-ward` · `jaro-fen` ·
`tomas-vey` · `tino` · `amanda` · `the-kestrel-commander` · `steve` ·
`the-war-correspondent` · `abraham-islay-kane`

Note the engineer is **Tomas Vey**, not Venn.

---

## Pipeline B — Bloomfall creature plates (hash-locked)

**Use for:** anything in the Bloomfall creature set.
**Directory:** `apps/web/private/codex-art/bloomfall-creatures-v4/`
**Format:** WebP, capped at 2048px on the long edge
**Manifest:** `apps/web/lib/bloomfall-creature-art.ts`

This one is locked on purpose: a test hashes every file on disk against the
manifest, so a plate cannot be swapped silently. Adding or replacing one is four
steps, not one.

### Steps

1. **Convert** the master to WebP. Sharp is not a direct dependency, so require
   it by absolute path:

   ```js
   const sharp = require("C:/The Habitat/node_modules/.pnpm/sharp@0.35.3_@types+node@24.13.3/node_modules/sharp");
   sharp(master)
     .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
     .webp({ quality: 82, effort: 5 })
     .toFile("apps/web/private/codex-art/bloomfall-creatures-v4/<name>.webp");
   ```

2. **Record** the result in `bloomfall-creature-art.ts` — `entrySlug`, `rung`
   (`NONE` / `MINOR` / `FUNCTIONAL` / `ADVANCED` / `ABERRANT`, or `null` for a
   species with no ladder), `filename`, `width`, `height`, and the **sha256 of
   the written WebP**. Replacing a plate means updating its hash and dimensions.

3. **Verify**: `pnpm --filter @habitat/web exec tsx --test lib/bloomfall-creature-art.test.ts`
   It fails loudly if a file is missing, unlisted, or does not match its hash.

4. **Build and restart** — the manifest is code:
   ```
   pnpm --filter @habitat/web exec next build
   Restart-Service HabitatWeb
   ```

### Naming

`<slug>-<rung>.webp` for the five adaptive species (`latchhound-advanced.webp`),
`<slug>.webp` for everything else (`switchmother.webp`).

### Declaring a missing plate

Every Bloomfall creature dossier now has a plate, including `bloommarked-remnant`
and `the-last-shift`; Mender is covered by the same package despite remaining a
CHARACTER record. `undrawn` in the test file pins any future declared gap, so a
missing plate still fails for the right reason.

### Aberrants share a plate

The Bellwether, Old Drowner, The Slow Hill, The Braid and The Groundfault do not
have their own files. They borrow the `ABERRANT` rung of the species they came
from, via `aberrantOf` in `bloomfall-creature-art.ts`. Giving one its own plate
means adding a real manifest row and removing its `aberrantOf` entry.

---

## The rule that catches people

**A file added under `public/` after the last build returns 404 until the next
build.** Verified: dropping a new file in `public/images/characters/keyart/` and
requesting it directly gives 404, while a file that existed at build time gives
200.

That is exactly why both pipelines above serve through `/codex-art/...` — that
route reads from disk per request. Pipeline A works without a rebuild *because*
it goes through the route, not because `public/` is live. Do not "simplify" it
into a direct `/images/...` link.

## Where the masters live

4K creature masters are archived at
`N:\The Habitat\backups\codex-art\bloomfall-creatures-v4\masters\` along with the
generation prompts. Keep new masters there too — the repo only holds the
downscaled WebP copies.

## The briefs that generate the art

- `Docs/BLOOMFALL_IMAGE_PROMPT.md` — the 31 creature plates
- `Docs/MARTINO_CHARACTER_IMAGE_PROMPT.md` — the 12 character portraits

Both are written to run unattended and return a zip.
