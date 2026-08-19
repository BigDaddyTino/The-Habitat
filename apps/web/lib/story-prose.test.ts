import assert from "node:assert/strict";
import test from "node:test";
import { parseStoryProse, plainStoryProse, splitStoryParagraphs, storyProseLinks, unwrittenLinkLabel, type ProseToken } from "./story-prose";

/** Flattens tokens to a readable shape so assertions stay legible. */
const shape = (tokens: ProseToken[]): unknown =>
  tokens.map((token) =>
    token.kind === "text" ? token.text
      : token.kind === "link" ? { link: token.slug }
      : { [token.kind]: shape(token.children) });

test("plain prose survives untouched", () => {
  assert.deepEqual(shape(parseStoryProse("Nothing to mark up here.")), ["Nothing to mark up here."]);
});

test("bold, italic, and cross-references are recognised", () => {
  assert.deepEqual(shape(parseStoryProse("a **bold** b")), ["a ", { bold: ["bold"] }, " b"]);
  assert.deepEqual(shape(parseStoryProse("a *soft* b")), ["a ", { italic: ["soft"] }, " b"]);
  assert.deepEqual(shape(parseStoryProse("see [[the-soul-forge]].")), ["see ", { link: "the-soul-forge" }, "."]);
});

test("a link inside bold still resolves — canon is full of them", () => {
  // "**Most battles worth fighting are about a [[the-soul-forge]].**" is real
  // prose from the shelf; a flat parser would have swallowed the link whole.
  assert.deepEqual(
    shape(parseStoryProse("**about a [[the-soul-forge]].**")),
    [{ bold: ["about a ", { link: "the-soul-forge" }, "."] }],
  );
});

test("two asterisks are never mistaken for one", () => {
  assert.deepEqual(shape(parseStoryProse("**a** and *b*")), [{ bold: ["a"] }, " and ", { italic: ["b"] }]);
});

test("unbalanced or stray marks stay literal rather than eating the sentence", () => {
  assert.deepEqual(shape(parseStoryProse("2 * 3 is not italic")), ["2 * 3 is not italic"]);
  assert.deepEqual(shape(parseStoryProse("an **unclosed bold")), ["an **unclosed bold"]);
  assert.deepEqual(shape(parseStoryProse("[[Not A Slug]]")), ["[[Not A Slug]]"]);
  assert.deepEqual(shape(parseStoryProse("[[]]")), ["[[]]"]);
});

test("no markup can smuggle HTML through", () => {
  // Everything is composed into React elements from these tokens, so angle
  // brackets are text and stay text.
  assert.deepEqual(shape(parseStoryProse("<script>alert(1)</script>")), ["<script>alert(1)</script>"]);
  assert.deepEqual(shape(parseStoryProse("**<b>x</b>**")), [{ bold: ["<b>x</b>"] }]);
});

test("paragraphs split on blank lines and drop the empties", () => {
  assert.deepEqual(splitStoryParagraphs("one\n\ntwo\n\n\n  three  "), ["one", "two", "three"]);
  assert.deepEqual(splitStoryParagraphs("   "), []);
});

test("every referenced slug can be collected once for a single lookup", () => {
  assert.deepEqual(storyProseLinks("[[a-b]] then [[c]] then [[a-b]] again"), ["a-b", "c"]);
  assert.deepEqual(storyProseLinks("nothing here"), []);
});

test("an unwritten reference reads as words, not as a key", () => {
  assert.equal(unwrittenLinkLabel("the-captivity-arc"), "the captivity arc");
});

test("parsing is not left holding state between calls", () => {
  // The pattern is module-level and global; forgetting lastIndex would make the
  // second identical call return something different from the first.
  const once = shape(parseStoryProse("[[a]] and [[b]]"));
  const twice = shape(parseStoryProse("[[a]] and [[b]]"));
  assert.deepEqual(once, twice);
});

test("plain rendering strips markup without ever leaving a raw marker", () => {
  assert.equal(plainStoryProse("The counterpart of [[fled-the-island]]."), "The counterpart of fled the island.");
  assert.equal(plainStoryProse("**Most battles are about a [[the-soul-forge]].**"), "Most battles are about a the soul forge.");
  assert.equal(plainStoryProse("nothing to strip"), "nothing to strip");
  // Whatever a card shows, it never shows the source markers.
  for (const sample of ["a [[b-c]] d", "**x**", "*y*", "[[z]]"]) {
    const plain = plainStoryProse(sample);
    assert.doesNotMatch(plain, /\[\[|\]\]/, `${sample} left brackets behind`);
    assert.doesNotMatch(plain, /\*/, `${sample} left asterisks behind`);
  }
});
