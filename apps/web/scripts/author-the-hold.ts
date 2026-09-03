import "../lib/environment";
import { randomUUID } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { metaSchemasByKind } from "../lib/story-meta-schemas";
import { stableJson } from "./lib/story-authoring";

/**
 * THE HOLD — an owner correction to how death works, 2026-09-03.
 *
 * The ruling, in Tino's words: *"when Essence runs out they die. Only the
 * player doesn't. The player loses levels and stats when he has no Essence
 * instead of straight dying because he is special. But fort captures and what
 * not will take forever if the NPCs never died completely."* Then: *"people
 * waiting is good but their dead corpses are still on the field — like the
 * physical flesh and bone is still on the field."* And: the Forge keeper
 * matters enormously, *"because some have learned how to manipulate the system
 * and put others ahead of someone else."*
 *
 * `reclamation` said the opposite — "nobody dies permanently; they come back
 * less" — as a law, for everybody. That was wrong, and it had already put the
 * codex in tension with itself: `the-kestrel-quartermaster`'s dossier says a
 * shortfall on the island KILLED somebody. The fiction was assuming this rule
 * before the system dossier stated it.
 *
 * What the corrected system says:
 *
 *   reserve covers it  -> comes back whole
 *   reserve short      -> the Forge HOLDS. Echo lit, name known, and the
 *                         corpse still out on the ground where it fell.
 *   never paid         -> dead. That is how most people end.
 *   THE PLAYER, alone  -> built underbuilt out of whatever is in the reserve.
 *                         Nobody in the world can explain it.
 *
 * And because a hold is a queue, **the keeper decides who lives**, which is
 * the most common corruption in the setting and does not look like corruption.
 *
 * Every replacement below is anchored and asserted: if the text it expects has
 * moved, the script throws rather than silently writing nothing.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-the-hold.ts
 *   pnpm --filter @habitat/web exec tsx scripts/author-the-hold.ts --apply
 */

const db = getPrismaClient();
const apply = process.argv.includes("--apply");

/**
 * `sentinel` exists for the one shape of edit that is not self-detecting: an
 * INSERT, where the replacement still contains its own anchor and would match
 * again on the next run and duplicate itself. When a sentinel is present in
 * the body, the splice is already done.
 */
type Splice = { slug: string; note: string; find: string; replace: string; sentinel?: string };

// ------------------------------------------------------- reclamation, corrected

const spliceSets: Splice[] = [
  {
    slug: "reclamation",
    note: "the shortfall becomes a hold, and the player becomes the exception",
    find: `A base therefore keeps an Essence reserve, and that reserve is a resource the party can actually run out of. **If there is not enough, the Forge builds what it can afford — and the shortfall is paid out of the person: experience is lost and levels go down.** Nobody dies permanently; they come back *less*, which is a far more interesting punishment and one the party will feel for hours.`,
    replace: `A base therefore keeps an Essence reserve, and that reserve is a resource the party can actually run out of.

**If there is not enough, the Forge does not build a cheaper person. It holds.** The Echo stays lit in the Core with the name known, nothing is refused and nothing is returned, and **the body stays out on the ground where it fell** — flesh and bone, in the open, for as long as the waiting lasts. A settlement in that state has its dead in the machine and its dead in the field at the same time, and it is the second one the living have to walk past.

**A hold that is never paid is how almost everybody in this world actually ends.** The Essence never arrives. The settlement falls. The Forge is taken. Another name is sequenced ahead and there is nothing left by the time the queue reaches theirs. That is not a special tragedy, it is the ordinary one, and it is why a fort changes hands with bodies still on it.

**The player is the one exception, and nobody has explained it.** Where the machine holds anybody else, it builds the player — underbuilt, out of whatever the reserve actually has, and the difference comes out of the person: experience is lost and levels go down. They come back *less* instead of not coming back at all. Reclamation is a spectacle with witnesses, so people have stood in that room and watched a Forge do for one person what it has never done for anybody they have buried. Nobody has an answer. It is also true, and nobody has connected the two, that the player has worn [[nag]] since the first hour of the campaign and cannot take it off.`,
  },
  {
    slug: "reclamation",
    note: "the floor no longer sits beneath levels",
    find: `**And there is a floor beneath the levels.** Reclamation needs a living Forge`,
    replace: `**And there is a floor beneath all of it.** Reclamation needs a living Forge`,
  },
  {
    slug: "reclamation",
    note: "the designed shortfall paragraph is the player's rule only",
    find: `**The shortfall.** The Forge spends what it has and the person makes up the difference: every 11.7 Essence short is one level, down to a floor of 1. They come back *less*, they feel it for hours, and nobody dies of it.`,
    replace: `**The shortfall is the player's, and only the player's.** The Forge spends what it has and the difference comes out of the person: every 11.7 Essence short is one level, down to a floor of 1. They come back *less*, they feel it for hours, and they do not die of it. For everybody else in the world a shortfall is a **hold**, and the same arithmetic decides how long they wait rather than how small they arrive.`,
  },
  {
    slug: "reclamation",
    note: "the hold is the whole short case, not just the sub-35 case",
    find: `**And below the floor, the dead wait.** A Forge holding under 35 Essence cannot build any vessel at all — so it does not refuse, it **holds**. The Echo stays lit in the Core and the person is neither returned nor lost. A settlement in that state has its dead sitting in the machine with their names known, and getting them back is a hunt for Essence: which is [[gathering-and-harvest]], which is [[the-harvest-economy]], which is the exact pressure this system exists to create. Write it as people waiting, never as a queue on a status bar. How long anyone can be held is **not** answered here, and is the same gap [[the-soul-forge]] keeps open.`,
    replace: `**The hold, which is what happens to nearly everyone.** Short of the full cost — and below 35 Essence, where the Forge cannot build any vessel at all — it does not refuse, it **holds**. The Echo stays lit in the Core, the person is neither returned nor lost, and the body is still lying wherever it fell. A settlement in that state has its dead sitting in the machine with their names known and its dead lying in the open at the same time, and getting them back is a hunt for Essence: which is [[gathering-and-harvest]], which is [[the-harvest-economy]], which is the exact pressure this system exists to create. Write it as people waiting, never as a queue on a status bar.

How long anyone can be held is **not** answered here, and is the same gap [[the-soul-forge]] keeps open — and it is now load-bearing rather than decorative, because it is the whole distance between a rescue and a funeral.

**Which makes the keeper the most powerful person in the settlement.** One body at a time, sequenced by whoever holds Logistics at master rung, or by whichever Sexton keeps the hall ([[the-congregation-of-the-bound]]). When the reserve covers everybody, the order is a formality. When it does not, **the order is who lives**, and every person in that room knows it.

Some keepers have learned to work it, and they do not do it by refusing anybody — a refusal is visible and gets answered. They do it by sequencing. A name moved up. A name moved back one more day. A body held while the reserve goes on somebody who was brought in after them. Every one of those decisions is defensible on its own, none of them is written down as what it was, and it is done for money, for family, for a commander who asked, for the faction that pays the stipends, and sometimes for a reason the keeper would call mercy and would defend to your face.

**This is the most common corruption in the setting and it does not look like corruption.** It looks like a tired person with a ledger making a hard call. It is why a platform ledger is worth reading, why an honest keeper is worth more than an honest general, and why the order in the book is an accusation as often as it is a record. Write the Sexton who has never once moved a name. Write the quartermaster who did it twice, years ago, and has not slept properly since.`,
  },
  {
    slug: "reclamation",
    note: "levels come back for the player, and the writers' rules change",
    find: `- **Your levels do,** unless the reserve was short.`,
    replace: `- **Your levels do,** unless you are the player and the reserve was short. Nobody else is ever rebuilt small; they are held instead.`,
  },
  {
    slug: "reclamation",
    note: "the never-do list",
    find: `Never let a shortfall kill anyone; the punishment is levels and waiting, never permanence.`,
    replace: `Never let a shortfall kill the player — their punishment is levels, and it is theirs alone. Never write anybody else rebuilt underbuilt; the machine has done that for one person in the history of the world. Never let a held body disappear off the field: the flesh stays where it fell for as long as the Echo waits, and a settlement that has been holding its dead for a month looks like one.`,
  },
  {
    slug: "reclamation",
    note: "addendum step 6",
    find: `- **6 · Shortfall, or hold.** Short, and you come back underbuilt: one attribute rung for every 11.7 Essence missing. Under 35, and the Forge holds you, lit, with your name known, until somebody brings Essence.`,
    replace: `- **6 · Shortfall, or hold.** Short, and the Forge **holds** you — lit, name known, body still on the ground — until somebody brings Essence or nobody ever does. **Unless you are the player**, who is built underbuilt instead: one attribute rung for every 11.7 Essence missing. Nobody in the world can say why the machine will do that for one person, and people have watched it happen.`,
  },
  {
    slug: "reclamation",
    note: "the shortfall-resolved paragraph",
    find: `**The shortfall, resolved.** Canon's arithmetic is savage at mid-level — a level-14 character rebuilt from a reserve of 101 comes back at level 6 — and canon also says they come back less, feel it for hours, and nobody dies of it. Both are true under one rule: **every shortfall costs one rung permanently, and the remainder regrows** at about a rung a day of rest and food, faster with a cook and a medic. Death always leaves a mark on the pattern; a bad night is survivable. So *hold* versus *shortfall* is days in the machine against one permanent rung and days of weakness — and [[professions]]' Culinary and Medicine have a job the morning after every death.`,
    replace: `**The shortfall, resolved.** The arithmetic is savage at mid-level — a level-14 player rebuilt from a reserve of 101 comes back at level 6 — and they come back less, feel it for hours, and do not die of it. Both are true under one rule: **every shortfall costs one rung permanently, and the remainder regrows** at about a rung a day of rest and food, faster with a cook and a medic. Death always leaves a mark on the pattern; a bad night is survivable, and [[professions]]' Culinary and Medicine have a job the morning after every death.

For everybody else there is no *versus*. Short is a hold, and a hold is days or weeks in a machine with a body in the open and a queue in front of it, ending in a platform or in a grave depending on things that have nothing to do with them.`,
  },
  {
    slug: "attributes",
    note: "the rung cost is the player's exception",
    find: `- **A shortfall costs a rung.** Every 11.7 Essence the Forge is short is one rung off the attribute it built worst. The first one is gone for good; the rest regrow at about one a day, faster with a cook and a medic.`,
    replace: `- **A shortfall costs a rung — and only the player ever pays it.** Every 11.7 Essence the Forge is short is one rung off the attribute it built worst. The first one is gone for good; the rest regrow at about one a day, faster with a cook and a medic. Anybody else short of the full cost is **held** rather than built small ([[reclamation]]).`,
  },
];

// --------------------------------------------- the Peninsula entries, corrected

/** Same shape as a Splice; kept separate only so the two lists read apart. */
type Rewrite = Splice;

const peninsula: Rewrite[] = [
  {
    slug: "the-radiant-path",
    note: "the ladder is a bill, not a damage report",
    find: `Standing rises with reclamations. In a settlement where every passage draws a reserve that everybody shares, **the Path has made dying an act of devotion** — and its own ladder, read backwards, is a damage report. [[reclamation]] pays a short reserve out of the person, so the most devout people in the Southside are the most diminished people in it, and they experience that as humility.

Nobody inside the movement reads the ledger. One man did, which is why he left the Congregation to join them, and he has never told them what it says.`,
    replace: `Standing rises with reclamations. In a settlement where every passage draws a reserve everybody shares, **the Path has made dying an act of devotion** — and the reserve does not refill before the next person needs it.

[[reclamation]] does not build a cheaper body for somebody who cannot afford a whole one. It **holds** them: the Echo lit, the name known, and the body lying wherever it fell until Essence arrives or nobody ever brings any. So the ladder is not a record of faith. **It is a record of Essence spent, and the bill goes to whoever dies next in that district without having asked for any of this.** The Path's most devout are not its most damaged. They are its most expensive, and somebody else is holding the invoice, out past the wall, under a stone.

And a hold is a queue, so somebody sequences it. Nobody inside the movement reads the ledger. One man did — which is why he left the Congregation to join them, and why he has never told them what the order in it means.`,
  },
  {
    slug: "ivo-crane",
    note: "eleven passages are a debt, not a lobotomy",
    find: `He has died eleven times, which by [[the-radiant-path]]'s ladder makes him Radiant, and by [[the-platform-ledger]]'s makes him something else.

[[reclamation]] pays a short reserve out of the person. [[the-southside]]'s reserve has been Thin for two winters. **He did not become a fanatic. He was reduced to one**, one passage at a time, and nobody who has lost it can miss it, so he does not know, and the arc never says so in a line of dialogue. It is in the ledger. The ledger is readable. That is all.

**What he was.** A foundry rigger with a union card, a trade, and a good head for load. He still talks about people the way he used to talk about a lift — *that'll hold, that won't* — and the vocabulary is now smaller than the man it belongs to.`,
    replace: `He has died eleven times, which by [[the-radiant-path]]'s ladder makes him Radiant, and by [[the-platform-ledger]]'s makes him something worse.

He came back whole every time. That is the problem. [[the-southside]]'s reserve has been Thin for two winters, and a Forge short of the full cost does not build a cheap body — it **holds** one, with the corpse still out where it fell, until somebody pays or nobody ever does. Eleven times the reserve covered Ivo Crane. **Eleven times it was somebody else who waited**, and the ledger records the order, and the order is the accusation.

**He has never once been the one held.** Not in eleven deaths, in a district that cannot afford four. Nobody has asked him why, and the answer is not courage: it is that [[wren-salloway]] pays, and a keeper who is paid sequences, and a man who is always sequenced first has been buying his own resurrection out of other people's graves without ever seeing a bill. **The Choir has been purchasing his place in the queue since the second passage.**

He does not know. He is not stupid and he has simply never been given a reason to count, and the arc never says any of this in a line of dialogue. It is in the ledger. The ledger is readable. That is all.

**What he was.** A foundry rigger with a union card, a trade, and a good head for load. He still talks about people the way he used to talk about a lift — *that'll hold, that won't* — and he is not afraid of dying, in a district where his not being afraid has killed people.`,
  },
  {
    slug: "the-marker",
    note: "who is actually in her ground",
    find: `**Who is in her ground.** Not the poor. A short reserve is paid out of the person, so nobody in Arcadia dies for want of money; they come back less. The two kinds who stay dead are the unbound, whose Echo no Forge holds, and the Unregistered, whose pattern no Forge resolves. Her field is both, and nothing else.`,
    replace: `**Who is in her ground.** Three kinds, and the third is most of them. The **unbound**, whose Echo no Forge holds. The **Unregistered**, whose pattern no Forge can resolve. And everybody whose **hold was never paid** — held in the machine with their name known and their body in the open, while the reserve went to somebody sequenced ahead of them, until it stopped mattering ([[reclamation]]).

She buries the third kind by the dozen and it is the plainest arithmetic on the peninsula: a district that has made dying into a promotion runs its reserve down, and the people who die on an empty reserve are never the ones who chose to.`,
  },
  {
    slug: "the-stone-field",
    note: "who is actually buried here",
    find: `**Who is actually buried here.** Not the poor. A short reserve is paid out of the person, not out of their life ([[reclamation]]), so nobody in [[port-arcadia]] dies for want of money — they come back less. The two kinds of people who stay dead are the **unbound**, whose Echo no Forge holds, and the **Unregistered**, whose pattern no Forge can resolve. This field is both, and nothing else.

Which is why [[the-radiant-path]]'s free binding is not a kindness. It is the difference between a platform and a stone.`,
    replace: `**Who is actually buried here.** Three kinds. The **unbound**, whose Echo no Forge holds. The **Unregistered**, whose pattern no Forge can resolve. And — most of this field — the **held**: people the Forge could not afford to build, kept lit in the Core with their names known and their bodies out in the open, while the reserve went to somebody else, until nobody was coming ([[reclamation]]).

Which is why [[the-radiant-path]]'s free binding is not a kindness and why its ladder is not harmless. Binding is the difference between a platform and a stone. **Devotion is what empties the reserve that decides which one you get.**`,
  },
  {
    slug: "the-platform-ledger",
    note: "the ledger records the order, and the order is who lived",
    find: `- **A damage report.** A short reserve is paid out of the person, so the count is also how much of them is gone.`,
    replace: `- **An order of service.** A short reserve does not build a cheap body, it **holds** one — so when a hall is behind, the Sexton sequences, and the ledger is the record of who was sequenced first. In a district that has been Thin for two winters, the order in the book is who lived. Reading it beside a list of who paid the stipends is how a keeper gets found out.`,
  },
  {
    slug: "imogen-roe",
    note: "thirty years and she has never moved a name",
    // An insert: the replacement carries the anchor with it, so without the
    // sentinel a second run would file the paragraph twice.
    sentinel: "never once moved a name",
    find: `**Her actual position**, which she will give plainly if asked:`,
    replace: `**And in thirty years she has never once moved a name.** A hall that is behind sequences its queue, and a Sexton who sequences decides who is built and who keeps waiting with their body still out in the open ([[reclamation]]). Roe has been offered money for it, asked for it as a favour, and screamed at for it, and the order in her book has never in three decades been anything but the order they came in. She does not talk about this and does not think it makes her admirable. It is simply the second half of the office, and it is the half [[corrin-ade]] left over.

**Her actual position**, which she will give plainly if asked:`,
  },
  {
    slug: "corrin-ade",
    note: "his grievance is the order, not the count",
    find: `He read eleven years of his own handwriting and found what anybody would find: that the count is not distributed the way a merciful machine would distribute it, that some names recur and some appear once and stop, and that a hall short on reserve sequences its queue by something, and the something is not need. He took it to his own church. His own church said, correctly, that a ledger is a record and not an accusation, and that the Congregation seats no throne and races nobody.`,
    replace: `He read eleven years of his own handwriting and found what anybody would find: that some names recur and some appear once and stop, and that a hall short on reserve does not build cheap bodies — it **holds** them and then chooses ([[reclamation]]). The count was never the finding. **The order was.** Somebody is sequenced first and somebody lies in the open until it stops mattering, and the something that decides between them is not need.

He took it to his own church. His own church said, correctly, that a ledger is a record and not an accusation, and that the Congregation seats no throne and races nobody.`,
  },
];

// ----------------------------------------------------------------- the arc node

const thinReserveBody = `A number, available to anybody who thinks to look, at any Forge hall in the city: **Healthy, Thin, Dry.**

[[the-southside]] has been Thin for two winters, and Thin is not an inconvenience. [[reclamation]] does not build a cheap body for somebody the reserve cannot cover — it **holds** them: Echo lit in the Core, name known, and **the body left lying wherever it fell** until Essence arrives or nobody ever brings any. A hold nobody pays is a grave, and that is how most people on this peninsula end.

So the Path's arithmetic is simple and nobody inside it has done it. **Devotion spends the reserve. The reserve is shared. The people who die on an empty one are never the ones who chose to.** Every passage the movement celebrates is Essence that a rigger who fell off a crane on the wrong afternoon is not going to get, and that rigger goes out to [[the-stone-field]] with one word on him.

**And a hold is a queue, so somebody sequences it.** That is the second half of a keeper's office and the most common corruption in the setting, because it never looks like corruption — a name moved up, a name moved back one more day, each decision defensible on its own and none of them written down as what it was. [[imogen-roe]] has not moved a name in thirty years. Somebody has. **[[ivo-crane]] has died eleven times in a district that cannot afford four, and has never once been the one held**, and [[wren-salloway]] pays, and [[the-platform-ledger]] records the order.

**No line of dialogue in this arc says any of that.** The number is readable, the ledger is readable, the field is countable, and a player who puts the three together has found it without being told. That is the whole design.

The player watches a number they cannot directly fix. The people it kills are never Path.`;

// ------------------------------------------------------------------- NAG, planted

const nagAdditions = {
  openQuestions: [
    "Whether NAG can ever be made to say the number, and what it costs it.",
    "What it does when Amanda finally addresses it directly.",
    "What NAG actually IS. The casing is pre-war consumer tech and the thing inside it is not, and Amanda's gift did not create that — it woke it up. Owner-known, deliberately unwritten, and no scene may explain it before the arc that owns it exists.",
    "Whether the reason a Soul Forge will build one person underbuilt when it holds everybody else ([[reclamation]]) is sitting on that person's wrist. Nobody in the world has connected the two. Neither does the codex, yet.",
  ],
};

// ------------------------------------------------------------------------- run

async function main() {
  const identity = (await db.$queryRawUnsafe<{ current_database: string }[]>("select current_database()"))[0]?.current_database;
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");

  const changes: string[] = [];
  const bodies = new Map<string, { id: string; body: string; original: string }>();

  const load = async (slug: string) => {
    if (bodies.has(slug)) return bodies.get(slug)!;
    const entry = await db.storyEntry.findUnique({ where: { slug }, select: { id: true, body: true } });
    if (!entry) throw new Error(`No entry "${slug}".`);
    const record = { id: entry.id, body: entry.body ?? "", original: entry.body ?? "" };
    bodies.set(slug, record);
    return record;
  };

  // Anchored replacements. A find that is not present is fatal: it means the
  // prose moved and the correction would silently not happen, which for a rule
  // this load-bearing is worse than crashing.
  for (const splice of [...spliceSets, ...peninsula]) {
    const record = await load(splice.slug);
    if (splice.sentinel && record.body.includes(splice.sentinel)) { changes.push(`already applied — ${splice.slug}: ${splice.note}`); continue; }
    if (!record.body.includes(splice.find)) {
      if (record.body.includes(splice.replace)) { changes.push(`already applied — ${splice.slug}: ${splice.note}`); continue; }
      throw new Error(`${splice.slug}: the anchor for "${splice.note}" is not in the body. It moved, or somebody already rewrote it. Re-read before re-running.`);
    }
    record.body = record.body.replace(splice.find, splice.replace);
    changes.push(`${splice.slug}: ${splice.note}`);
  }

  for (const record of bodies.values()) {
    if (record.body === record.original) continue;
    if (!apply) continue;
    await db.storyEntry.update({ where: { id: record.id }, data: { body: record.body, version: { increment: 1 }, updatedByUserId: actor.id } });
    await db.storyRevision.create({ data: {
      id: randomUUID(), entityType: "ENTRY", entityId: record.id, action: "UPDATED", actorUserId: actor.id,
      summary: "The hold: a short reserve holds a body rather than building a small one, and the player is the only exception",
    } });
  }

  // The arc's condition node.
  const arc = await db.storyArc.findUnique({ where: { slug: "the-lamplight-road" }, select: { id: true } });
  if (!arc) throw new Error("the-lamplight-road is not open.");
  const node = await db.storyNode.findUnique({ where: { arcId_key: { arcId: arc.id, key: "the-thin-reserve" } }, select: { id: true, body: true } });
  if (!node) throw new Error("the-lamplight-road/the-thin-reserve is missing.");
  if (node.body !== thinReserveBody) {
    changes.push("the-lamplight-road/the-thin-reserve: rewritten for the hold");
    if (apply) {
      await db.storyNode.update({ where: { id: node.id }, data: {
        body: thinReserveBody,
        summary: "The Southside's Forge reserve, readable all act. A short reserve does not build a small person, it holds one — and a hold nobody pays is a grave.",
        effects: [
          "The Southside reserve is readable for the rest of the act, and drops.",
          "Every passage the Path celebrates is Essence somebody else will not get.",
          "The player watches a number they cannot directly fix.",
        ],
        version: { increment: 1 }, updatedByUserId: actor.id,
      } });
      await db.storyRevision.create({ data: {
        id: randomUUID(), entityType: "NODE", entityId: node.id, arcId: arc.id, action: "UPDATED", actorUserId: actor.id,
        summary: "Rewrote the reserve clock for the hold: the Path's devotion buries people rather than diminishing them",
      } });
    }
  }
  // The scene now names Crane, Roe, Salloway and the ledger.
  const wantedLinks = ["the-southside", "reclamation", "the-platform-ledger", "ivo-crane", "imogen-roe", "wren-salloway", "the-stone-field", "port-arcadia"];
  const current = await db.storyEntryLink.findMany({ where: { nodeId: node.id }, select: { id: true, entry: { select: { slug: true } } } });
  const have = new Set(current.map((link) => link.entry.slug));
  const add = wantedLinks.filter((slug) => !have.has(slug));
  if (add.length) {
    changes.push(`the-lamplight-road/the-thin-reserve links: +${add.join(" +")}`);
    if (apply) {
      for (const slug of add) {
        const entry = await db.storyEntry.findUnique({ where: { slug }, select: { id: true } });
        if (!entry) throw new Error(`the-thin-reserve links to "${slug}", which is not in the bible.`);
        await db.storyEntryLink.create({ data: { nodeId: node.id, entryId: entry.id } });
      }
    }
  }

  // NAG: planted, not written. The body's in-world account stays exactly as it
  // is, because that account is what everybody believes.
  const nag = await db.storyEntry.findUnique({ where: { slug: "nag" }, select: { id: true, meta: true } });
  if (!nag) throw new Error("nag is missing.");
  const nagMeta = { ...(nag.meta as Record<string, unknown>), ...nagAdditions };
  if (stableJson(nag.meta) !== stableJson(nagMeta)) {
    const parsed = metaSchemasByKind.CHARACTER!.safeParse(nagMeta);
    if (!parsed.success) throw new Error(`nag's sheet would break: ${JSON.stringify(parsed.error.issues.slice(0, 3))}`);
    changes.push("nag: planted what it is and why the machine makes one exception — as open questions, not answers");
    if (apply) {
      await db.storyEntry.update({ where: { id: nag.id }, data: { meta: nagMeta as Prisma.InputJsonValue, version: { increment: 1 }, updatedByUserId: actor.id } });
      await db.storyRevision.create({ data: {
        id: randomUUID(), entityType: "ENTRY", entityId: nag.id, action: "UPDATED", actorUserId: actor.id,
        summary: "Planted NAG as an older thing that Amanda's gift woke rather than created — owned, unwritten, and not to be explained before its arc exists",
      } });
    }
  }

  console.log(JSON.stringify({ database: identity, mode: apply ? "APPLY" : "PREVIEW", changes: changes.length ? changes : ["unchanged"] }, null, 2));
  if (!apply) console.log("\nDry run. Re-run with --apply to write it.");
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
