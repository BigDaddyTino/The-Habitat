import { bloomfallCreatureFieldGuide, type BloomfallBossGuide, type BloomfallCreatureGuide } from "@/lib/bloomfall-creature-field-guide";

/**
 * Every Mythic's fight record, wherever in the world it lives.
 *
 * The first Mythic was Bloomfall's, so the fight data went into
 * `bloomfall-creature-field-guide.ts` and the boss page read it from there.
 * The second one is in the Grand Rift, and a Death Canyon boss reading its kit
 * out of a module named for another region is the kind of thing that is fine
 * until somebody deletes it during a Bloomfall cleanup.
 *
 * So this is the lookup the boss page uses: Bloomfall's guide, plus the
 * records for regions that do not have a field guide of their own yet. The
 * shapes are deliberately Bloomfall's own types rather than a parallel set —
 * a Mythic fight is a Mythic fight, and two type families describing the same
 * page is how the dossier and the page start to disagree.
 *
 * One Mythic per region, and the rest of those slots are reserved rather than
 * empty. Bloomfall's is the Anaconda; the Grand Rift's is the Pale Mother.
 */

const a = (name: string, effect: string) => ({ name, effect });

/** Mythics whose region has no field guide module of its own. */
const otherRegionMythics: Readonly<Record<string, BloomfallBossGuide>> = {
  "the-pale-mother": {
    kind: "BOSS",
    tier: "MYTHIC",
    summary:
      "The Grand Rift's Mythic, and the only one of these that is not defending itself. Nine metres across the legs and made entirely of bone, none of it hers — every plate, every leg segment, every socketed joint came off somebody, and she did not grow them, she **fitted** them, seated and keyed the way a wall is dry-stoned. Where a spider carries a body she carries a cage: a ribbed hollow slung between the legs, closed, dark, and full. Read every behaviour she has under one sentence and it all changes meaning — **she has never once defended herself.** She interposes. She smothers the fire because fire is what kills them. She backs into the gas because you cannot see in it and they can.",
    spawn:
      "Always there, never spawned. She is in the deep gas of [[death-canyon]] and no player action creates her. The notice is posted at [[bonefire-picket]], the last fixed light on the leg, and it is nine words long — four of them are the pay and the last two are **bring fire**. [[wenna-crake]] wrote it, went in with four other people, came back alone, and has watched crews read it, nod, and walk up the road with rifles for nine years. Wound her and break contact and she goes into the gas and comes back with more plates on than she had. Her children do not come back: whatever you burned stays burned across attempts, and she gets more careful as she runs out.",
    stats:
      "Mythic scale, and the health bar is a lie. It is the cage. Every point of damage is a plate off the thing holding four hundred and eleven of them shut, and where you put that damage decides which of three fights happens next.",
    abilities: [
      a("The Lid", "She has no health bar, she has a lid. The eight legs put her down with the cage still closed; the Carry and the Seams put her down faster and unlatch it. The Seams glow, and thirty years of games have taught every player alive to shoot the part that glows."),
      a("The Vents", "Fourteen fissures on the floor will light, and a lit one throws a column of flame up through the gas. The gas itself will not burn — it is heavy and inert and it smothers. These are the only area damage a party that brought none can still use, and there are exactly fourteen."),
      a("Settle", "She lowers the cage onto a burning vent, puts it out, and heals off it, in one unhurried animation. That is not a boss healing itself. That is a mother standing on the fire, and every vent she smothers is one you do not have in three minutes."),
      a("The Hum", "Death Canyon makes a noise and you stop hearing it in ten minutes. The Brood does not make a sound — it blocks one. When they cross a fissure the hum goes out in that spot, and the shape of the silence coming toward you is the only warning anybody gets."),
    ],
    phases: [
      {
        name: "Phase One — the Walk",
        what:
          "Slow, enormous, faceless, and completely fair. This is a legitimate, winnable fight against a big slow thing and it must feel won — no cheap deaths, no unreadable telegraph, no gimmick. That is the trap, and playing honestly is what springs it. She does not roar, does not posture, and does not react to being hurt: a plate off her is not a wound, it is inventory, and she will pick one up off the floor mid-fight and put it back on without hurrying that either.",
        abilities: [
          a("Sweeping Foreleg", "A low flat arc through pooled gas that takes your footing before it takes your health."),
          a("Shed Plate", "A shield-plate comes free at a seated joint and stays on the floor. She will come back for it."),
          a("The Drag", "One foreleg out of an opaque gas wall, from nothing, at reach. This is the attack that teaches you the gas can hold her, so phase two can teach you it holds worse."),
          a("Fissure Step", "She walks into the deep pool and is simply gone. She is not invisible; the gas is opaque and she is patient."),
          a("Cradle Slam", "The whole low body dropped onto stone. A dust ring, and the gas displaced in a flat disc that shows you the floor for a second."),
        ],
      },
      {
        name: "Phase Two — the Count",
        what:
          "Several hundred hand-sized bone spiders, the exact colour of the gas — same hue, same value, same softness at distance, so the eye files them as weather and the only tell is that the gas moves wrong. There is no health bar here. There is a number, and it goes down, and it starts at four hundred and eleven. They pick the nearest person and climb, and what they take is bone.",
        abilities: [
          a("Opening the Cage", "The ribbed plates hinge apart from beneath and it is visibly full. The camera holds a beat longer than is comfortable, because you get one second to understand what has been riding in there all fight."),
          a("Gaswalk", "They cross the pool without disturbing it the way a thing that size should. A calm surface with one straight line of displacement in it, and gas does not do straight lines."),
          a("Climb", "Boots, shin, chest. Ten stacks of Taken and you are down; walk out with stacks and it is a lasting injury, which a Forge repairs for anybody who can buy a body."),
          a("The Quiet", "They stop at the edge of the gas and wait. Not a retreat and not a lull — they can wait longer than you can stand there, and every survivor account leads with this rather than the deaths."),
          a("Reassembly", "Leave them alive long enough and they start carrying plates back. They will rebuild her in front of you, out of the fight you just won — and out of anybody who went down and was not picked up."),
        ],
      },
    ],
    transition: {
      name: "The Lid",
      what:
        "She stops, and lowers, and the legs fold, and the cage opens on the underside the way a hand opens. What happens next was settled minutes ago by where you put your damage. **Seams first** — the fastest kill in the fight and the fastest way to unlatch a cage — and it comes apart while she is still standing, both fights at once, with your fire mostly spent. **Body damage** and she goes down first, then it opens: a clean break, and the intended hard version. **The eight legs only** and she goes down with the lid on, and you can hear them in it, and you can burn it closed.",
    },
    drops:
      "**A Settled Plate** — the one bone on her that stopped working, and the proof settling is still possible. **Brood-glass** — one bead per broodling the fire took, so the pouch is the count and the difference from four hundred and eleven is what is still down there. **Cage Rib** — one rib off the brood chamber, with the fitted notches on the inside.",
  },
};

export const mythicFieldGuide: Readonly<Record<string, BloomfallCreatureGuide>> = {
  ...bloomfallCreatureFieldGuide,
  ...otherRegionMythics,
};
