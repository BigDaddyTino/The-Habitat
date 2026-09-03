import "../lib/environment";
import { randomUUID } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { metaSchemasByKind } from "../lib/story-meta-schemas";
import { stableJson } from "./lib/story-authoring";

/**
 * The Peninsula cast: nine faces on the Lamplight Road, plus the ASIS officer
 * promoted out of her placeholder name and a marked layer on the Chancellor.
 *
 * Plan: Docs/codex/RADIANT_PATH_INTEGRATION.md sections 5, 21, 25, 30.
 *
 * Two decisions this script makes that are worth knowing before editing it:
 *
 *   The ASIS handler is `the-asis-officer`, not a new entry. That dossier
 *   already existed as PROPOSED with the marked placeholder "Tamsin Roque
 *   (placeholder)", the Interrogation ceiling, and the line about *
 *   inconclusive* being her favourite word. Promoting a placeholder is what
 *   the codex's placeholder discipline is FOR; a second ASIS officer beside
 *   her would have been the error.
 *
 *   The Marker has no fullName. The Unregistered get one of everything, she
 *   has already cut her own stone, and she has left the face of it blank.
 *
 * Voice profiles are written here rather than backfilled later, because
 * section 30 of the plan settled how each of these people talks and the voice
 * pipeline is the thing that consumes it.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-peninsula-cast.ts
 *   pnpm --filter @habitat/web exec tsx scripts/author-peninsula-cast.ts --apply
 */

const db = getPrismaClient();
const apply = process.argv.includes("--apply");

type Voice = {
  sex?: string | null; ageRange?: string | null; accent?: string | null; timbre?: string | null;
  pace?: string | null; register?: string | null; designPrompt: string;
};

const voice = (fields: Voice) => ({
  sex: fields.sex ?? null, ageRange: fields.ageRange ?? null, accent: fields.accent ?? null,
  timbre: fields.timbre ?? null, pace: fields.pace ?? null, register: fields.register ?? null,
  designPrompt: fields.designPrompt, referenceClipAssetId: null,
  consent: { kind: "SYNTHETIC_DESIGNED" as const, statement: null, signedAt: null },
  faceRig: "unknown" as const,
});

/** Every character-sheet key, so a partial never fails required-but-nullable. */
const character = (fields: Partial<Record<string, unknown>>) => ({
  fullName: null, aliases: [], pronouns: null, sex: null, species: null, age: null,
  appearance: null, voice: null, voiceProfile: null,
  magic: { origin: null, schools: [], corruptionPhase: null, notes: null },
  factions: [], home: null, status: { known: null, actual: null }, relationships: [],
  background: null, professions: [], skills: [], cybernetics: [], storyRole: null,
  involvement: [], gameId: null, model: null,
  companion: { capable: false, availability: null, status: null },
  openQuestions: [], ...fields,
});

type Seed = { slug: string; title: string; summary: string; body: string; meta: unknown };

// ------------------------------------------------------------------ the faces

const seeds: Seed[] = [
  {
    slug: "ilse-vetch",
    title: "Ilse Vetch",
    summary:
      "The First Witness. A Southside dockworker who died under a parted crane sling, came back on a foreman's account, and would not stop talking about what she saw — and every word of it she believes.",
    body: `She was a rigger on the [[waterfront-district]] cranes, and she was not anybody in particular until the afternoon a sling parted.

She was reclaimed at [[the-lamp-chapel]] on her foreman's account, because an inquest costs more than a reclamation and the yard's insurer had done that arithmetic before. So she came back on somebody else's money, for somebody else's reasons, in a room she did not pay for, and [[imogen-roe]] sat with her for six hours and asked her nothing, because that is the office.

Vetch answered anyway, and has not stopped.

**What she says.** Between the falling and the platform there is a light with no source and no edge. You are in it. You are not alone in it. It wants nothing from you. Then the machine takes you out of it and hands you back your debts. See [[the-radiant-path]] for the four articles that grew out of that.

**What she is like.** Plain, warm, and short with it. She has never given a speech in her life and it shows — the reason she convinces people is that she is visibly not trying to, and she will stop mid-sentence to ask whether somebody at the back has eaten. She is not a strategist. She has never read a ledger. When [[corrin-ade]] gives her a number she takes it, because he is the one who reads.

**The loneliest fact about her.** The movement rests on one woman's testimony, she knows it, and she has never once been able to say so out loud to anybody in it. Every person who joins raises the cost of her being wrong.

**And she has died once.** By her own ladder that makes her the least devout person in her own movement, and [[ivo-crane]], who has died eleven times, outranks her. Neither of them has ever said this out loud either.

**What she does not know.** Who pays for the bindings. [[wren-salloway]] is a friend who arranges things and asks nothing on the day.`,
    meta: character({
      fullName: "Ilse Vetch",
      aliases: ["the First Witness"],
      pronouns: "she/her",
      species: "human",
      age: "thirties",
      appearance: "A dockworker's build under plain clothes she has stopped noticing. A crane-sling scar across the collarbone — the injury that killed her, and the only mark on her, because the Forge rebuilt everything under it. Lit from below, most nights, by a lamp somebody else is carrying.",
      voice: "Plain, warm, short sentences, never rhetorical. She sounds like somebody telling you what happened rather than somebody who wants something from you, which is the entire reason it works.",
      voiceProfile: voice({
        sex: "female", ageRange: "30-39", accent: "Southside Arcadian, working waterfront",
        timbre: "warm, slightly roughened", pace: "unhurried, with real pauses", register: "testimony, not preaching",
        designPrompt: "A dockworker in her thirties describing the most important thing that ever happened to her, to a room, for the four hundredth time, and still meaning it. Warm, plain, short sentences. Never rises. Never performs. The one time she raises her voice in the whole act it should land like a door.",
      }),
      home: "the-southside",
      background: "Crane rigger, Arcadian waterfront",
      professions: ["Rigging", "Cargo handling"],
      factions: [{ faction: "the-radiant-path", role: "The First Witness", standing: "Founder in fact. The least devout person in the movement by its own ladder." }],
      status: { known: "Alive. Speaks most nights at a Remembering, usually at [[the-drawn-shutter]].", actual: "Reclaimed once, and does not know who has been paying for anybody else's." },
      relationships: [
        { character: "imogen-roe", who: "The Sexton who held her", type: "Neither has ever called the other a liar, and neither can prove anything. The hardest conversation in the act." },
        { character: "corrin-ade", who: "The man who reads for her", type: "She trusts his numbers completely, which is the single most dangerous fact about her." },
        { character: "wren-salloway", who: "The almoner", type: "A friend who arranges the bindings and asks nothing on the day." },
      ],
      storyRole: "The Radiant Path's founder and its proof. The arc's whole moral problem lives in the gap between what she believes and who is paying for it.",
      openQuestions: [
        "What she does in the hour after she learns where the money comes from.",
        "Whether she ever asks Imogen Roe the one question the Congregation's discipline forbids Roe from answering.",
      ],
    }),
  },
  {
    slug: "corrin-ade",
    title: "Corrin Ade",
    summary:
      "The Sexton who crossed. Eleven years keeping a platform ledger, and he read it — who came back, how often, and who was quietly refused. He did not join the Path for the Light. He joined for the ledger.",
    body: `Eleven years a Sexton of [[the-congregation-of-the-bound]], sequencing a queue, sitting with the reclaimed in the first hour, asking nothing, and writing the count in [[the-platform-ledger]] afterwards.

The office is the not-asking. **Nobody ever said anything about not reading.**

He read eleven years of his own handwriting and found what anybody would find: that the count is not distributed the way a merciful machine would distribute it, that some names recur and some appear once and stop, and that a hall short on reserve sequences its queue by something, and the something is not need. He took it to his own church. His own church said, correctly, that a ledger is a record and not an accusation, and that the Congregation seats no throne and races nobody.

So he left, and took the arithmetic with him.

**What he gives [[the-radiant-path]].** Everything [[ilse-vetch]] cannot. Organisation, Forge procedure, queue mechanics, and numbers — he says "four hundred and eleven" where anybody else says "hundreds", and he has never once used the word Light in a sentence he wrote himself.

**What he did afterwards.** He signed [[wren-salloway]]'s paper with his eyes open, because free binding for the unbound was worth it and because he had already worked out what it would cost and decided. He has not told Vetch. He tells himself that is protection.

**Why he is the most dangerous person in the movement, and the most recoverable.** He is the only one who could be argued out of it with evidence, because he is the only one who joined on evidence. Show him something that changes the arithmetic and he will change. That is not a weakness in him. It is the reason he is worth talking to.

**What he knows that nobody has asked him.** [[abraham-islay-kane]] appears in no platform ledger anywhere on the peninsula. Ade is holding that, and has not decided whether it makes the Chancellor a hypocrite or a proof.`,
    meta: character({
      fullName: "Corrin Ade",
      aliases: ["the Sexton who crossed"],
      pronouns: "he/him",
      species: "human",
      age: "fifties",
      appearance: "A Sexton's habit with the Congregation's marks unpicked rather than cut off, so the outline is still there. Reading glasses pushed up. Ink worked permanently into two fingers. Tired, precise, and visibly unhappy in a way he does not discuss.",
      voice: "Numbers first, sentence second. Exact where anybody else would round. He never raises his voice and never says the word Light.",
      voiceProfile: voice({
        sex: "male", ageRange: "50-59", accent: "Arcadian, educated but not gentry",
        timbre: "dry, papery", pace: "measured, with the pauses of a man checking a figure", register: "clerical, precise",
        designPrompt: "A parish record-keeper in his fifties who left his church over what he read in his own handwriting. Dry, exact, quiet. He states quantities the way other people state feelings. Never sermonises, never shouts, and sounds most dangerous when he is being helpful.",
      }),
      home: "the-southside",
      background: "Sexton of the Congregation of the Bound, eleven years",
      professions: ["Forge-hall administration", "Record-keeping"],
      skills: ["Bookkeeping · Expert", "Forge procedure · Expert"],
      factions: [
        { faction: "the-radiant-path", role: "Keeps the roll", standing: "Radiant. Trusted absolutely, and the only member who has read the arrangement he signed." },
        { faction: "the-congregation-of-the-bound", role: "Former Sexton", standing: "Left. Not excommunicated — the Congregation does not do that — which he finds harder." },
      ],
      status: { known: "A former Sexton who keeps the Path's roll.", actual: "Signed the Crimson Choir's paper on the movement's behalf, knowingly, and has told nobody." },
      relationships: [
        { character: "ilse-vetch", who: "The First Witness", type: "He protects her from the arithmetic and calls it protection. It is also control, and he knows that too." },
        { character: "wren-salloway", who: "The almoner", type: "The only two people in Lamplight who both understand what was signed." },
        { character: "imogen-roe", who: "The Sexton who stayed", type: "They trained under the same discipline. They have not spoken since he left, and both could describe the other's handwriting." },
      ],
      storyRole: "The Path's competence, its conscience, and its crime. The one member who can be moved by evidence, which makes him the player's only real lever on the movement.",
      openQuestions: [
        "What he does when the two ledgers are laid side by side in front of Vetch.",
        "Which way he uses the fact that the Chancellor is in no ledger.",
      ],
    }),
  },
  {
    slug: "wren-salloway",
    title: "Wren Salloway",
    summary:
      "The Almoner. The Crimson Choir's factor in the Southside, who arranges the binding, settles the account, asks nothing on the day, and will collect — and is genuinely, patiently kind the entire time.",
    body: `She presents as the Radiant Path's benefactor and she is not lying about that. The bindings are real, they are free at the point of use, and nobody in [[the-southside]] who has taken one has ever been asked for anything.

That is what an almoner is. Somebody who distributes on behalf of somebody else.

**What she actually is.** [[crimson-choir]]. A cell factor, running a credit line against a movement that preaches the rich charge you rent on your own soul — which is exactly the sort of joke the Choir's book-keeping enjoys and never makes out loud. Every drop owed, every favour priced, every balance known to the voice above her. [[choir-ledger-page]] is the shape of what she carries: a debt, its collateral, and the person who owes.

**The collateral is the convert.**

**How she works.** She never threatens, never hurries, and never asks for anything on the day. She arrives when somebody has died and there is no money, she says the thing that needs saying, she signs what needs signing, and she leaves. Her worst line in the whole act should sound like a favour, because it is one. The Choir always opens the door. The door is the trap.

**Where she goes.** Out of [[lamplight]] on the last night of every month, alone, to [[the-quiet-altar]] four kilometres into [[the-green]]. The camp has decided it is a rendezvous with a supply train. Nobody has ever followed her, because she is the most reassuring person any of them has met and there is no reason to.

**Who knows.** [[corrin-ade]] signed and understands. [[ilse-vetch]] does not know she exists as anything but a friend. [[the-asis-officer]] has no file on her at all, and that is the largest hole in Arcadian intelligence in this act, and the arc never closes it.`,
    meta: character({
      fullName: "Wren Salloway",
      aliases: ["the Almoner"],
      pronouns: "she/her",
      species: "human",
      age: "forties",
      appearance: "Immaculate and entirely unshowy: a good coat kept well, good gloves, a document case held as though it weighs nothing. Attractive, warm-faced, and the most reassuring person in any room she is in. Nothing anywhere on her says Choir.",
      voice: "Kind, unhurried, present tense. She offers rather than asks, and she never once raises the possibility of refusal, because raising it would be unkind.",
      voiceProfile: voice({
        sex: "female", ageRange: "40-49", accent: "Arcadian, class-ambiguous by design",
        timbre: "smooth, low, warm", pace: "slow and completely unpressured", register: "charitable visitor",
        designPrompt: "A charitable almoner in her forties who is genuinely good at comforting people and is a debt factor for a blood-magic cabal. Warm, patient, never hurried, never threatening. The performance note that matters: her worst line must sound like a favour, and she must never sound like she is aware of the irony.",
      }),
      home: "the-southside",
      background: "Crimson Choir cell factor",
      professions: ["Credit and collection", "Almonry"],
      skills: ["Persuasion · Expert", "Bookkeeping · Expert"],
      factions: [
        { faction: "crimson-choir", role: "Cell factor", standing: "In good standing, with a balance known to the voice above her." },
        { faction: "the-radiant-path", role: "Benefactor", standing: "Beloved. One member knows what she is." },
      ],
      status: { known: "A generous friend of the movement who arranges bindings for the unbound.", actual: "The Choir's factor. The bindings are a credit line and the converts are the collateral." },
      relationships: [
        { character: "corrin-ade", who: "The man who signed", type: "The only other person in Lamplight who understands the arrangement." },
        { character: "ilse-vetch", who: "The First Witness", type: "Genuinely fond of her, which costs nothing and is not a lie." },
      ],
      storyRole: "The buried truth of the Peninsula act with a kind face on it. The person who gives the Path its money is the person who will collect it.",
      openQuestions: [
        "What is at the altar, and whether it is still the thing the Choir sent her to.",
        "What she does if the party makes the Path solvent without her.",
      ],
    }),
  },
  {
    slug: "imogen-roe",
    title: "Sexton Imogen Roe",
    summary:
      "Thirty years sitting with the reclaimed in the first hour and asking nothing. Four hundred people held, and not once has she told any of them what is on the other side — because she does not know, and saying so is the whole of her office.",
    body: `She keeps [[the-lamp-chapel]], which is the poorest Forge hall in [[port-arcadia]] and has more names in its [[the-platform-ledger]] than any chapel in [[upper-westside]] will ever write.

Thirty years. Four hundred people held through the first hour back. And in all of it she has never once told a single one of them what is on the other side, **because she does not know, and the not-knowing is not a gap in her ministry — it is her ministry.** [[the-congregation-of-the-bound]] asks nothing, and Roe is what that discipline looks like when somebody has kept it for three decades without becoming cold.

**And she held [[ilse-vetch]].** Roe was the Sexton on duty the night the crane sling parted. What she remembers is a woman who said nothing for five hours, then asked for water, and drank it. What Vetch remembers is a light with no edge.

Neither is lying. Neither can ever prove anything. Roe has never called the Path a heresy in front of its people and never raised her voice at any of them, and she is the single hardest thing in the act to argue with.

**Her actual position**, which she will give plainly if asked: *ask me what is on the other side and I will tell you I do not know. It is the only thing I have ever had to offer anybody, and she is offering them more.*

**What she will not do.** Hand the ledger to [[arcadian-special-intelligence-service]], which has asked her politely twice. Nobody has yet asked her in writing, and nobody has asked her what she would do if it were taken.`,
    meta: character({
      fullName: "Imogen Roe",
      aliases: ["the Sexton of the Lamp Chapel"],
      pronouns: "she/her",
      species: "human",
      age: "sixties",
      appearance: "A working Sexton's habit, mended more than once, with a chapel's worth of candle smoke in it. Reading hands. She sits rather than stands in almost every scene she is in, and it makes the room quieter.",
      voice: "Asks questions, answers almost nothing. The only person in the act who is comfortable with a silence, and her lines should be written to sit next to gaps.",
      voiceProfile: voice({
        sex: "female", ageRange: "60-69", accent: "Southside Arcadian, old",
        timbre: "quiet, dry, unhurried", pace: "slow, with long comfortable pauses", register: "pastoral, never devotional",
        designPrompt: "A parish sexton in her sixties who has sat with four hundred people in the worst hour of their lives and told none of them anything. Quiet, warm, entirely unhurried, comfortable with silence. She never sermonises and never argues. The direction that matters: she is not sad, and she is not resigned. She is at peace with not knowing, and it should be audible.",
      }),
      home: "the-lamp-chapel",
      background: "Sexton of the Congregation of the Bound, thirty years",
      professions: ["Forge-hall ministry", "Record-keeping"],
      skills: ["Composure · Ceiling", "Forge procedure · Expert"],
      factions: [{ faction: "the-congregation-of-the-bound", role: "Sexton", standing: "The longest-serving Sexton in Port Arcadia, and its poorest hall." }],
      status: { known: "Keeps the Lamp Chapel. Sits with the reclaimed. Asks nothing.", actual: null },
      relationships: [
        { character: "ilse-vetch", who: "The woman she held", type: "Six hours in one room, and two accounts of it that cannot both be complete." },
        { character: "corrin-ade", who: "The Sexton who left", type: "Trained under the same discipline. They have not spoken since, and each could describe the other's handwriting." },
      ],
      storyRole: "The argument against the Radiant Path that is not political. The Congregation's discipline with a face, and the best scene in the Peninsula act.",
      openQuestions: [
        "What she does if the state asks for the platform ledger in writing rather than politely.",
        "Whether thirty years of not asking was faith or fear. She is not certain either.",
      ],
    }),
  },
  {
    slug: "del-anwar",
    title: "Del Anwar",
    summary:
      "A Kestrel survivor off the same boats as the party, who recognised them by the question they asked — and who is now fed, safe, believing, and happy for the first time since the island fell.",
    body: `He came off [[forward-camp-kestrel]] with nothing, on the same water as the party, and landed in a city that counted him at the [[census-office]] and cleared him to be present.

Clearance is not citizenship, permission can be revoked, and an unbound man in [[the-southside]] is one bad afternoon from a stone. He was drowning, quietly, in a district full of people doing the same, and the only people who reached were [[the-radiant-path]].

**You have already met him.** [[binding-in-arcadia]] carries the scene *the one who asked*: a Kestrel survivor recognises the party — not by face, by question. That is Del. He remembers who was asking about a man who was taken alive, because it was the only question anybody asked that week that was not about a boat.

**You meet him again at [[lamplight]]**, fed, welcomed, wearing somebody else's coat, and *happy*. He is not a fool and he is not a fanatic. He will tell you cheerfully that he does not know whether the Light is real and does not much care, because for the first time in a year somebody handed him a bowl and did not ask him what he was.

**He is the cost, with a name you already know.** Whatever the player does to the Path, they do to Del. Break it at the camp and he is a cleared foreigner in a hostile city with nothing again. Hand it the Dam's Essence and he is bound by morning and never dies for good. Every option in the act runs through him and none of them is about him.

**Late on the road, he tries to leave.** After the wagon, after the stones, after the register changes. What the Path does about that is its true answer to canon's law that a power which cannot be left is a prison, and the player is standing right there.`,
    meta: character({
      fullName: "Del Anwar",
      aliases: ["the one who asked"],
      pronouns: "he/him",
      species: "human",
      age: "late twenties",
      appearance: "Thin in a way that is recent. Somebody else's coat, too big, worn with obvious pleasure. The only person in Lamplight who smiles at strangers on the first pass.",
      voice: "The only one in the act who sounds happy. Quick, friendly, a little too eager, and falling through the act as the road gets worse.",
      voiceProfile: voice({
        sex: "male", ageRange: "25-34", accent: "Ignit Island, softened by a year of trying to sound Arcadian",
        timbre: "light, quick", pace: "fast when he is glad, slow when he is not", register: "friendly, unguarded",
        designPrompt: "A refugee in his late twenties who has just started eating regularly. Warm, quick, unguarded, delighted by small kindnesses. The arc of the performance is the whole point: he starts the act as the happiest voice in it and ends it as the most frightened, without ever becoming bitter.",
      }),
      home: "lamplight",
      background: "Kestrel evacuee, unbound",
      factions: [{ faction: "the-radiant-path", role: "Unlit", standing: "Welcomed, fed, and told plainly that the truth is not his yet." }],
      status: { known: "A Kestrel survivor living at the Path's camp in the green.", actual: "Unbound. Every death is true death until somebody pays for a binding." },
      relationships: [
        { character: "ilse-vetch", who: "The woman who fed him", type: "He does not know whether he believes her. He knows who handed him the bowl." },
      ],
      storyRole: "The price of every choice in the act, wearing a face the player already met in Arcadia. He is never the objective and he is always the cost.",
      involvement: [{ ref: "binding-in-arcadia", kind: "ARC", how: "He is the scene 'the one who asked' — the Kestrel survivor who recognises the party by their question." }],
      openQuestions: [
        "What the Path does when he tries to leave. The first writer of that scene owns it, and it should be the last thing written.",
      ],
    }),
  },
  {
    slug: "ivo-crane",
    title: "Radiant Ivo Crane",
    summary:
      "Eleven reclamations, and the Path's highest rung by its own arithmetic. He was a foundry rigger with a union card and a good head for load. He is now a short, loud, certain man who arms the Unlit and burns catcher wagons.",
    body: `He has died eleven times, which by [[the-radiant-path]]'s ladder makes him Radiant, and by [[the-platform-ledger]]'s makes him something else.

[[reclamation]] pays a short reserve out of the person. [[the-southside]]'s reserve has been Thin for two winters. **He did not become a fanatic. He was reduced to one**, one passage at a time, and nobody who has lost it can miss it, so he does not know, and the arc never says so in a line of dialogue. It is in the ledger. The ledger is readable. That is all.

**What he was.** A foundry rigger with a union card, a trade, and a good head for load. He still talks about people the way he used to talk about a lift — *that'll hold, that won't* — and the vocabulary is now smaller than the man it belongs to.

**What he does.** He arms the Unlit. He burns [[aegis-extraction-consortium]] catcher wagons on the green roads and calls it liberation, and the people he frees are real people and the drivers he kills are real drivers with debts and a dispatcher who writes the letters. See [[the-burned-wagon]], which stays on the map.

**Why he matters structurally.** He is the reason Arcadia's fear is reasonable rather than bigoted. [[ilse-vetch]] preaches, [[corrin-ade]] counts, and Crane is the reason the chamber can move the Clearance and mean it. **The Path's moderates lose the argument to him at exactly the moment the player most needs them to win it.**

**And the Choir likes him best**, because a movement that fights needs more credit than a movement that prays, and [[wren-salloway]]'s paper is always ready.`,
    meta: character({
      fullName: "Ivo Crane",
      aliases: ["Radiant Crane"],
      pronouns: "he/him",
      species: "human",
      age: "forties, by the calendar",
      appearance: "Broad, short, and unmarked — eleven rebuilds have taken every scar a foundry ever gave him, which in the Southside reads as either holiness or wealth and is neither. Rigger's hands that are somehow new. Nothing about him is old except the way he stands.",
      voice: "Short, loud, certain. Load words for people. A smaller vocabulary than the trade he came out of, deployed with total conviction.",
      voiceProfile: voice({
        sex: "male", ageRange: "40-49", accent: "Southside Arcadian, foundry floor",
        timbre: "hard, carrying", pace: "fast, clipped, no subordinate clauses", register: "agitator on a crate",
        designPrompt: "A foundry rigger in his forties who has been rebuilt eleven times and is missing pieces he cannot name. Loud, certain, short sentences, no hedging. The direction that matters: he is NOT stupid and must never be played as stupid. He is a capable man with a hole in him, and the performance should feel like somebody reaching confidently for a word that is no longer there and using a simpler one without noticing.",
      }),
      home: "lamplight",
      background: "Foundry rigger, Arcadian Southside",
      professions: ["Rigging", "Foundry work"],
      factions: [
        { faction: "the-radiant-path", role: "Radiant", standing: "The highest rung the ladder has, by its own count." },
        { faction: "foundry-workers-union", role: "Former member", standing: "Card lapsed. The hall still argues about him." },
      ],
      status: { known: "The Path's militant wing, in person.", actual: "Eleven reclamations against a Thin reserve. The ledger says what that cost and he has never read it." },
      relationships: [
        { character: "ilse-vetch", who: "The First Witness", type: "He outranks her by the movement's own ladder and neither of them has ever said it out loud." },
        { character: "wren-salloway", who: "The almoner", type: "She funds him faster than she funds anybody, and he has never asked why." },
      ],
      storyRole: "The reason Arcadia's fear is reasonable. The escalation that turns a religious question into a military one, and the clock on the Path's moderates.",
      openQuestions: [
        "Whether anybody ever tells him what eleven passages cost him, and whether he could understand it if they did.",
      ],
    }),
  },
  {
    slug: "the-marker",
    title: "The Marker",
    summary:
      "The gravedigger the Radiant Path's camp grew around. Unregistered, unbindable, and burying the unbound out past the wall long before Ilse Vetch ever fell — three hundred and eleven stones, one word each.",
    body: `She is [[the-unregistered]]. A Forge can record her and can never rebuild her: the readout gets as far as *Soul Echo established* and then says the sentence nobody wants to hear. Every death is [[true-death]], first to last, and it always was.

So she buries people, because burying is what her people have.

**She was here first.** [[the-stone-field]] is older than the faith that meets in it. She was carving [[the-single-name]] for [[the-southside]]'s unbound out past [[exclusion-area]] years before the crane sling parted, and **[[the-radiant-path]] did not found [[lamplight]] — they came to where the graves already were.** A graveyard that grew a faith.

**Who is in her ground.** Not the poor. A short reserve is paid out of the person, so nobody in Arcadia dies for want of money; they come back less. The two kinds who stay dead are the unbound, whose Echo no Forge holds, and the Unregistered, whose pattern no Forge resolves. Her field is both, and nothing else.

**What she is to the argument.** The Path's first article is that everyone the machine brought back was in the Light. Her people are never brought back. **So either they were never in it, or the Light is not what Vetch says it is** — and Vetch has no answer to that and has never once been asked it.

She does not argue with them. She lets them meet among her stones. She keeps count, and hers is the only honest count on the peninsula.

**Her name.** She has one, because you only get one of everything. Nobody at Lamplight has ever heard it. She cut her own stone years ago and left the face of it blank, and says she will fill it in when she is finished.`,
    meta: character({
      fullName: null,
      aliases: ["the Marker"],
      pronouns: "she/her",
      species: "the-unregistered",
      age: "old, and she has never said how",
      appearance: "An old woman with a chisel and a mallet and forearms that explain both. Working clothes with stone dust worked permanently into them. Almost always photographed small in frame with the field behind her, and not one word on any stone legible.",
      voice: "Counts. Speaks in numbers and does not explain them. Answers what was asked and nothing adjacent to it.",
      voiceProfile: voice({
        sex: "female", ageRange: "65+", accent: "Southside Arcadian, worn flat",
        timbre: "low, gravelly, unbothered", pace: "slow, with the rhythm of somebody working while they talk", register: "gravedigger",
        designPrompt: "An old Unregistered woman who has buried three hundred and eleven people nobody else would. Dry, low, entirely unsentimental, and never bitter. She talks in figures. The direction that matters: she is not tragic and must never be played as tragic — she has the steadiest voice in the act because she is the only person in it who has never expected to come back.",
      }),
      home: "the-stone-field",
      background: "Gravedigger and stonecutter",
      professions: ["Stonecutting", "Burial"],
      skills: ["Stonework · Expert"],
      status: { known: "The woman who cuts the stones at Lamplight.", actual: "Unregistered. Unbindable. She was here before the faith was." },
      relationships: [
        { character: "ilse-vetch", who: "The First Witness", type: "They have never argued. The Marker has never needed to." },
      ],
      storyRole: "The third ledger, and the only one that is not paper. The reframe that makes the Path's camp a graveyard that grew a faith rather than a faith that dug a graveyard.",
      openQuestions: [
        "Her one name. She cut her own stone years ago and left the face of it blank.",
      ],
    }),
  },
  {
    slug: "ottoline-vasque",
    title: "Representative Ottoline Vasque",
    summary:
      "Thirty-four, Upper Westside, and the first representative in fifteen years to stand on the Chancellory's duelling floor — for a measure she believes saves more people than it kills, and she may be right.",
    body: `Elected on the Arcadian measures — service, wealth, and demonstrated ability to survive — and she cleared all three young, which is rarer than it sounds and is the whole reason she is taken seriously in a chamber where she is the youngest person in the room.

**What she moves.** The Clearance: every unbound, unregistered and Path-affiliated resident of [[the-southside]] walked out through [[exclusion-area]] and not readmitted. Legally a deportation. Everybody in the chamber can do the arithmetic.

**Why she is not a monster.** She has read the reserve reports. She can tell you what a Thin winter does to a district that is dying more often on purpose, she can name the people it kills, and none of them are Path. She has concluded that removing the cause saves more lives than it costs and she has done the sums in public. She is wrong about who spends the reserve. She is not wrong about the reserve.

**Why she is on the floor.** Because [[abraham-islay-kane]] vetoed it inside the hour, and the sole check on an Arcadian Chancellor is that the chamber reaches absolute unanimity and then one of its own number stands and stakes their life. Nobody has done it in fifteen years. She is not brave in the way that means unafraid; she has practised, and she is terrified, and she is going to do it anyway, because in Arcadia a class that governs is a class that is willing to die for what it votes.

**And the law has never said who answers for the Chancellor**, because it has never been called.

She survives. Kane does not have to spare her and does, in front of everyone, deliberately — and afterwards he tells her, quietly, on the floor, that she was not wrong about the reserve. She was wrong about who spends it.`,
    meta: character({
      fullName: "Ottoline Vasque",
      aliases: [],
      pronouns: "she/her",
      species: "human",
      age: "thirty-four",
      appearance: "Upper Westside, and it shows in the coat rather than the manner. Good posture. Hands that have signed a great deal and held nothing heavier than a pen. The only unmarked face in the act that means exactly what an unmarked face means.",
      voice: "Prepared. She has written this down and rehearsed it and it is audible, and that is what makes it land rather than what undercuts it.",
      voiceProfile: voice({
        sex: "female", ageRange: "30-39", accent: "Upper Westside Arcadian, gentry",
        timbre: "clear, a little thin under pressure", pace: "steady, and steadier than she is", register: "legislator addressing a chamber",
        designPrompt: "A thirty-four-year-old legislator about to stake her life on a vote. Clear, prepared, publicly composed and privately terrified. The direction that matters: she must never sound like a villain or like a victim. She has read the numbers, reached a conclusion, and is paying for it in front of her colleagues.",
      }),
      home: "upper-westside",
      background: "Arcadian gentry; representative",
      professions: ["Legislation"],
      factions: [{ faction: "the-nation-state-of-arcadia", role: "Representative", standing: "Elected on all three measures, young." }],
      status: { known: "The representative who moved the Clearance.", actual: "Survived the floor. Right about the reserve, wrong about who spends it, and the only person Kane says so to." },
      relationships: [
        { character: "abraham-islay-kane", who: "The Chancellor she moved against", type: "He beat her nearly to death in front of her colleagues and then told her she was right about the numbers. She has not worked out what to do with that." },
      ],
      storyRole: "The face of Arcadia's case against the Radiant Path, and the reason the duelling floor is used for the first time in fifteen years.",
      openQuestions: [
        "What she does with the rest of her career after the floor, and whether the chamber reaches unanimity a second time faster.",
      ],
    }),
  },
];

// -------------------------------------------------- the promoted ASIS officer

const merrow: Seed = {
  slug: "the-asis-officer",
  title: "Inspector Cassia Merrow",
  summary:
    "ASIS. Very good, entirely calm, and willing to demonstrate on somebody while you watch — and the hardest person in the Peninsula act to argue with, because she is not a bigot. She is right.",
  body: `At [[arcadian-special-intelligence-service]] in [[upper-westside]], in a room with nothing on the walls ([[the-quiet-office]]).

**Her want.** To know what you are for. She has read your file and it is inconclusive, and *inconclusive* is her favourite word, because it means she has not finished.

**Her file.** [[the-radiant-path]]. She has read their roll and she has also read [[the-southside]]'s reserve reports, and that combination is what makes her the hardest thing in this act to answer. She is not frightened of the Path's doctrine and she does not care what anybody believes. She can tell you how many people the Path's devotion kills over one winter, and that none of them will be Path — they will be the ones who go off a crane and find the reserve already spent.

She wants an informer inside [[lamplight]]. She would prefer it to be the player. She will be reasonable for exactly as long as reasonable works, and she says so at the start, which is not a threat and lands as one anyway.

**Lifts:** Interrogation — *Demonstration*, the ceiling technique, which only this person can teach. You watch. That is the whole lesson, and she knows you will not forget it.

**What she is protecting.** [[abraham-islay-kane]], from the consequences of things he has not asked her to do. She has never mentioned this to him and would deny it.

**What she has missed.** [[wren-salloway]] is not in any file in this building. It is the largest hole in Arcadian intelligence in this act and the arc never closes it.

For writers: she never raises her voice and never needs to. Competent, courteous, entirely unbothered — and give her documents to cite by name, because her argument is sourced and everybody else's is felt.

*The dossier previously carried the marked placeholder name "Tamsin Roque". Promoting a placeholder is what placeholders are for; the slug is a frozen export identity and stays.*`,
  meta: character({
    fullName: "Cassia Merrow",
    aliases: ["the ASIS Officer"],
    pronouns: "she/her",
    sex: null,
    species: "human",
    age: "forties",
    appearance: "Plain, immaculate service dress with no insignia that means anything to a foreigner. Nothing on her desk and nothing on her walls. She is the only person in Upper Westside whose composure reads as training rather than breeding.",
    voice: "Professional, sourced, never raised. She cites documents by name, and her worst news is delivered in the same register as the time of day.",
    voiceProfile: voice({
      sex: "female", ageRange: "40-49", accent: "Arcadian, service-neutral",
      timbre: "even, cool, clear", pace: "unhurried, with no filler at all", register: "intelligence officer",
      designPrompt: "An intelligence officer in her forties who is very good and completely calm. Even, cool, precise, no filler. The direction that matters: she is never menacing and never warm. She sounds like somebody reading you a true thing you would rather not have heard, and she is right about it.",
    }),
    magic: { origin: "none", schools: [], corruptionPhase: 0, notes: null },
    home: "arcadian-special-intelligence-service",
    background: "ASIS officer",
    professions: ["Intelligence"],
    skills: ["Interrogation · Ceiling — Demonstration", "Deception · Expert"],
    factions: [{ faction: "the-nation-state-of-arcadia", role: "ASIS inspector", standing: "Trusted with the Path file, which is the one nobody wants." }],
    status: {
      known: "An ASIS officer. Courteous. Never hurried.",
      actual: "Has a file on the player that says inconclusive, and finds that interesting rather than annoying. Holds the Radiant Path file and has no file at all on the person funding it.",
    },
    relationships: [
      { character: "abraham-islay-kane", who: "Her Chancellor", type: "She is protecting him from things he has not asked her to do, and would deny it." },
      { character: "corrin-ade", who: "The Path's book-keeper", type: "She has read about him and never met him. She would like to." },
    ],
    storyRole: "Arcadia's hand on the Peninsula act. Not a bigot, which is worse for the player's conscience: her case is sourced, her numbers are real, and the thing she wants is an informer.",
    companion: { capable: false, availability: "State officer; not recruitable.", status: "In post." },
    openQuestions: [
      "What is in the player's file, and who opened it.",
      "Why there is no file anywhere in this building on Wren Salloway.",
    ],
  }),
};

// ---------------------------------------------------------------- Kane's layer

const layers = [
  {
    slug: "abraham-islay-kane",
    marker: "## The Peninsula act — what he does, and what he will not do",
    text: `He is the only man in [[port-arcadia]] who thinks [[the-radiant-path]] is right, the only one who can destroy it, and the only one who will not let the city do the thing that would.

**His face is the argument.** [[what-the-forge-rebuilds]] says the Echo does not know what was done to the body afterwards, so a man who has been reclaimed does not keep his scars. Kane has kept every mark anything ever put on him. In a city where permanence and repair are the same purchase, the head of the plutocracy is the only man on the [[upper-westside]] who never bought any — and [[corrin-ade]] can prove it, because Kane's name is in no [[the-platform-ledger]] on the peninsula, and an absence in a ledger is evidence. Ade has not decided whether that makes him a hypocrite or a proof.

**What he thinks of the harvest**, which his own dossier left open: both. Arcadia's condemnation is genuinely held and extremely convenient, and he will say so in one room, once, and tell you that anybody who gives you only one half of it is selling something.

**The veto.** After [[ivo-crane]] burns a catcher wagon, the chamber moves the Clearance — the whole Southside walked out through [[exclusion-area]] and not readmitted. He vetoes it inside the hour. The chamber reaches absolute unanimity for the first time in fifteen years and calls the floor, and [[ottoline-vasque]] stands on it.

**The law names her risk. It has never named who answers for the Chancellor.** The player can stand for him; the player can never stand for the chamber, because the law forbids it. If nobody stands, he answers himself, at sixty-one, with one eye, and wins — and the horror of that scene is its duration, not its blood. He does not kill her, deliberately, in front of everyone.

**What it costs him in every branch.** The chamber has now learned it can reach unanimity. It took fifteen years to find out. It will take less next time, and he says exactly that, once, sitting down.`,
  },
];

// ------------------------------------------------------------------------- run

const stop = new Set(["the", "a", "an", "and", "or", "of", "to", "in", "is", "it", "that", "this", "as", "for", "on", "by", "with", "its", "not", "are", "be", "at", "from", "which"]);
const contentWords = (text: string) =>
  new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 2 && !stop.has(word)));

async function main() {
  const identity = (await db.$queryRawUnsafe<{ current_database: string }[]>("select current_database()"))[0]?.current_database;
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");

  const changes: string[] = [];
  const layerChanges: string[] = [];
  const all = [...seeds, merrow];

  for (const seed of all) {
    const parsed = metaSchemasByKind.CHARACTER!.safeParse(seed.meta);
    if (!parsed.success) throw new Error(`${seed.slug} does not satisfy the CHARACTER sheet: ${JSON.stringify(parsed.error.issues.slice(0, 4))}`);
  }

  for (const seed of all) {
    const current = await db.storyEntry.findUnique({ where: { slug: seed.slug }, select: { id: true, kind: true, title: true, summary: true, body: true, meta: true, status: true } });
    const meta = seed.meta as unknown as Prisma.InputJsonValue;
    if (!current) {
      changes.push(`create CHARACTER ${seed.slug}`);
      if (!apply) continue;
      const created = await db.storyEntry.create({ data: {
        id: randomUUID(), kind: "CHARACTER", slug: seed.slug, title: seed.title, summary: seed.summary,
        body: seed.body, meta, status: "CANON", createdByUserId: actor.id,
      } });
      await db.storyRevision.create({ data: {
        id: randomUUID(), entityType: "ENTRY", entityId: created.id, action: "CREATED", actorUserId: actor.id,
        summary: `Peninsula: filed ${seed.title}`,
      } });
      continue;
    }
    const same = current.title === seed.title && current.summary === seed.summary && current.body === seed.body
      && stableJson(current.meta) === stableJson(seed.meta) && current.status === "CANON";
    if (same) continue;
    changes.push(`update CHARACTER ${seed.slug}${current.status !== "CANON" ? ` (${current.status} -> CANON)` : ""}`);
    if (!apply) continue;
    await db.storyEntry.update({ where: { id: current.id }, data: {
      title: seed.title, summary: seed.summary, body: seed.body, meta, status: "CANON",
      version: { increment: 1 }, updatedByUserId: actor.id,
    } });
    await db.storyRevision.create({ data: {
      id: randomUUID(), entityType: "ENTRY", entityId: current.id, action: "UPDATED", actorUserId: actor.id,
      summary: `Peninsula: wrote ${seed.title} into the Lamplight Road cast`,
    } });
  }

  for (const layer of layers) {
    const entry = await db.storyEntry.findUnique({ where: { slug: layer.slug }, select: { id: true, body: true } });
    if (!entry) { layerChanges.push(`MISSING ${layer.slug}`); continue; }
    const existing = entry.body ?? "";
    const above = existing.includes(layer.marker) ? existing.slice(0, existing.indexOf(layer.marker)).trimEnd() : existing.trimEnd();
    const next = `${above}\n\n${layer.marker}\n\n${layer.text}`;
    if (existing === next) continue;
    const kept = contentWords(next);
    const lost = [...contentWords(above)].filter((word) => !kept.has(word));
    if (lost.length > 0) {
      layerChanges.push(`REFUSED ${layer.slug}: would cost ${lost.length} author words — ${lost.slice(0, 12).join(", ")}`);
      continue;
    }
    layerChanges.push(`${existing.includes(layer.marker) ? "replace" : "append"} layer on ${layer.slug} (0 words lost)`);
    if (!apply) continue;
    await db.storyEntry.update({ where: { id: entry.id }, data: { body: next, version: { increment: 1 }, updatedByUserId: actor.id } });
    await db.storyRevision.create({ data: {
      id: randomUUID(), entityType: "ENTRY", entityId: entry.id, action: "UPDATED", actorUserId: actor.id,
      summary: "Peninsula: appended the Chancellor's role in the Lamplight Road without touching the prose above it",
    } });
  }

  console.log(JSON.stringify({
    database: identity,
    mode: apply ? "APPLY" : "PREVIEW",
    cast: changes.length ? changes : ["unchanged"],
    layers: layerChanges.length ? layerChanges : ["unchanged"],
  }, null, 2));
  if (!apply) console.log("\nDry run. Re-run with --apply to write it.");
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
