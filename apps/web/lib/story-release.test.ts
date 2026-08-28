import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

/**
 * The release-canon boundary, held as properties of the source.
 *
 * The writers' room lands every save straight at CANON, and that used to mean
 * the export endpoint answered with whatever was true the second it was asked.
 * A release is a named, frozen, hash-locked cut. These tests guard the three
 * things that make that real: nothing downstream reads live canon, a cut is
 * gated harder than a deploy, and a release cannot be edited afterwards.
 *
 * The behaviour itself is exercised against the database by running the cut;
 * a test must not do that.
 */

const read = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

test("the export endpoint serves a named release and offers no way to ask for live canon", () => {
  const route = read("app", "api", "story", "export", "route.ts");
  assert.match(route, /findStoryRelease|newestStoryRelease/, "the endpoint must read releases");
  // The old behaviour: project the codex on demand. If this comes back, the
  // boundary is gone and an importer can pick up half a rewrite again.
  assert.equal(/buildStoryExport/.test(route), false, "the endpoint must not build an export from live canon");
  assert.match(route, /no_release_cut/, "with no release cut it must say so rather than falling back to live canon");
  // A release name is a frozen identity, so a request for one that does not
  // exist is a 404 rather than a silent substitution of the newest.
  assert.match(route, /no_such_release/, "an unknown release name must be an error, not a silent fallback");
});

test("a release is identified by content, not by when it was serialised", () => {
  const cut = read("scripts", "cut-story-release.ts");
  // generatedAt and revisionCursor move when nothing about the story has.
  // Hashing them makes every cut unique by construction, which defeats both
  // the no-change guard and an importer's ability to notice a no-op release.
  assert.match(cut, /generatedAt: "", revisionCursor: null/, "the content hash must normalise the timestamp and cursor");
  assert.match(cut, /byte-identical/, "cutting an unchanged canon must be refused");
});

test("a cut is gated harder than a deploy", () => {
  const cut = read("scripts", "cut-story-release.ts");
  const deploy = read("scripts", "deploy-web.ps1");
  const audit = read("scripts", "lib", "release-audit.ts");

  // One implementation, two callers — a gate that exists twice will disagree.
  assert.match(audit, /export async function runReleaseAudit/, "the checks must be a library both gates can call");
  assert.match(cut, /runReleaseAudit\(\{ honourWaivers: false \}\)/, "a cut must honour no waivers");
  assert.match(deploy, /audit-release\.ts/, "the deploy must run the audit");
  assert.equal(/--strict/.test(deploy), false, "the deploy deliberately keeps waivers — only a cut is strict");

  // Passing the checks is not enough: a finding that only passed because a
  // waiver was honoured must still stop a cut.
  assert.match(cut, /audit\.waived\.length > 0/, "a cut must refuse when anything was waived");
});

test("releases are immutable in the database, not merely by convention", () => {
  const migration = read("..", "..", "packages", "db", "prisma", "migrations", "20260828150000_add_story_releases", "migration.sql");
  assert.match(migration, /CREATE TRIGGER "StoryRelease_no_update"/, "UPDATE must be refused by the database");
  assert.match(migration, /CREATE TRIGGER "StoryRelease_no_delete"/, "DELETE must be refused by the database");
  assert.match(migration, /StoryRelease_name_key/, "release names must be unique — they are frozen identities");
  assert.match(migration, /StoryRelease_sha256_key/, "two releases must not claim the same content hash");
});

test("nothing in the read path writes", () => {
  const source = read("lib", "story-release.ts");
  for (const pattern of ["\\.create\\(", "\\.update\\(", "\\.delete\\(", "\\.upsert\\("]) {
    assert.equal(new RegExp(pattern).test(source), false, `lib/story-release.ts contains ${pattern} — reading releases must never write one`);
  }
});
