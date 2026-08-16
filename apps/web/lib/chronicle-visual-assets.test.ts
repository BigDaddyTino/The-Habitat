import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { chronicleKindColor, chronicleReplayKinds } from "./chronicle-replay";

const webRoot = process.cwd();

async function pngInfo(filename: string) {
  const bytes = await readFile(resolve(webRoot, `public/images/chronicle/${filename}`));
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], `${filename} must remain a PNG`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), colorType: bytes[25] };
}

test("Chronicle cinematic artwork keeps its authored resolution and transparent overlays", async () => {
  const [hero, projector, recap, reliquary] = await Promise.all([
    pngInfo("chronicle-theater-hero.png"),
    pngInfo("chronicle-projector.png"),
    pngInfo("chronicle-recap-card.png"),
    pngInfo("chronicle-member-reliquary.png"),
  ]);
  assert.deepEqual(hero, { width: 1828, height: 860, colorType: 2 });
  assert.deepEqual(projector, { width: 1202, height: 1309, colorType: 6 });
  assert.deepEqual(recap, { width: 1672, height: 941, colorType: 2 });
  assert.deepEqual(reliquary, { width: 1254, height: 1254, colorType: 6 });
});

test("Chronicle artwork stays wired to motion-safe UI and local recap export", async () => {
  const [page, replay, styles] = await Promise.all([
    readFile(resolve(webRoot, "app/chronicle/page.tsx"), "utf8"),
    readFile(resolve(webRoot, "components/chronicle-replay.tsx"), "utf8"),
    readFile(resolve(webRoot, "app/chronicle-replay.css"), "utf8"),
  ]);
  assert.match(page, /chronicle-projector\.png/);
  assert.match(styles, /chronicle-theater-hero\.png/);
  assert.match(styles, /chronicle-recap-card\.png/);
  assert.match(styles, /chronicle-member-reliquary\.png/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
  assert.match(replay, /canvas\.toBlob\(resolve, "image\/png"\)/);
  assert.match(replay, /No Chronicle data is sent to a third party/);
});

test("the exported recap palette matches the on-screen scene palette for every kind", async () => {
  const styles = await readFile(resolve(webRoot, "app/chronicle-replay.css"), "utf8");
  for (const kind of chronicleReplayKinds) {
    const scene = new RegExp(`\\.replay-screen\\.kind-${kind}[^{]*\\{--scene:(#[0-9a-f]{6})\\}`).exec(styles);
    assert.ok(scene, `kind-${kind} needs a --scene colour in chronicle-replay.css`);
    assert.equal(chronicleKindColor(kind), scene[1], `kind-${kind} must render the same colour on screen and on the recap card`);
  }
});
