import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const read = (...parts: string[]) => readFile(path.join(process.cwd(), ...parts), "utf8");

test("corrupted talent icons are wired on the calculator and class dossier", async () => {
  const [calculator, dossier] = await Promise.all([
    read("components", "talent-calculator.tsx"),
    read("app", "codex", "classes", "[slug]", "page.tsx"),
  ]);

  assert.match(calculator, /iconFor\(`corrupt-\$\{node\.phase\}`\)/);
  assert.match(calculator, /hoverCorrupt \? iconFor\(`corrupt-\$\{hoverCorrupt\.phase\}`\) : null/);
  assert.match(dossier, /icons\.get\(`\$\{entry\.slug\}-corrupt-\$\{node\.phase\}`\) \?\? null/);
});

test("the backdrop wash is a background layer that stays on the scrollport", async () => {
  const [calculator, styles] = await Promise.all([
    read("components", "talent-calculator.tsx"),
    read("app", "codex", "talents", "talents.css"),
  ]);

  assert.match(calculator, /"--talent-backdrop": `url\("\$\{backdrop\}"\)`/);
  assert.match(styles, /background-image: var\(--talent-backdrop-wash\), var\(--talent-backdrop\)/);
  assert.doesNotMatch(styles, /\.talent-board\.has-backdrop::before/);
});
