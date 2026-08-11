import { Award, BadgeCheck, Crown, Gem, Medal, Shield, Trophy } from "lucide-react";
import type { AchievementRarity, AchievementRewardKind } from "@habitat/shared";

const iconByKind = {
  TITLE: Crown,
  AVATAR_BORDER: Gem,
  PROFILE_LAYOUT: Shield,
  BADGE: BadgeCheck,
  MEDAL: Medal,
  TROPHY: Trophy,
} satisfies Record<AchievementRewardKind, typeof Award>;

export function RewardEmblem({ rarity, kind = "BADGE", size = "medium" }: { rarity: AchievementRarity; kind?: AchievementRewardKind; size?: "small" | "medium" | "large" }) {
  const Icon = iconByKind[kind];
  return <span className={`reward-emblem rarity-${rarity.toLowerCase().replaceAll("_", "-")} reward-emblem-${size}`} aria-hidden="true">
    <i /><span><Icon /></span><b />
  </span>;
}
