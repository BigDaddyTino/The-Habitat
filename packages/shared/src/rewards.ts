import type { AchievementRarity } from "./achievements";

export const achievementRewardKinds = ["TITLE", "AVATAR_BORDER", "PROFILE_LAYOUT", "BADGE", "MEDAL", "TROPHY"] as const;
export type AchievementRewardKind = (typeof achievementRewardKinds)[number];

export const rarityPresentation: Record<AchievementRarity, {
  label: string;
  rank: number;
  color: string;
  glow: string;
  ceremony: "spark" | "flare" | "storm" | "legendary";
}> = {
  COMMON: { label: "Common", rank: 1, color: "#aeb8ad", glow: "#80907f", ceremony: "spark" },
  UNCOMMON: { label: "Uncommon", rank: 2, color: "#8fc77d", glow: "#5f9f57", ceremony: "spark" },
  RARE: { label: "Rare", rank: 3, color: "#78b7d7", glow: "#4c8fb7", ceremony: "flare" },
  EPIC: { label: "Epic", rank: 4, color: "#b590df", glow: "#8f60cb", ceremony: "storm" },
  LEGENDARY: { label: "Legendary", rank: 5, color: "#f0c56e", glow: "#dc7c32", ceremony: "legendary" },
  QUESTIONABLE_LIFE_CHOICE: { label: "Questionable Life Choice", rank: 6, color: "#ffdf8b", glow: "#d94835", ceremony: "legendary" },
};

export function isAchievementRarity(value: string): value is AchievementRarity {
  return value in rarityPresentation;
}
