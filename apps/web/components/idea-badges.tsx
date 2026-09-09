import { storyIdeaFacetColors, storyIdeaFacetLabels, storyIdeaStageLabel, type StoryIdeaFacet, type StoryThreadStatus } from "@habitat/shared";

/**
 * The Idea Center's small vocabulary, shared by the server pages and the
 * client gallery: a facet badge, a row of them that folds past three, the
 * stage chip, and a member's avatar.
 *
 * Colour reinforces the facet and never carries it alone — every badge has
 * its word on it, so the board reads the same in greyscale.
 */
export function FacetBadge({ facet, small = false }: { facet: StoryIdeaFacet; small?: boolean }) {
  return (
    <span className={`idea-badge${small ? " is-small" : ""}`} data-facet={facet} style={{ ["--facet" as string]: storyIdeaFacetColors[facet] }}>
      <i aria-hidden="true" />{storyIdeaFacetLabels[facet]}
    </span>
  );
}

export function FacetBadges({ facets, max = 3, small = false }: { facets: readonly StoryIdeaFacet[]; max?: number; small?: boolean }) {
  if (facets.length === 0) return <span className="idea-badge is-none">Not sorted yet</span>;
  const shown = facets.slice(0, max);
  const more = facets.length - shown.length;
  return (
    <span className="idea-badges">
      {shown.map((facet) => <FacetBadge facet={facet} key={facet} small={small} />)}
      {more > 0 ? <span className="idea-badge is-more" title={facets.slice(max).map((facet) => storyIdeaFacetLabels[facet]).join(", ")}>+{more}</span> : null}
    </span>
  );
}

export function StageChip({ status }: { status: StoryThreadStatus | null }) {
  return <span className={`idea-stage stage-${status ?? "brainstorming"}`}>{storyIdeaStageLabel(status)}</span>;
}

export function MemberAvatar({ name, image, size = 22 }: { name: string; image: string | null; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return image
    ? <img alt="" className="idea-avatar" height={size} src={image} width={size} />
    : <span aria-hidden="true" className="idea-avatar is-initial" style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}>{initial}</span>;
}
