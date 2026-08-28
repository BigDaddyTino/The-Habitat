import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

/**
 * The release audit is only a gate for as long as the deploy actually runs it,
 * and only read-only for as long as nobody adds a convenient write to it. Both
 * are properties of the source rather than of any single run, so both are held
 * here — the audit's own findings are exercised against the live database by
 * running it, which a test must not do.
 */

const audit = () => readFileSync(join(process.cwd(), "scripts", "audit-release.ts"), "utf8");
const deploy = () => readFileSync(join(process.cwd(), "scripts", "deploy-web.ps1"), "utf8");

test("the release audit never writes", () => {
  const source = audit();
  // Every Prisma mutation, plus the filesystem writes. `findMany`/`count` and
  // `existsSync`/`readFileSync`/`readdirSync` are the whole permitted surface.
  const forbidden = [
    "\\.create\\(", "\\.createMany\\(", "\\.update\\(", "\\.updateMany\\(", "\\.upsert\\(",
    "\\.delete\\(", "\\.deleteMany\\(", "\\$executeRaw", "\\$transaction\\(",
    "writeFile", "writeFileSync", "appendFile", "mkdir", "rmSync", "unlink",
  ];
  for (const pattern of forbidden) {
    const found = new RegExp(pattern).test(source);
    assert.equal(found, false, `audit-release.ts contains ${pattern} — it runs against production before a deploy and must stay read-only`);
  }
});

test("the audit reports fill-later references instead of failing on them", () => {
  const source = audit();
  // The distinction the whole namespace check turns on: a reference that
  // resolves in the wrong pool is a mistake, one that resolves nowhere is a
  // plan. Collapsing them would make the gate unusable on a working codex.
  assert.match(source, /const wrong = otherPools\.find/, "wrong-pool detection must be what produces a failure");
  assert.match(source, /else unresolved \+= 1;/, "an unresolved reference must be counted, not failed");
});

test("the deploy runs the audit before it builds, and can only skip it deliberately", () => {
  const source = deploy();
  const auditAt = source.indexOf("audit-release.ts");
  const buildAt = source.indexOf("pnpm --filter @habitat/web build");
  assert.ok(auditAt > 0, "deploy-web.ps1 must run the release audit");
  assert.ok(buildAt > 0, "deploy-web.ps1 must run the production build");
  assert.ok(auditAt < buildAt, "the audit has to run BEFORE the build, or a bad release still costs a build");

  // A non-zero exit has to stop the deploy outright.
  assert.match(source, /if \(\$auditExit -ne 0\) \{\s*\n\s*throw /, "a failing audit must throw rather than warn");
  // And the escape hatch has to be an explicit switch that says so twice.
  assert.match(source, /\[switch\] \$SkipAudit/, "skipping must be an explicit opt-in");
  assert.equal((source.match(/if \(\$SkipAudit\)/g) ?? []).length, 2, "a skipped audit must be announced at the start and again at the end");
});

test("every waiver carries the reason it is not a blocker", () => {
  const source = audit();
  const block = source.slice(source.indexOf("const waivers"), source.indexOf("const artworkFindingCodes"));
  assert.ok(block.length > 0, "the waiver map should be readable by this test");
  // An empty map is the healthy state and the one we are in — the only waiver
  // this ever held was Port Arcadia's artwork, now actually recalibrated. The
  // rule only bites once somebody adds one back.
  const entries = [...block.matchAll(/"([a-z0-9.-]+)":\s*\n?\s*"([^"]+)"/gi)];
  for (const [, path, reason] of entries) {
    // A waiver without a reason is just a check somebody turned off.
    assert.ok(reason.length > 60, `the waiver for ${path} does not say why it is accepted`);
  }
});
