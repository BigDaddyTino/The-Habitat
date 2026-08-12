const avatarBorders = new Set([
  "ember-ring",
  "aurora-ring",
  "ironwood-ring",
  "mythic-flame-ring",
  "centurion-ring",
  "porchlight-ring",
  "kindling-ring",
  "solar-flare-ring",
]);

const titlePlateBySlug: Record<string, number> = {
  "campfire-regular": 1,
  "door-gremlin": 2,
  "chronicle-menace": 3,
  trailblazer: 4,
  "lodge-legend": 5,
  "old-guard": 6,
  "seasoned-survivor": 7,
  "time-thief": 8,
  "grass-is-a-rumor": 9,
  "almost-unreasonable": 10,
  "habitat-centurion": 11,
  "lodge-owner-on-paper": 12,
  "bearly-welcome": 13,
};

export function avatarBorderClass(code: string | null | undefined) {
  return code && avatarBorders.has(code) ? `avatar-border-${code}` : "avatar-border-default";
}

export function titlePlateClass(slug: string | null | undefined, role?: string) {
  const plate = slug ? titlePlateBySlug[slug] : undefined;
  return `title-plate-${plate ?? (role === "ADMIN" ? 14 : role === "MEMBER" ? 15 : 16)}`;
}
