import assert from "node:assert/strict";
import test from "node:test";
import { cleanSpokenText, roleFromName, speakerResolverFor, splitBodyIntoLines } from "./dialogue-split";

const characters = [
  { slug: "tino", title: "Tino" },
  { slug: "the-kestrel-commander", title: "Commander Rook" },
  { slug: "wendy", title: "Wendy", fullName: "Wendy" },
  { slug: "steve", title: "Steve" },
];
const resolve = speakerResolverFor(characters, null);

test("plain attribution, several to a paragraph, straight and curly quotes", () => {
  const body = 'A mercenary fires over cover. MERCENARY: "Pearl\'s pushing the east street!" TINO: "Then let \'em. We\'re getting boxed in."\n\nWENDY: “Look at this sad sack of shit.”';
  const lines = splitBodyIntoLines(body, resolve);
  assert.deepEqual(lines.map((line) => [line.speakerSlug, line.speakerRole, line.text]), [
    [null, "mercenary", "Pearl's pushing the east street!"],
    ["tino", null, "Then let 'em. We're getting boxed in."],
    ["wendy", null, "Look at this sad sack of shit."],
  ]);
  assert.ok(lines.every((line) => line.voiced && !line.unattributed));
});

test("a direction after the name, in parentheses, or before the quote", () => {
  const lines = splitBodyIntoLines(
    'TINO, in a whisper: "Pearl contractors."\n\nTINO: (from the ground, and it costs him) "Come on. Wake the fuck up."\n\nTINO (flat): "Locked."',
    resolve,
  );
  assert.deepEqual(lines.map((line) => line.performance), ["in a whisper", "from the ground, and it costs him", "flat"]);
  assert.deepEqual(lines.map((line) => line.text), ["Pearl contractors.", "Come on. Wake the fuck up.", "Locked."]);
});

test("a bare quote after an attributed one continues the same speaker, with the narration as direction", () => {
  const lines = splitBodyIntoLines('TINO: "Locked." He surveys the incoming battle. "Naturally."', resolve);
  assert.equal(lines.length, 2);
  assert.equal(lines[1].speakerSlug, "tino");
  assert.equal(lines[1].text, "Naturally.");
  assert.equal(lines[1].performance, "He surveys the incoming battle.");
});

test("a paragraph that names exactly one character in its narration proposes them as the speaker", () => {
  const lines = splitBodyIntoLines('Tino\'s verdict depends on who you are. To the soldier: "Still got it." To the caster: "Jesus."', resolve);
  assert.deepEqual(lines.map((line) => [line.speakerSlug, line.text]), [["tino", "Still got it."], ["tino", "Jesus."]]);
  assert.equal(lines[0].performance, "Tino's verdict depends on who you are. To the soldier:");
  // Two characters named: nobody is guessed.
  const two = splitBodyIntoLines('Tino looks at Steve. "Well?"', resolve);
  assert.equal(two[0].unattributed, true);
});

test("a quote with no attribution anywhere in its paragraph is unattributed and not voiced", () => {
  const lines = splitBodyIntoLines('A radio call pulls one through a doorway. "Two."', resolve);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].speakerRole, "unattributed");
  assert.equal(lines[0].voiced, false);
  assert.equal(lines[0].unattributed, true);
});

test("the Kestrel commander answers to COMMANDER through the node speaker and to ROOK by title", () => {
  const onNode = speakerResolverFor(characters, { slug: "the-kestrel-commander", title: "Commander Rook" });
  assert.equal(onNode("COMMANDER"), "the-kestrel-commander");
  assert.equal(resolve("ROOK"), "the-kestrel-commander");
  // Without the node speaker, a bare COMMANDER is a role: it could be Wade.
  assert.equal(resolve("COMMANDER"), null);
  assert.equal(roleFromName("COMMANDER"), "commander");
});

test("roles are kebab-case, and labels that are not speakers are skipped", () => {
  assert.equal(roleFromName("PEARL MERC 1"), "pearl-merc-1");
  assert.equal(roleFromName("RADIO 2"), "radio-2");
  const lines = splitBodyIntoLines('OBJECTIVE: "REACH FORWARD CAMP KESTREL." GUARD: "Hold! HOLD!"', resolve);
  assert.deepEqual(lines.map((line) => line.speakerRole), ["guard"]);
});

test("spoken text is stripped of markdown and bible links", () => {
  assert.equal(cleanSpokenText("Go to **the Forge** at [[forward-camp-kestrel]], *now*."), "Go to the Forge at forward camp kestrel, now.");
  const lines = splitBodyIntoLines('TINO: "You still with **me**?"', resolve);
  assert.equal(lines[0].text, "You still with me?");
});

test("headings are never dialogue", () => {
  const lines = splitBodyIntoLines('## Beat 1 — Get cleaned up\n\nWENDY: “Go with Steve.”', resolve);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].speakerSlug, "wendy");
});
