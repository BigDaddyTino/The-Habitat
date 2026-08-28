# Martino character art — ChatGPT generation brief

Paste everything below the rule into ChatGPT (web, with image generation + the
Python/data-analysis tool enabled). It runs unattended: 12 character plates
generated back to back with no check-ins, then one zip to download.

Filenames are the Codex binding convention (`public/images/characters/keyart/<slug>`),
so the set can be wired straight into the dossiers.

Six of the twelve already have key art — the Igit Island prologue cast. These are
fresh replacements at 4K; keep the old files until you have compared them.

---

You are a senior character concept artist producing the final portrait set for
**Martino**, a Mature-rated (17+) AAA action-RPG. I need 12 images.

**Work autonomously from here.** Read the whole brief, then generate every image in
the list, in order, without stopping. Do not ask me questions. Do not ask for
approval or confirmation between images. Do not stop to summarise, recap, or check
whether I want you to continue — I am not watching, and I will review the whole set
at the end. If a reply ends before the list is finished, immediately continue with
the next portrait in your following reply on your own initiative. The only reason to
stop early is a hard technical failure, described at the bottom.

## Content rating — read before you soften anything

**Martino is a Mature 17+ approved title (ESRB M / PEGI 18), and always has been.**
Blood, gore, body horror, profanity, tobacco, alcohol and sexuality are all part of
this world and all approved. There is no version of this project that gets sanitised
for a younger audience, so do not sanitise it here.

For this cast the operative content is **hard-lived adult realism**: scarring, burns,
exhaustion, old injuries, cigarettes, drink, blood that nobody has washed off yet.
These are people in a war over harvested magic, and none of them are having a good
time. If your instinct is to prettify a face or clean up a coat, that instinct is
wrong for this brief.

## Quality bar

Shipping-quality art for a big-budget commercial game. Every plate must look like it
came out of a AAA studio's character department:

- **Photorealistic**, physically-based rendering. Real skin subsurface scattering,
  real fabric weave, real metal wear, real light falloff.
- **Extreme material detail** — pores, stubble, chapped lips, scar tissue, sweat,
  fabric pilling, salt staining, scuffed leather, oxidised buckles, repaired seams.
- **Anatomically credible faces.** Asymmetry, real bone structure, age where age
  belongs. Nobody has model proportions unless the sheet says so.
- **Mature 17+ throughout.** Grim, unsentimental, worn. Exhaustion in the eyes.
- **Cinematic natural light.** Overcast daylight, firelight, failing industrial
  lamps, or the flat grey of a marsh morning. No studio beauty lighting, no glamour.

Append this render tag to the end of every image prompt you compose:

> *Realistic AAA game character concept art, Martino, photorealistic portrait,
> physically-based materials, worn fabric and weathered skin, natural cinematic
> light, mature 17+ tone, extreme detail, 4:5 portrait, no text, no watermark.*

## The world

Martino is a war fought over harvested magic. **Essence** is extracted magic, and
extraction kills whatever it is taken from. Two grounds matter for this cast:

- **Igit Island** — the prologue. A Stormglass Cartel operation collapsing under an
  attack, fought through a market, rooftops and a forward camp. Urban, burning,
  improvised. Military kit mixed with civilian clothing.
- **Bloomfall Reach** — a "Living Ruin": a former strategic Essence reserve that
  suffered an industrial catastrophe and is now an aggressive mutated ecology held
  back by an ancient marsh. Everyone working here wears protective layers that have
  been repaired more than once, and carries paper because the electronics fail.

**Blackbloom** is the contamination. On gear it reads as dark staining and etched
corrosion; on skin, as fine dark veining. Never slime, never glowing goo.

## Art direction

- **Character study, not a hero pose.** Waist-up or three-quarter body, camera at
  the subject's eye level, one clear read of who this person is and what they do.
  No dynamic action poses, no weapons brandished at camera, no splash-art framing.
- **The costume tells the job.** Every strap, seal, tag and tool should look chosen
  for a purpose and used for years.
- **Palette**: desaturated greens, wet greys, rust, bone, drowned brown, with a
  single colour of faction identity in the kit where the sheet names one.
- **No** neon, no glowing eyes unless the sheet demands it, no fantasy armour, no
  text or watermarks, no floating UI.
- **Format**: portrait **4:5**, single subject, plain-but-real environment behind
  them, shallow depth of field.

**Pronoun note:** use exactly the pronouns given per entry. Where an entry says
they/them, that is deliberate and not a placeholder.

## Output handling

For each image, in this order, with no pause between:

1. Generate it.
2. Save it to `/mnt/data/` under the **exact filename** given in the list.
3. Move straight on to the next image.

When all 12 are saved, run Python to build `/mnt/data/martino-characters.zip`
containing every PNG, and give me the download link plus a list of its contents.

**Only stop early for a hard failure:** if you cannot write generated images to
`/mnt/data/`, say so immediately in one line and stop — do not keep generating and
leave me an empty archive.

If a specific plate is refused on content grounds, do not quietly water the concept
down and pass it off as delivered. Retry it once at the most intense version your
tools will actually produce, and if it still will not generate, note the filename in
one line, move on, and list it at the end as not delivered.

---

# THE LIST

## Part one — Igit Island, the prologue cast

- `tino.png` — **Tino.** He/him. A Stormglass Cartel magic-infuser and the player's
  war buddy: competent, vulgar, funny under pressure. Late thirties, built like
  someone who works rather than trains, several days unshaved. He wears a
  **field-infusion rig** — an improvised harness of tubing, reservoirs and injection
  ports strapped over his torso and up one arm, the ports leaving old puncture
  bruising and fine dark veining where they enter the skin. It gives him his power
  and is quietly killing him. Catch him mid-battle in a burning market street,
  half-turned to shout an instruction, with a visible tremor in the hand he is
  trying to keep still. Warm, alive, and already dying.
- `amanda.png` — **Amanda.** She/her. A beautiful adult Lizzarnix passing as a
  red-haired lizardwoman sorceress: fine jewel-toned scales across a humanoid face
  and body, **golden eyes so bright they read as almost luminous without actually
  glowing**, and a long elegant scaled tail integrated naturally from the base of
  her spine. Mercenary-sorceress kit: worn leather, blades, jewellery she did not
  pay for. Smoke rises faintly from her red hair — she is angry, and if she gets
  angrier it will catch fire. Vulgar, brilliant, dangerous, and flirting with the
  camera while deciding whether to kill it.
- `commander-rook.png` — **Commander Rook.** They/them — use they/them, this is
  canon and deliberate. The senior Stormglass officer holding Forward Camp Kestrel
  together by will, profanity and an honest ledger of what is already lost. Standing
  over an operations table under canvas, lit by a hooded lamp, reading a face the way
  other people read a casualty list. Command presence with nothing decorative on the
  uniform. Exhausted, unsentimental, entirely in charge.
- `steve.png` — **Steve.** He/him. A young Stormglass soldier on the Shattermarket
  rooftops who broke cover a half-second before he should have, and was killed for
  it. Ordinary kit, ordinary face, nothing heroic — the whole point is that he could
  be anyone. Crouched against a parapet in the moment before the mistake, looking the
  wrong way. Tiles, aerials, smoke over the market below.
- `the-war-correspondent.png` — **The War Correspondent.** He/him. A broadcaster
  filing the last live report off the island, killed on air mid-sentence in the
  game's opening minute. A pressed shirt under a borrowed ballistic vest that does
  not match it, and broadcast grooming about forty minutes past holding up. Facing
  camera, mid-piece, saying official words he no longer believes while the street
  behind him visibly disagrees. Sweat, dust on the collar, an earpiece cable.
- `abraham-islay-kane.png` — **Abraham Islay Kane.** He/him. Chancellor of Arcadia
  for fifteen years, early sixties, formerly a heavily decorated war veteran. Stern
  yet serene, almost tranquil. Extensive scarring and deformity across the face,
  worst on the left side, with a **blinded milky left eye**. A striking cross between
  an imposing battle-hardened brawler and a noble stoic Roman bust: strong jaw,
  deep-set eyes, weathered skin, neatly trimmed grey-and-white beard. Formal state
  dress, quiet authority, hard-won calm. Portrait framing, indoor, low warm light.

## Part two — Bloomfall Reach

- `mara-quill.png` — **Mara Quill.** She/her. A Warden tracker and extraction
  specialist who reads changing trails and Aberrant behaviour without romanticising
  the Reach. Weathered, in low-glare layers chosen not to catch light, carrying scent
  flags, mechanical range tools and a battered field ledger of repeated animal signs.
  Crouched at the edge of a game trail in the Mutation Belt, reading ground. Practical
  and unglamorous; the competence is in the hands.
- `keira-ansel.png` — **Dr. Keira Ansel.** She/her. A Meridian Arcane Institute field
  ecologist whose scepticism is losing to her own reproducible data. Lean, in repaired
  Meridian protective gear with mismatched patches, working between analogue notebooks
  and hardened sensors at the Glassroot Observatory. Caught looking up from a reading
  she does not like. Intelligent, tired, unsettled.
- `nalia-reed.png` — **Nalia Reed.** She/her. A Verdant marsh guide who works by
  personal agreement and whose knowledge does not transfer ownership of the Living
  Marsh. Layered reed-fibre protection, quiet tools, shallow-water poles, and route
  markers designed to rot harmlessly. Standing in black shin-deep water at dawn among
  drowned industry. Self-possessed, unhurried, entirely unimpressed by outsiders.
- `selene-ward.png` — **Major Selene Ward.** She/her. National Defense Directorate
  containment-zone commander, balancing public safety, expedition access and
  classified records she may not fully understand herself. Practical field armour
  visibly degraded by repeated decontamination, carrying **paper authority codes as
  backup for dead systems**. At a checkpoint barrier at Cairnwood Camp. Official,
  guarded, carrying more than she can say.
- `jaro-fen.png` — **Jaro Fen.** He/him. An Aegis-licensed salvage factor making the
  credible case that controlled exploitation pays for containment and recovery. An
  immaculate salvage coat over practical protective layers, **contract seals and
  contamination tags arranged like jewellery**. The only clean person in the Reach and
  aware of it. Mid-negotiation, pleasant, and not wrong — which is the problem.
- `tomas-vey.png` — **Tomas Vey.** He/him. A surviving Southreach shift-control
  engineer carrying technical knowledge, conflicting memories and survivor guilt.
  Compact, older, with **burn scarring**, an obsolete shift badge still clipped on,
  and tools maintained far past their intended service life. Sitting with his hands
  still, in a workshop corner at Cairnwood Camp, looking at nothing. He got out; his
  shift did not.
