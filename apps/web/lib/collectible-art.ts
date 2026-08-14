import type { AchievementRarity, AchievementRewardKind } from "@habitat/shared";

export type PhysicalRewardKind = Extract<AchievementRewardKind, "BADGE" | "MEDAL" | "TROPHY">;

export type CollectibleIdentity = {
  code: string;
  name: string;
  kind: PhysicalRewardKind;
  rarity: AchievementRarity;
  achievementName?: string;
  unlockedAt?: string;
};

export type CollectibleVisual = {
  atlas: "badge" | "medal" | "trophy";
  tile: number;
  form: string;
  metal: string;
  accent: string;
  enamel: string;
  ribbon?: readonly [string, string];
  inscription: string;
};

const visual = (value: CollectibleVisual) => value;

export const collectibleVisuals: Record<string, CollectibleVisual> = {
  "first-round": visual({ atlas: "badge", tile: 0, form: "tankard", metal: "#b98a46", accent: "#f0cf82", enamel: "#193126", inscription: "THREE ROUNDS. ONE HOME." }),
  "frequent-flyer": visual({ atlas: "badge", tile: 1, form: "wing", metal: "#8c9aa0", accent: "#d7d5ba", enamel: "#17373a", inscription: "TWENTY-FIVE RETURNS." }),
  "all-worlds": visual({ atlas: "badge", tile: 2, form: "compass", metal: "#d0a450", accent: "#ffe6a0", enamel: "#203a2c", inscription: "EVERY WORLD. NO EXCUSES." }),
  "five-world-passport": visual({ atlas: "badge", tile: 3, form: "passport", metal: "#9f7048", accent: "#d8b37d", enamel: "#26392f", inscription: "FIVE FRONTIERS STAMPED." }),
  "old-save-file": visual({ atlas: "badge", tile: 4, form: "disk", metal: "#778185", accent: "#c6b78f", enamel: "#343935", inscription: "RECOVERED BEFORE RECEIPTS." }),
  "scarred-atlas": visual({ atlas: "badge", tile: 5, form: "atlas", metal: "#9d7547", accent: "#d1b176", enamel: "#273a2b", inscription: "THREE CHAPTERS SURVIVED." }),
  "level-5": visual({ atlas: "badge", tile: 6, form: "patch-five", metal: "#8b7651", accent: "#d7c084", enamel: "#27392c", inscription: "FIRST MILES BEHIND YOU." }),
  "level-10": visual({ atlas: "badge", tile: 7, form: "patch-ten", metal: "#8f6242", accent: "#d6a86b", enamel: "#31291f", inscription: "FRESH SPAWN NO MORE." }),
  "level-50": visual({ atlas: "badge", tile: 8, form: "half-sun", metal: "#9a78bd", accent: "#d9b9f0", enamel: "#241e30", inscription: "HALFWAY. ALLEGEDLY." }),
  "level-100": visual({ atlas: "badge", tile: 9, form: "summit", metal: "#d3a451", accent: "#ffe39a", enamel: "#351c18", inscription: "THE DELIBERATE SUMMIT." }),
  "tutorial-survivor": visual({ atlas: "badge", tile: 10, form: "broken-compass", metal: "#728b91", accent: "#c0dae0", enamel: "#1b2a2f", inscription: "INSTRUCTIONS DEFEATED." }),

  "five-world-compass": visual({ atlas: "medal", tile: 0, form: "compass-medal", metal: "#c89d54", accent: "#f0d69b", enamel: "#26392f", ribbon: ["#27483d", "#c59a51"], inscription: "FIVE WORLDS. KEEP MOVING." }),
  "archive-service-medal": visual({ atlas: "medal", tile: 1, form: "archive-medal", metal: "#9a7b58", accent: "#d9c08e", enamel: "#303028", ribbon: ["#5b4432", "#c6aa79"], inscription: "OLD LOGS STILL TALK." }),
  "overpacked-medal": visual({ atlas: "medal", tile: 2, form: "pack-medal", metal: "#89684a", accent: "#d4a864", enamel: "#28372b", ribbon: ["#394c36", "#a36d37"], inscription: "EVERYTHING EXCEPT RESTRAINT." }),
  "valheim-iron-rune": visual({ atlas: "medal", tile: 3, form: "rune-medal", metal: "#606c71", accent: "#d08a4e", enamel: "#1f2525", ribbon: ["#252b2b", "#a44932"], inscription: "FIFTEEN LONGHOUSE RETURNS." }),
  "palworld-management-seal": visual({ atlas: "medal", tile: 4, form: "paw-medal", metal: "#b18b58", accent: "#d7c590", enamel: "#24382a", ribbon: ["#315841", "#a53b34"], inscription: "ETHICALLY INCONCLUSIVE." }),
  "blood-moon-service": visual({ atlas: "medal", tile: 5, form: "moon-medal", metal: "#805348", accent: "#dc5b43", enamel: "#2e1718", ribbon: ["#481d20", "#9d4939"], inscription: "FIFTEEN NAVEZGANE RETURNS." }),
  "knox-return-medal": visual({ atlas: "medal", tile: 6, form: "knox-medal", metal: "#777a70", accent: "#d1c9a4", enamel: "#292b28", ribbon: ["#4e5147", "#d1c38d"], inscription: "ATTENDANCE IMPECCABLE." }),
  "embervale-breather": visual({ atlas: "medal", tile: 7, form: "breather-medal", metal: "#75627d", accent: "#c3a4d0", enamel: "#241e2b", ribbon: ["#402f4c", "#8d654c"], inscription: "CLEAN AIR OPTIONAL." }),
  "wild-country-ward": visual({ atlas: "medal", tile: 8, form: "dragon-medal", metal: "#9c714c", accent: "#df9c60", enamel: "#2e2620", ribbon: ["#53352c", "#b27843"], inscription: "DRAGON CONTROL PENDING." }),

  "fifty-visit-antler": visual({ atlas: "trophy", tile: 0, form: "antler", metal: "#a9834f", accent: "#e0c28d", enamel: "#2a241c", inscription: "FIFTY TIMES THROUGH THE DOOR." }),
  "six-world-crown": visual({ atlas: "trophy", tile: 1, form: "crown", metal: "#d2a84f", accent: "#ffe19a", enamel: "#3a2021", inscription: "SOVEREIGN OF SIX WORLDS." }),
  "committee-concern": visual({ atlas: "trophy", tile: 2, form: "concern", metal: "#b08b57", accent: "#e5ca8e", enamel: "#2b2522", inscription: "THE COMMITTEE IS CONCERNED." }),
  "grooved-armchair": visual({ atlas: "trophy", tile: 3, form: "armchair", metal: "#8e6a45", accent: "#c99f68", enamel: "#34241d", inscription: "ONE HUNDRED FIFTY ARRIVALS." }),
  "deed-to-the-lodge": visual({ atlas: "trophy", tile: 4, form: "deed", metal: "#bd9250", accent: "#e0c385", enamel: "#31261f", inscription: "FIVE HUNDRED. KEY STILL WORKS." }),
  "dusty-ledger": visual({ atlas: "trophy", tile: 5, form: "ledger", metal: "#806a4b", accent: "#c9ad78", enamel: "#28251f", inscription: "TEN OLD CHAPTERS AUTHENTICATED." }),
  "centurion-monument": visual({ atlas: "trophy", tile: 6, form: "centurion", metal: "#d2a44f", accent: "#ffd983", enamel: "#32221d", inscription: "LEVEL ONE HUNDRED. ENTERED IN HISTORY." }),
  "window-bear": visual({ atlas: "trophy", tile: 7, form: "bear", metal: "#9b7147", accent: "#d8ae73", enamel: "#2c221c", inscription: "YOU TAPPED. IT OBJECTED." }),
  "bossbreaker-reliquary": visual({ atlas: "trophy", tile: 6, form: "boss-reliquary", metal: "#9f6d36", accent: "#f0c873", enamel: "#241815", inscription: "THE WORLD STOOD. THE BOSS DID NOT." }),
};

const fallbackByKind: Record<PhysicalRewardKind, CollectibleVisual> = {
  BADGE: visual({ atlas: "badge", tile: 11, form: "compass", metal: "#9d8053", accent: "#ddc28c", enamel: "#253229", inscription: "VERIFIED BY THE HABITAT." }),
  MEDAL: visual({ atlas: "medal", tile: 0, form: "compass-medal", metal: "#9d8053", accent: "#ddc28c", enamel: "#253229", ribbon: ["#33453b", "#a9854e"], inscription: "VERIFIED BY THE HABITAT." }),
  TROPHY: visual({ atlas: "trophy", tile: 6, form: "centurion", metal: "#9d8053", accent: "#ddc28c", enamel: "#253229", inscription: "VERIFIED BY THE HABITAT." }),
};

export function getCollectibleVisual(item: Pick<CollectibleIdentity, "code" | "kind">) {
  return collectibleVisuals[item.code] ?? fallbackByKind[item.kind];
}

export const collectibleAtlasPaths = {
  badge: "/images/collectibles/badge-relief-atlas.png",
  medal: "/images/collectibles/medal-relief-atlas.png",
  trophy: "/images/collectibles/trophy-relief-atlas.png",
} as const;

export const collectibleAtlasGrid = {
  badge: { columns: 4, rows: 3 },
  medal: { columns: 3, rows: 3 },
  trophy: { columns: 4, rows: 2 },
} as const;
