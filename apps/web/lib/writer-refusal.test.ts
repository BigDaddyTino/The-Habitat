import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { refusal, refusalMessage } from "./writer-refusal";

/**
 * A refused save has to say why.
 *
 * Every action in this app refuses bad writes in plain language, and until now
 * none of it was ever read: production redacts a thrown message to an opaque
 * digest, so a hundred and eighty different reasons all arrived as the same
 * generic failure page. The message now travels as the digest, which Next
 * leaves alone when the error already carries one.
 */

test("a refusal carries its own message to the other side", () => {
  const error = refusal("A contract is a bounty posted somewhere — pick where it is posted.");
  assert.equal(error.message, "A contract is a bounty posted somewhere — pick where it is posted.");
  assert.equal(refusalMessage(error.digest), "A contract is a bounty posted somewhere — pick where it is posted.");
  assert.ok(error instanceof Error, "it must still be a real error, so nothing downstream has to special-case it");
});

test("a genuine crash is not dressed up as advice", () => {
  // Next hashes the message for anything without a digest. Reading one of
  // those as a refusal would put a number, or someone else's internals, on
  // screen as though it were guidance for the writer.
  for (const digest of ["3960385351", "NEXT_REDIRECT;replace;/codex", "", undefined, null, "WRITER_REFUSAL::", "WRITER_REFUSAL::   "]) {
    assert.equal(refusalMessage(digest), null, `${JSON.stringify(digest)} must not read as a refusal`);
  }
});

test("a runaway message cannot bloat every payload it rides on", () => {
  const error = refusal("x".repeat(5_000));
  assert.ok(error.digest.length <= 420, "the digest travels with the response, so it stays bounded");
  assert.equal(refusalMessage(error.digest)?.length, 400);
});

test("every server action refuses through the channel that reaches somebody", () => {
  // A bare `throw new Error` is invisible again the moment it is written, and
  // it looks exactly like the ones that were invisible for months.
  const roots = [join(process.cwd(), "app")];
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) { walk(path); continue; }
      if (!/\.tsx?$/.test(name)) continue;
      const source = readFileSync(path, "utf8");
      if (!source.startsWith('"use server"')) continue;
      // Every construction, not only `throw new Error` — a helper that
      // *returns* an error for a caller to throw is just as invisible, and
      // that is exactly how the arc form's refusal escaped the first sweep.
      const bare = (source.match(/new Error\(/g) ?? []).length;
      if (bare > 0) offenders.push(`${path.replace(process.cwd(), "").replace(/\\/g, "/")} (${bare})`);
    }
  };
  for (const root of roots) walk(root);
  assert.deepEqual(offenders, [], "these actions throw a message nobody will ever read — use refusal() instead");
});

test("both landing pads read the message rather than guessing at causes", () => {
  for (const boundary of ["app/error.tsx", "app/codex/error.tsx"]) {
    const source = readFileSync(join(process.cwd(), boundary), "utf8");
    assert.match(source, /refusalMessage\(error\.digest\)/, `${boundary} must show what the server actually said`);
    // And still say something honest when it was a real crash rather than a
    // refusal — inventing a cause is what the generic page did wrong.
    assert.match(source, /refused \?/, `${boundary} must keep a separate path for an unexpected failure`);
  }
});
