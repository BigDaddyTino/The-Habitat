/**
 * The Kingdom Management design layer, the one appended to the
 * `kingdom-management` dossier under its own marker. Single source: the
 * integration script (`integrate-kingdom-design.ts`) and the ranks author
 * (`author-kingdom-ranks.ts`) both read it, so a rerun of either can never
 * resurrect an older wording.
 *
 * Owner rulings carried here: the Charters are the Riverlands' three plots,
 * not rungs (2026-09-02); the five holding names ARE the level system, drawn
 * as the Ranks of the Crown with a level ledger of perks and the six realm
 * trees' perk nodes (2026-09-02).
 */

export const OLD_CROWN_MARKERS = ["## Designed — the crown, rung by rung"];

export const KINGDOM_CROWN_LAYER = {
  marker: "## Designed — the crown, rank by rank",
  body: `## Designed — the crown, rank by rank

The full design is settled (the "Holding Ground" spec, owner-approved 2026-09-01; the Ranks, the level ledger and the realm perk nodes 2026-09-02). This is the gamer's version: what you get, and for what.

**The Ranks of the Crown — the realm's level system.** Kingdom Level runs 1 to 15. Three levels make a rank; every third level is a **ceiling** no XP can pass, and the realm quests its proving to enter the next rank, the way trades prove their masters. A rank licenses a scale of holding and adds verbs; none retires the ones below.

- **I · Freeholder — the Freehold** (levels 1–3): a parcel and a roof. You get: build, farm, fence, hire hands. For: buying a plot — in the Riverlands, the [[first-charter]].
- **II · Warden — the Ward** (levels 4–6): a fortified point with a job. You get: garrison, patrols, supply, a signal plan, and the Captain's seat. For: holding a road or crossing.
- **III · Magistrate — the Township** (levels 7–9): a population that isn't yours. You get: districts, trades, law, admission policy, and the Chancellor's and the Broker's seats. For: growth.
- **IV · Lord — the City** (levels 10–12): districts, wharves, politics. You get: grand projects, real armies, factions inside your own walls, and the Marshal's and the Envoy's seats.
- **V · Crown — the Kingdom** (levels 13–15): multiple holdings and vassals. You get: doctrine, diplomacy, war, succession, the Spymaster's seat, and a seat at the world's table.

**The provings — four ceilings, at levels 3, 6, 9 and 12.** The quests are arcs and are not written yet; their shapes and their teachers are reserved. *The Held Night* (Freeholder → Warden): your ground is attacked in earnest and stands until morning with what you built, and the Heartland Watch has to see it. *The Second Core* (Warden → Magistrate): a second Forge answers to you and a population that isn't yours binds to it — the realm becomes a network, and a network can be cut. *The Doctrine Crisis* (Magistrate → Lord): a Court Day where your own people split down the middle; you write the doctrine that settles it, and live under what you wrote. *The Recognition* (Lord → Crown): the earn-the-seat quest — the world's powers acknowledge the crown, or are made to; taught by the Crown Without a Name, the kingdom pass's reserved ceiling teacher.

**The ledger — what every level grants.** 1 Deed in Hand · 2 Hands and Hearth · 3 The Fence Line · 4 Warden's Writ · 5 The Supply Line · 6 Two Roads · 7 Charter of Township · 8 The Levy · 9 Vassal's Oath · 10 Lord of the City · 11 The March · 12 Court of Peers · 13 The Crown · 14 Doctrine of the Realm · 15 The Long Reign. Every level extends the caps — holdings, muster, officer seats, vassals, project tiers — and grants one realm point; every proving grants two more. Court Day scales with the rank: a letter on the kitchen table at level 1, a hall from level 7. The realm earns XP from REAL work only: holdings prospering, projects finished, wars won, sieges stood, treaties signed, trade moved, Court Days handled. The curve is steep — each level costs more than half again the last. The Kingdom page carries the ledger's caps row by row, hand-set and marked untested until a sim measures them.

**The six court seats**, each tutored by a stop on the Heartland tour: the Captain (defences; the Heartland Watch), the Chancellor (the treasury; the Clearinghouse), the Broker (the gray economy; the Bone Market families), the Marshal (armies; the Regulator Station), the Envoy (diplomacy; the Standing Camp) and the Spymaster (intel; the Winchworks). A seat is real authority in its domain; a Syndicate's members hold them.

**Getting ground — four verbs.**

- **Buy** — one of a region's few pre-defined plots: ground you can buy outright and build your own buildings on. Not every region has one, and the ones that do have a handful — rare on purpose, because the world is owned. The Riverlands holds three in courthouse escrow, the Charters ([[first-charter]], [[second-charter]], [[third-charter]]): a homestead, an economy, a defence — plots, not ranks.
- **Seize** — siege or coup. Inside a faction the Bannerlord law holds: even if YOU take the fort, the leader decides who gets it.
- **Earn** — a granted fief, with the obligations grants exist for.
- **Found** — start from nothing; slowest, and nobody holds paper over you.

**The crown's six realm trees and their perk nodes** (your own kingdom only — join a faction and you live under THEIR doctrine). One realm point a level and two a proving, twenty-three by the cap, against seventy-eight points of nodes: nobody owns everything. Nodes cost one to three points; the deeper ones need a rank; the last node of every tree is its capstone, and Crown-only.

- **Might** (levies, garrisons, sieges): Muster Roll · Standing Watch · Siege Train · Iron Rations · Marching Orders · Banners Answer · capstone **Dominion** — the world's coalition instinct tolerates your lead a little longer before it turns.
- **Coffers** (tariffs, routes, markets): Toll Bar · Honest Weights · Chartered Routes · The Factorage · Mercenary Paper · War Chest · capstone **The Mint** — your own coin, and tariffs that follow it to the world's table.
- **Works** (machinery, infrastructure, bought additions): Drained Ground · Stone over Timber · Bought Additions · Machine Shop · Grand Projects · Palisade Doctrine · capstone **The Works Never Sleep** — projects and repairs run at full pace while you are away.
- **Arcana** (Forge efficiency, reserves, licensed casting): Reserve Ledger · Thrift Binding · Deep Reserve · Licensed Casters · Core Network · Storm Ward · capstone **Crown Core** — the capital's clock deepens to the tier a standard army cannot take.
- **Roots** (people, land, food, loyalty): Open Gates · Granary Law · Common Weal · Schools · Named Heir · The Long Memory · capstone **Old Oaths** — founded and earned holdings never turn, and sworn vassals stay through a Mourning.
- **Faith** (adoption, spread, tolerance): Shrine Rights · Tolerance · Patronage · Suppression · Missions · Doctrine Council · capstone **The Adopted Faith** — the realm's faith is read by the whole world and its price is bought down; a secular crown takes the Secular Crown instead, halving the devout-share morale bleed.

**Court Day — the first of every month.** The court convenes with a real docket: petitions, windfalls, disasters, omens, absurdities. Attend and rule; skip and doctrine auto-decides; be away and a governor rules in your name — and the Court Record is waiting when you return. The sims priced attendance plainly: a present ruler clears roughly double what auto-doctrine does, a good governor sits between, and a poor governor is WORSE than no governor, because doctrine does not improvise.

**The Syndicate** — the multiplayer crown: the leader decides, members hold the officer seats with real authority in their domains, and the realm's level, ceilings, and trees are everyone's work. Servers can carry several Syndicates vying with each other and the NPC powers alike.

**Succession — the Mourning.** A ruler's true death starts a live succession crisis: the heir you named holds the realm or it fractures, decided by what you actually built — officers, treasury, doctrine, faith. What survives persists as an NPC power the next run meets, wearing your old name. The realm remembers you; it does not belong to you.

**Standing laws:** every competing Great Power starts a world at the SAME total points and diverges only by play; story-critical ground never flips until its arc resolves; your crown joins the scoreboard when the world recognizes it; sacred sites can be held but never owned — grievance runs until you return them, gift them, or win their people; and the soulless garrison ([[machines]]) trades the Forge clock for a daily Essence sip. See [[the-power-balance]] for the world game and [[the-faith-lane]] for what belief buys.`,
};
