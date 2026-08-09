export const roles = ["VIEWER", "USER", "ADMIN"] as const;

export type HabitatRole = (typeof roles)[number];

const roleRank: Record<HabitatRole, number> = {
  VIEWER: 0,
  USER: 1,
  ADMIN: 2,
};

export function hasRequiredRole(actual: HabitatRole | undefined, required: HabitatRole) {
  return actual !== undefined && roleRank[actual] >= roleRank[required];
}
