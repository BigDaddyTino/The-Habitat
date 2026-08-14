import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const webRoot = process.cwd();

test("the Legendary crest is a self-contained transparent vector asset", async () => {
  const svg = await readFile(resolve(webRoot, "public/images/live-layer/legendary-constellation-crest.svg"), "utf8");

  assert.match(svg, /viewBox="0 0 1200 675"/);
  assert.match(svg, /Antlered mountain constellation/);
  assert.ok((svg.match(/<circle\b/g) ?? []).length >= 50, "constellation should retain its authored star field");
  assert.doesNotMatch(svg, /<image\b|data:image|<rect\b[^>]*fill=/, "asset must not hide a raster or solid background");
});

test("every Live Layer visual remains connected to an authored anchor", async () => {
  const [hall, hallCss, cards, globalCss, rewards, rewardCss] = await Promise.all([
    readFile(resolve(webRoot, "components/hall-atmosphere.tsx"), "utf8"),
    readFile(resolve(webRoot, "app/hall-cinematic.css"), "utf8"),
    readFile(resolve(webRoot, "components/world-card.tsx"), "utf8"),
    readFile(resolve(webRoot, "app/globals.css"), "utf8"),
    readFile(resolve(webRoot, "components/reward-ceremony.tsx"), "utf8"),
    readFile(resolve(webRoot, "app/reward-system.css"), "utf8"),
  ]);

  assert.match(hall, /legendary-constellation-crest\.svg/);
  for (const selector of [".hall-live-constellation", ".hall-live-crowd", ".hall-live-trophy", ".hall-live-announcement"]) assert.match(hallCss, new RegExp(selector.replace(".", "\\.")));
  assert.match(cards, /world-portal-reaction/);
  assert.match(globalCss, /\.world-card\.state-sleeping:not\(\.live-portal-ignite\) \.world-portal-reaction\{display:none\}/);
  // The layers must start out of the box tree, not merely transparent, or their
  // infinite decorative loops run on every idle page.
  assert.match(globalCss, /\.world-portal-reaction \{[^}]*display:none;/);
  assert.match(hallCss, /\.hall-live-impact,\.hall-live-constellation,\.hall-live-crowd,\.hall-live-trophy,\.hall-live-announcement\{[^}]*display:none;/);
  for (const activated of [".live-constellation .hall-live-constellation", ".live-hall-crowd .hall-live-crowd", ".hall-is-busy .hall-live-crowd", ".live-trophy-ceremony .hall-live-trophy", ".hall-live-announcement.is-live"]) {
    assert.match(hallCss, new RegExp(`${activated.replaceAll(".", "\\.")}\\{display:(block|grid)`), `${activated} must restore its display`);
  }
  assert.match(globalCss, /\.world-card\.live-portal-sputter/);
  assert.match(rewards, /kind-\$\{toast\.kind\}/);
  assert.match(rewardCss, /\.reward-ceremony\.kind-world/);
  assert.match(rewardCss, /\.reward-toast-card \{ right:12px; bottom:12px; left:12px;[^}]*width:auto;/);
  assert.match(rewards, /particles\.position\.set\(mobile \? -0\.95 : 2\.8, mobile \? -2\.36 : -1\.55, 0\)/);
  assert.match(rewards, /ring\.scale\.setScalar\(mobile \? 0\.62 : 1\)/);
});
