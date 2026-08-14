import { Award, BadgeCheck, Crown, Gem, Medal, Shield, Trophy } from "lucide-react";
import type { AchievementRarity, AchievementRewardKind } from "@habitat/shared";
import { collectibleAtlasGrid, collectibleAtlasPaths, getCollectibleVisual, type PhysicalRewardKind } from "@/lib/collectible-art";

const iconByKind = {
  TITLE: Crown,
  AVATAR_BORDER: Gem,
  PROFILE_LAYOUT: Shield,
  BADGE: BadgeCheck,
  MEDAL: Medal,
  TROPHY: Trophy,
} satisfies Record<AchievementRewardKind, typeof Award>;

export function RewardEmblem({ rarity, kind = "BADGE", code, size = "medium" }: { rarity: AchievementRarity; kind?: AchievementRewardKind; code?: string; size?: "small" | "medium" | "large" }) {
  const Icon = iconByKind[kind];
  const physical = kind === "BADGE" || kind === "MEDAL" || kind === "TROPHY";
  const authored = physical && code ? getCollectibleVisual({ code, kind: kind as PhysicalRewardKind }) : null;
  // A collectible without its own relief falls back to the kind icon rather than
  // wearing another collectible's artwork.
  const visual = authored?.tile === null ? null : authored;
  const grid = visual ? collectibleAtlasGrid[visual.atlas] : null;
  const column = visual && grid ? (visual.tile ?? 0) % grid.columns : 0;
  const row = visual && grid ? Math.floor((visual.tile ?? 0) / grid.columns) : 0;
  return <span className={`reward-emblem rarity-${rarity.toLowerCase().replaceAll("_", "-")} reward-emblem-${size}`} aria-hidden="true">
    <i /><span className={visual ? "has-collectible-art" : ""} style={visual && grid ? { backgroundImage: `url(${collectibleAtlasPaths[visual.atlas]})`, backgroundSize: `${grid.columns * 100}% ${grid.rows * 100}%`, backgroundPosition: `${column / (grid.columns - 1) * 100}% ${row / (grid.rows - 1) * 100}%` } : undefined}><Icon /></span><b />
  </span>;
}
