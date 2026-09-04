import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  codexArtFileForUrl,
  codexArtSlot,
  findCodexArt,
  resolveCodexArtFile,
  type CodexArtKind,
} from "./codex-art";

/**
 * The Revision A commission in delivery order: 22 plates. Wenna Crake and
 * The Vents are the two additions to the original 20-plate brief.
 */
const plates = [
  { kind: "creatures", slug: "the-pale-mother", width: 1672, height: 941 },
  { kind: "creatures", slug: "the-pale-brood", width: 1672, height: 941 },
  { kind: "characters", slug: "wenna-crake", width: 1672, height: 941 },
  { kind: "bosses", slug: "the-vents", width: 1672, height: 941 },
  { kind: "bosses", slug: "death-canyon-arena", width: 1672, height: 941 },
  { kind: "bosses", slug: "the-cage-opens", width: 1672, height: 941 },
  { kind: "bosses", slug: "the-quiet", width: 1672, height: 941 },
  { kind: "bosses", slug: "the-tally", width: 1672, height: 941 },
  { kind: "items", slug: "settled-plate", width: 1672, height: 941 },
  { kind: "items", slug: "brood-glass", width: 1672, height: 941 },
  { kind: "items", slug: "cage-rib", width: 1672, height: 941 },
  { kind: "bosses", slug: "ability-sweeping-foreleg", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-shed-plate", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-the-drag", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-fissure-step", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-settle", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-cradle-slam", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-opening-the-cage", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-gaswalk", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-climb", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-the-quiet", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-reassembly", width: 256, height: 256 },
] as const satisfies ReadonlyArray<{
  kind: CodexArtKind;
  slug: string;
  width: 1672 | 256;
  height: 941 | 256;
}>;

const commissionedPaths = [
  "creatures/the-pale-mother.png",
  "creatures/the-pale-brood.png",
  "characters/wenna-crake.png",
  "bosses/the-vents.png",
  "bosses/death-canyon-arena.png",
  "bosses/the-cage-opens.png",
  "bosses/the-quiet.png",
  "bosses/the-tally.png",
  "items/settled-plate.png",
  "items/brood-glass.png",
  "items/cage-rib.png",
  "bosses/ability-sweeping-foreleg.png",
  "bosses/ability-shed-plate.png",
  "bosses/ability-the-drag.png",
  "bosses/ability-fissure-step.png",
  "bosses/ability-settle.png",
  "bosses/ability-cradle-slam.png",
  "bosses/ability-opening-the-cage.png",
  "bosses/ability-gaswalk.png",
  "bosses/ability-climb.png",
  "bosses/ability-the-quiet.png",
  "bosses/ability-reassembly.png",
] as const;

const webRoot = process.cwd();
const repoRoot = path.join(webRoot, "..", "..");
const diskFile = ({ kind, slug }: (typeof plates)[number]) =>
  path.join(webRoot, "private", "codex-art", kind, `${slug}.png`);
const finalPath = ({ kind, slug }: (typeof plates)[number]) =>
  `apps/web/private/codex-art/${kind}/${slug}.png`;
const hash = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");

test("the Pale Mother commission has exactly its 22 ordered private plates", () => {
  const paths = plates.map(({ kind, slug }) => `${kind}/${slug}.png`);

  assert.deepEqual(paths, commissionedPaths);
  assert.equal(new Set(paths).size, 22);
  assert.equal(plates.filter(({ width, height }) => width === 1672 && height === 941).length, 11);
  assert.equal(plates.filter(({ width, height }) => width === 256 && height === 256).length, 11);

  for (const plate of plates) {
    const file = diskFile(plate);
    assert.ok(existsSync(file), `${plate.kind}/${plate.slug}.png is missing`);
    assert.ok(statSync(file).size > 0, `${plate.kind}/${plate.slug}.png is empty`);
  }
});

test("every Pale Mother plate round-trips through the private resolver and gated route", () => {
  for (const plate of plates) {
    const filename = `${plate.slug}.png`;
    const url = `/codex-art/${plate.kind}/${filename}`;
    const file = diskFile(plate);

    assert.equal(codexArtSlot(plate.kind, plate.slug), `private/codex-art/${plate.kind}/${filename}`);
    assert.equal(findCodexArt(plate.kind, plate.slug), url);
    assert.equal(resolveCodexArtFile(plate.kind, filename), file);
    assert.equal(codexArtFileForUrl(url), file);
    assert.equal(codexArtFileForUrl(`/images/${plate.kind}/${filename}`), null);
  }

  assert.equal(codexArtFileForUrl("/codex-art/bosses/../../../.env"), null);
  assert.equal(codexArtFileForUrl("/codex-art/secrets/the-pale-mother.png"), null);

  const route = readFileSync(
    path.join(webRoot, "app", "codex-art", "[kind]", "[file]", "route.ts"),
    "utf8",
  );
  const authCheck = route.indexOf("const session = await auth()");
  const fileResolution = route.indexOf("const target = resolveCodexArtFile(kind, file)");
  assert.ok(authCheck >= 0, "the private art route no longer authenticates requests");
  assert.ok(fileResolution > authCheck, "the private art route resolves files before authenticating");
  assert.match(route, /!session\?\.user\?\.id/);
  assert.match(route, /!session\.user\.isActive/);
  assert.match(route, /!hasRequiredRole\(session\.user\.role, storyReadRole\)/);
});

test("every Pale Mother final satisfies the exact RGB24 PNG contract", async () => {
  const sharp = (await import("sharp")).default;

  for (const plate of plates) {
    const metadata = await sharp(diskFile(plate)).metadata();
    assert.equal(metadata.format, "png", `${plate.kind}/${plate.slug} is not PNG`);
    assert.equal(metadata.width, plate.width, `${plate.kind}/${plate.slug} has the wrong width`);
    assert.equal(metadata.height, plate.height, `${plate.kind}/${plate.slug} has the wrong height`);
    assert.equal(metadata.space, "srgb", `${plate.kind}/${plate.slug} is not sRGB`);
    assert.equal(metadata.channels, 3, `${plate.kind}/${plate.slug} is not RGB24`);
    assert.equal(metadata.depth, "uchar", `${plate.kind}/${plate.slug} is not 8-bit`);
    assert.equal(metadata.bitsPerSample, 8, `${plate.kind}/${plate.slug} does not use 8 bits per sample`);
    assert.equal(metadata.hasAlpha, false, `${plate.kind}/${plate.slug} unexpectedly has alpha`);
    assert.equal(metadata.isPalette, false, `${plate.kind}/${plate.slug} is palette-indexed`);
  }
});

test("no Pale Mother final is an exact duplicate", () => {
  const hashes = plates.map((plate) => hash(diskFile(plate)));
  assert.equal(new Set(hashes).size, hashes.length);
});

test("the permanent Pale Mother ledger reconciles every final in commission order", () => {
  const ledger = readFileSync(
    path.join(repoRoot, "Docs", "art", "SOL56_PALE_MOTHER_ART_LEDGER.md"),
    "utf8",
  );
  const rows = [...ledger.matchAll(
    /^\| [^|]+ \| `(apps\/web\/private\/codex-art\/([a-z-]+)\/([a-z0-9-]+)\.png)` \| \*\*(delivered|revised)\*\* \| ([\d,]+) \| `([a-f0-9]{64})` \|/gm,
  )];

  assert.equal(rows.length, plates.length);
  assert.deepEqual(rows.map((row) => row[1]), plates.map(finalPath));
  for (const [index, plate] of plates.entries()) {
    const file = diskFile(plate);
    assert.equal(Number(rows[index]?.[5].replaceAll(",", "")), statSync(file).size, `${plate.kind}/${plate.slug} has a stale ledger byte count`);
    assert.equal(rows[index]?.[6], hash(file), `${plate.kind}/${plate.slug} has a stale ledger hash`);
  }
});

/**
 * Every commissioned plate has somewhere to render.
 *
 * This is the check that was missing. The 22 plates were delivered, verified,
 * hashed and ledgered — and sixteen of them rendered nowhere, because the boss
 * page they belong to did not exist for this creature and two of the scene
 * plates had no slot on it even once it did. The art gates all passed. The
 * owner opened the codex and could not find her.
 *
 * A plate on disk that nothing references is not "delivered". It is lost.
 */
test("every Pale Mother plate is referenced by a surface that renders it", async () => {
  const { mythicDossiers, mythicAbilitySlug } = await import("./mythic-dossier");
  const { mythicFieldGuide } = await import("./mythic-field-guide");

  const dossier = mythicDossiers["the-pale-mother"];
  const guide = mythicFieldGuide["the-pale-mother"];
  assert.ok(dossier, "the Pale Mother has no Mythic dossier — /codex/bosses/the-pale-mother 404s and 16 plates render nowhere");
  assert.ok(guide && guide.kind === "BOSS", "the Pale Mother has no BOSS field-guide record — the boss page needs both or it 404s");

  // Where each kind of plate is allowed to be claimed from.
  const claimed = new Set<string>([
    `bosses/${dossier.arenaArtSlug}.png`,
    `bosses/${dossier.transitionArtSlug}.png`,
    `bosses/${dossier.catalogueArtSlug}.png`,
    ...dossier.gallery.map((plate) => `bosses/${plate.slug}.png`),
    // The creature, character and item plates are picked up by their own
    // dossiers from the entry slug, so those are claimed by existing.
    "creatures/the-pale-mother.png",
    "creatures/the-pale-brood.png",
    "characters/wenna-crake.png",
    "items/settled-plate.png",
    "items/brood-glass.png",
    "items/cage-rib.png",
  ]);

  const abilities = [...guide.abilities, ...(guide.phases ?? []).flatMap((phase) => phase.abilities)];
  for (const ability of abilities) claimed.add(`bosses/${mythicAbilitySlug(ability.name)}.png`);

  const orphans = commissionedPaths.filter((plate) => !claimed.has(plate));
  assert.deepEqual(orphans, [], `commissioned plates that nothing renders: ${orphans.join(", ")}`);
});

test("the boss page's ability tiles and the fight record agree on names", async () => {
  const { mythicAbilitySlug } = await import("./mythic-dossier");
  const { mythicFieldGuide } = await import("./mythic-field-guide");
  const guide = mythicFieldGuide["the-pale-mother"];
  assert.ok(guide && guide.kind === "BOSS");

  const abilities = [...guide.abilities, ...(guide.phases ?? []).flatMap((phase) => phase.abilities)];
  const delivered = new Set(commissionedPaths.filter((plate) => plate.includes("/ability-")));

  // An ability with no tile falls back to a glyph, which is by design and not
  // a failure — but a tile with no ability is art nobody will ever see.
  const tilesWithNoAbility = [...delivered].filter(
    (plate) => !abilities.some((ability) => `bosses/${mythicAbilitySlug(ability.name)}.png` === plate),
  );
  assert.deepEqual(tilesWithNoAbility, [], `ability tiles that no ability claims: ${tilesWithNoAbility.join(", ")}`);
});
