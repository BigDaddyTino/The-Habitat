/**
 * A safe writing scaffold for Tino's captivity. It records the facts the world
 * already owns and makes every unresolved answer visibly owner-gated. The arc
 * is PROPOSED because a board is not permission to canonize the captor, site,
 * experiments, or The Empty Cribs' proposed resolution.
 */
export const captivityArcSeed = {
  slug: "the-captivity-arc",
  title: "The Captivity Arc",
  summary: "The owner-gated mainline workstream for finding Tino after his confirmed capture alive. The captor, location, purpose, and resolution remain deliberately unresolved.",
  hook: "The player knows Tino was taken alive, but not by whom, why, or where. Begin with verified evidence; do not let a placeholder become an answer.",
  nodes: [
    {
      key: "the-missing-man", kind: "QUEST_START" as const, title: "The Missing Man",
      summary: "Canon floor: Tino was captured alive by an unidentified force. Everything beyond that fact must be earned or approved.",
      body: "Open from [[what-the-player-knows-about-tino]] and [[tino]]. Preserve the player's war-buddy relationship and the uncertainty around the capture. Do not name the captor, motive, location, or method here.",
      completion: null, canvasX: 0, canvasY: 0, references: ["tino", "what-the-player-knows-about-tino"],
    },
    {
      key: "the-trail-he-left", kind: "QUEST_STEP" as const, title: "The Trail He Left",
      summary: "A proposed investigative bridge: reconstruct the work Tino was doing immediately before he was taken without deciding what he found.",
      body: "[[the-empty-cribs]] proposes that this trail is Tino's search for his missing children and that [[amanda]] eventually recognizes it. That material remains brainstorming. If the room accepts it, evidence should prove persistence and direction — never the abductors' identity.",
      completion: "The party authenticates a lead that can point toward Tino's captors without yet identifying them.",
      canvasX: 320, canvasY: 0, references: ["tino", "amanda", "the-empty-cribs"],
    },
    {
      key: "owner-gate-the-captor", kind: "CONDITION" as const, title: "Owner Gate — The Captor",
      summary: "Protected decision: who took Tino, why he was kept alive, and whether that force connects to the missing children.",
      body: "Stop the outline here until the owner approves the captor, motive, site, and relationship to [[the-empty-cribs]]. A writer may collect candidates and consequences, but no faction link, proper name, or apparently factual placeholder belongs on the canon path before that call.",
      completion: null, canvasX: 640, canvasY: 0, references: ["the-empty-cribs"],
    },
    {
      key: "the-containment-site", kind: "QUEST_STEP" as const, title: "The Containment Site",
      summary: "Proposed mature 17+ escalation: the search reaches the place Tino is held and reveals the cost of keeping him alive.",
      body: "The visual language may use grounded body horror, surgical restraint, failed magical containment, and industrial cruelty at a Mature 17+ intensity. Accuracy matters more than spectacle: the approved captor and motive must determine every device, guard, wound, and environmental clue. [[the-empty-cribs]] proposes an Essence-experiment facility and requires Amanda; neither detail is canonized by this scaffold.",
      completion: "The party reaches Tino's secured containment area after the owner-gated facts have been approved and written into the board.",
      canvasX: 960, canvasY: 0, references: ["tino", "amanda", "the-empty-cribs"],
    },
    {
      key: "the-cell-opens", kind: "ENDING" as const, title: "The Cell Opens",
      summary: "A structural handoff, not a decided ending: Tino's condition and the consequences of reaching him belong to the approved resolution.",
      body: "Do not infer rescue, death, restoration, recruitment, or a boss encounter from this node. When the human decisions are made, replace this handoff with the actual branch or continuation and link every affected character and thread explicitly.",
      completion: null, canvasX: 1280, canvasY: 0, references: ["tino", "amanda"],
    },
  ],
  edges: [
    { key: "missing-to-trail", from: "the-missing-man", to: "the-trail-he-left", label: null, condition: "A verified trace of Tino's pre-capture work survives." },
    { key: "trail-to-owner-gate", from: "the-trail-he-left", to: "owner-gate-the-captor", label: null, condition: "The investigation reaches the first fact that would identify the captor or motive." },
    { key: "owner-gate-to-site", from: "owner-gate-the-captor", to: "the-containment-site", label: "Approve the captivity premise", condition: "Owner approval records the captor, motive, location, and relationship to The Empty Cribs." },
    { key: "site-to-cell", from: "the-containment-site", to: "the-cell-opens", label: null, condition: "The party reaches the secured containment area." },
  ],
} as const;

