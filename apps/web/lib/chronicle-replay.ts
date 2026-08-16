import type { ChronicleEventView, ChronicleMomentKind } from "./world-data";

export const HABITAT_TIME_ZONE = "America/New_York";

export type ChronicleReplayEvent = Omit<ChronicleEventView, "occurredAt"> & { occurredAt: string };

export type ChronicleReplayViewer = {
  displayName: string;
  username?: string;
  avatar: string;
  avatarBorderClass: string;
  title?: { name: string; className: string };
  actorHrefs: string[];
};

export type ChronicleChapter = {
  key: string;
  label: string;
  events: ChronicleReplayEvent[];
  worlds: string[];
  actors: Array<{ name: string; href?: string }>;
  spotlightCount: number;
};

const kindLabels: Record<ChronicleMomentKind, string> = {
  arrival: "Arrival",
  departure: "Departure",
  achievement: "Achievement moment",
  record: "Record moment",
  gathering: "The crew assembled",
  rest: "The world went quiet",
  danger: "Unexpected trouble",
  world: "World signal",
  activity: "Club activity",
};

/** Single source of truth for moment colour: the CSS `--scene` palette and the exported PNG must agree. */
const kindColors: Record<ChronicleMomentKind, string> = {
  arrival: "#6e9a5b",
  departure: "#89918c",
  achievement: "#d6b45f",
  record: "#77aaa5",
  gathering: "#dc6b32",
  rest: "#71808b",
  danger: "#cd5650",
  world: "#a59db8",
  activity: "#8da7c1",
};

/** Every kind the replay can render, without pulling the database-backed world-data module into the client. */
export const chronicleReplayKinds = Object.keys(kindLabels) as ChronicleMomentKind[];

export function chronicleKindLabel(kind: ChronicleMomentKind) {
  return kindLabels[kind];
}

export function chronicleKindColor(kind: ChronicleMomentKind) {
  return kindColors[kind];
}

/** The newest three moments of a chapter, newest first — shared by the copy action and the PNG card. */
export function chapterHighlights(chapter: ChronicleChapter) {
  return chapter.events.slice(-3).reverse();
}

export function groupChronicleEvents(events: ChronicleReplayEvent[]): ChronicleChapter[] {
  const groups = new Map<string, ChronicleReplayEvent[]>();
  for (const event of [...events].sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt))) {
    const key = habitatDateKey(event.occurredAt);
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }

  return [...groups.entries()].map(([key, dayEvents]) => {
    const actorMap = new Map<string, { name: string; href?: string }>();
    for (const event of dayEvents) {
      if (!event.actor) continue;
      const existing = actorMap.get(event.actor);
      actorMap.set(event.actor, { name: event.actor, href: existing?.href ?? event.actorHref });
    }
    return {
      key,
      label: formatChapterDate(dayEvents[0]!.occurredAt),
      events: [...dayEvents].reverse(),
      worlds: [...new Set(dayEvents.map((event) => event.world))],
      actors: [...actorMap.values()],
      spotlightCount: dayEvents.filter((event) => event.kind === "achievement" || event.kind === "record").length,
    };
  });
}

export function isViewerMoment(event: ChronicleReplayEvent, viewer: ChronicleReplayViewer | null | undefined) {
  return Boolean(event.actorHref && viewer?.actorHrefs.includes(event.actorHref));
}

export function viewerChronicleEvents(events: ChronicleReplayEvent[], viewer: ChronicleReplayViewer | null | undefined) {
  return viewer ? events.filter((event) => isViewerMoment(event, viewer)) : [];
}

export function buildRecapCopy(chapter: ChronicleChapter, directorName?: string) {
  const worldLine = chapter.worlds.length === 1 ? chapter.worlds[0] : `${chapter.worlds.length} Habitat worlds`;
  const moments = chapterHighlights(chapter).map((event) => `• ${event.text}`).join("\n");
  const heading = directorName ? `${directorName}’s Chronicle — Director’s Cut` : "Previously in the Habitat";
  return `${heading} — ${chapter.label}\n${chapter.events.length} verified moment${chapter.events.length === 1 ? "" : "s"} across ${worldLine}.\n\n${moments}\n\nPrivate Chronicle recap`;
}

function habitatDateKey(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: HABITAT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function formatChapterDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: HABITAT_TIME_ZONE, weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(value));
}
