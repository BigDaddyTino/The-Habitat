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
import { bloomfallCreatureFieldGuide } from "./bloomfall-creature-field-guide";
import { mythicAbilitySlug, mythicDossiers } from "./mythic-dossier";

const plates: readonly {
  kind: CodexArtKind;
  slug: string;
  width: 1672 | 256;
  height: 941 | 256;
}[] = [
  { kind: "characters", slug: "elias-vey", width: 1672, height: 941 },
  { kind: "creatures", slug: "the-blackweir-anaconda", width: 1672, height: 941 },
  { kind: "bosses", slug: "blackweir-arena", width: 1672, height: 941 },
  { kind: "bosses", slug: "the-transformation", width: 1672, height: 941 },
  { kind: "bosses", slug: "the-catalogue", width: 1672, height: 941 },
  { kind: "items", slug: "blackweir-heart", width: 1672, height: 941 },
  { kind: "items", slug: "anaconda-hideplate", width: 1672, height: 941 },
  { kind: "items", slug: "mutated-fang", width: 1672, height: 941 },
  { kind: "bosses", slug: "ability-foreign-material", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-prisma-re-roll", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-pylon-draw", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-reactor-weather", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-lunge", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-tail-whip", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-acid-spit", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-ambush-dive", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-shedding-strike", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-grab-and-drag", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-devouring-surge", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-coil-crush", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-toxic-flood", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-tail-tsunami", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-bile-eruption", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-venomous-roar", width: 256, height: 256 },
  { kind: "bosses", slug: "ability-submerged-stalk", width: 256, height: 256 },
];

const diskFile = ({ kind, slug }: (typeof plates)[number]) =>
  path.join(process.cwd(), "private", "codex-art", kind, `${slug}.png`);

test("the Blackweir Anaconda commission has exactly its 25 unique private plates", () => {
  assert.equal(plates.length, 25);
  assert.equal(new Set(plates.map(({ kind, slug }) => `${kind}/${slug}`)).size, 25);
  assert.equal(plates.filter(({ width }) => width === 1672).length, 8);
  assert.equal(plates.filter(({ width }) => width === 256).length, 17);

  for (const plate of plates) {
    const file = diskFile(plate);
    assert.ok(existsSync(file), `${plate.kind}/${plate.slug}.png is missing`);
    assert.ok(statSync(file).size > 0, `${plate.kind}/${plate.slug}.png is empty`);
  }
});

test("every commissioned plate round-trips through the authenticated art resolver", () => {
  for (const plate of plates) {
    const filename = `${plate.slug}.png`;
    const url = `/codex-art/${plate.kind}/${filename}`;
    const file = diskFile(plate);

    assert.equal(codexArtSlot(plate.kind, plate.slug), `private/codex-art/${plate.kind}/${filename}`);
    assert.equal(findCodexArt(plate.kind, plate.slug), url);
    assert.equal(resolveCodexArtFile(plate.kind, filename), file);
    assert.equal(codexArtFileForUrl(url), file);
  }
});

test("every commissioned final satisfies the exact RGB24 PNG contract", async () => {
  const sharp = (await import("sharp")).default;

  for (const plate of plates) {
    const metadata = await sharp(diskFile(plate)).metadata();
    assert.equal(metadata.format, "png", `${plate.slug} is not PNG`);
    assert.equal(metadata.width, plate.width, `${plate.slug} has the wrong width`);
    assert.equal(metadata.height, plate.height, `${plate.slug} has the wrong height`);
    assert.equal(metadata.channels, 3, `${plate.slug} is not RGB24`);
    assert.equal(metadata.depth, "uchar", `${plate.slug} is not 8-bit`);
    assert.equal(metadata.bitsPerSample, 8, `${plate.slug} does not use 8 bits per sample`);
    assert.equal(metadata.space, "srgb", `${plate.slug} is not sRGB`);
    assert.equal(metadata.hasAlpha, false, `${plate.slug} unexpectedly has alpha`);
    assert.equal(metadata.isPalette, false, `${plate.slug} is palette-indexed`);
  }
});

test("no commissioned plate is an exact duplicate", () => {
  const hashes = plates.map((plate) =>
    createHash("sha256").update(readFileSync(diskFile(plate))).digest("hex"),
  );
  assert.equal(new Set(hashes).size, hashes.length);
});

test("the permanent ledger reconciles every final path and hash exactly once", () => {
  const ledger = readFileSync(
    path.join(process.cwd(), "..", "..", "Docs", "art", "SOL56_ANACONDA_ART_LEDGER.md"),
    "utf8",
  );
  const rows = [...ledger.matchAll(
    /^\| [^|]+ \| `(apps\/web\/private\/codex-art\/([a-z-]+)\/([a-z0-9-]+)\.png)` \| \*\*(delivered|revised)\*\* \| [\d,]+ \| `([a-f0-9]{64})` \|/gm,
  )];
  const byPath = new Map(rows.map((match) => [match[1], { status: match[4], hash: match[5] }]));

  assert.equal(rows.length, plates.length);
  assert.equal(byPath.size, plates.length);
  for (const plate of plates) {
    const finalPath = `apps/web/private/codex-art/${plate.kind}/${plate.slug}.png`;
    const finalHash = createHash("sha256").update(readFileSync(diskFile(plate))).digest("hex");
    assert.equal(byPath.get(finalPath)?.hash, finalHash, `${plate.slug} has a stale ledger hash`);
  }
});

test("the boss dossier derives all three scenes and all seventeen ability paths", () => {
  const dossier = mythicDossiers["the-blackweir-anaconda"];
  const guide = bloomfallCreatureFieldGuide["the-blackweir-anaconda"];
  assert.ok(dossier);
  assert.equal(guide?.kind, "BOSS");
  assert.deepEqual(
    [dossier.arenaArtSlug, dossier.transitionArtSlug, dossier.catalogueArtSlug],
    ["blackweir-arena", "the-transformation", "the-catalogue"],
  );

  const abilitySlugs = [
    ...(guide?.abilities ?? []),
    ...(guide?.phases ?? []).flatMap((phase) => phase.abilities),
  ].map((ability) => mythicAbilitySlug(ability.name));
  const commissionedAbilitySlugs = plates
    .filter(({ kind, slug }) => kind === "bosses" && slug.startsWith("ability-"))
    .map(({ slug }) => slug);

  assert.equal(abilitySlugs.length, 17);
  assert.deepEqual([...abilitySlugs].sort(), [...commissionedAbilitySlugs].sort());
  for (const slug of abilitySlugs) assert.equal(findCodexArt("bosses", slug), `/codex-art/bosses/${slug}.png`);
});

test("tile QA includes the live 44px implementation size", () => {
  const styles = readFileSync(
    path.join(process.cwd(), "app", "codex", "bosses", "bosses.css"),
    "utf8",
  );
  assert.match(styles, /\.mb-ability \{[^}]*grid-template-columns: 44px 1fr;/);
  assert.match(styles, /\.mb-ability-icon \{[^}]*width: 44px; height: 44px;/);
});
