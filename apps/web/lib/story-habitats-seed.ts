/**
 * Where each creature lives, on the three regions the world actually has.
 *
 * The races shelf was wired to its own tree but not to the map: twelve
 * creatures, and not one of them named a place that resolved, so no region
 * dossier could say what lived there. Every placement below is quoted from the
 * creature's own dossier or from the region's — nothing here is invented
 * ecology, and the `because` line is the sentence it was read from, kept
 * beside the assignment so the next writer can check the reasoning rather than
 * trust it.
 *
 * The world has exactly three regions: Igit Island, The Ocean, The Peninsula.
 * A creature whose ground is somewhere nobody has built yet keeps its prose
 * habitat and waits — see `unplaced` at the bottom for those and why.
 */

export type HabitatAssignment = {
  /** CREATURE slug. */
  creature: string;
  /** REGION slugs to add. Existing habitats are never removed. */
  regions: string[];
  /** The canon sentence the placement was read from. */
  because: string;
};

export const habitatAssignments: HabitatAssignment[] = [
  {
    creature: "abominations",
    regions: ["the-starting-island"],
    because: "\"Battlefield abominations already walk Igit Island's fronts, and the clinic's extraction ward in glasswater-village is a reminder of how the pipeline starts.\"",
  },
  {
    creature: "monstrosities",
    regions: ["the-starting-island"],
    because: "\"On Igit Island their presence is peripheral but real: corporate-bred jungle stock among the tropics' creatures, the catcher camp's cages at the Riftwood's edge, and whatever Pearl keeps in restraints at the beachhead.\"",
  },
  {
    creature: "supernaturals",
    regions: ["the-starting-island"],
    because: "\"True demons are the ones walking the island where the player can see them.\"",
  },
  {
    creature: "the-risen",
    regions: ["the-starting-island"],
    because: "\"They appear where the war has wounded the island deepest\" — and Stormglass Landing's own dossier names the demon breach they climb out of.",
  },
  {
    creature: "true-demons",
    regions: ["the-starting-island"],
    because: "\"A true demon follows the risen out of the prologue's first crater\" — the prologue is Igit Island.",
  },
  {
    creature: "hippogriff",
    regions: ["the-starting-island"],
    because: "\"The prologue's rooftop hunter is one of these animals fitted into Tropic Pearl doctrine\" — the rooftop Steve dies on is on the island. Its written habitats (highlands, coastal cliffs, urban roosts) are kept as they are.",
  },
  {
    creature: "arcadian-devil",
    regions: ["the-peninsula"],
    because: "\"the richest source of essence in the deep arcadian jungle\" — Arcadia is on the Peninsula, whose interior is still open ground for writers.",
  },
  {
    creature: "human",
    regions: ["the-starting-island", "the-peninsula"],
    because: "\"Most people in this story are Human: the player, the squads, the cartels, the refiners\" — they hold the island and the mainland. The Ocean is crossed, not lived in.",
  },
  {
    creature: "beasts",
    regions: ["the-starting-island", "the-ocean", "the-peninsula"],
    because: "\"The ordinary ecology: things that hunt, breed, migrate, and defend territory.\" The Riftwood is \"the island's stage for creature encounters\", the Ocean's charts mark \"migration lanes\", and the Peninsula \"was hunted clean\" — which is a statement about its animals.",
  },
];

/** Left alone deliberately, with the reason, so nobody re-litigates it blind. */
export const unplacedCreatures: Array<{ creature: string; because: string }> = [
  {
    creature: "lizzarnix",
    because: "Extinct. \"The world calls the species extinct because greed succeeded so completely that even the reason for the slaughter was lost.\" Their range predates every region on the map, and Amanda is one survivor rather than a population.",
  },
  {
    creature: "mythical",
    because: "\"Mythical means Lizzarnix and Lizzarnix alone\" — an empty range for the same reason.",
  },
  {
    creature: "humanoid",
    because: "\"Humanoid is a parent shape, not a synonym for Human.\" A body plan does not live anywhere; the Human child carries the ground.",
  },
];
