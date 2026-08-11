export type HallSky = "sunrise" | "midday" | "sunset" | "night";
export type HallEncounter = "none" | "birds" | "bear" | "ufo" | "comet" | "aurora" | "fireflies" | "eclipse" | "blood-moon" | "lightning" | "storm";

export type HallEncounterWindow = {
  encounter: Exclude<HallEncounter, "none">;
  encounterKey: string;
  startsAtSecond: number;
  endsAtSecond: number;
};

export type GreatHallAtmosphere = {
  sky: HallSky;
  encounter: HallEncounter;
  encounterKey: string | null;
  encounterDurationSeconds: number;
  encounterProgress: number;
};

const EASTERN_TIME = "America/New_York";
const WINDOWS_PER_HOUR = 3;
const SEGMENT_SECONDS = 20 * 60;

const encounterDuration: Record<Exclude<HallEncounter, "none">, number> = {
  birds: 22,
  bear: 45,
  ufo: 18,
  comet: 12,
  aurora: 55,
  fireflies: 50,
  eclipse: 48,
  "blood-moon": 55,
  lightning: 24,
  storm: 55,
};

const encountersBySky: Record<HallSky, Array<Exclude<HallEncounter, "none">>> = {
  sunrise: ["birds", "bear", "comet", "storm", "lightning", "eclipse"],
  midday: ["birds", "bear", "ufo", "storm", "lightning", "eclipse"],
  sunset: ["birds", "bear", "comet", "fireflies", "storm", "lightning"],
  night: ["bear", "ufo", "comet", "aurora", "fireflies", "blood-moon", "lightning", "storm"],
};

function easternParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const raw = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "00";
  const numeric = (type: Intl.DateTimeFormatPartTypes) => Number(raw(type));
  return {
    year: raw("year"),
    month: raw("month"),
    day: raw("day"),
    hour: numeric("hour"),
    minute: numeric("minute"),
    second: numeric("second"),
  };
}

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function randomFromSeed(seed: number) {
  let state = seed || 0x6d2b79f5;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function getHallSky(hour: number): HallSky {
  if (hour >= 5 && hour < 8) return "sunrise";
  if (hour >= 8 && hour < 16) return "midday";
  if (hour >= 16 && hour < 20) return "sunset";
  return "night";
}

export function getHallEncounterSchedule(now = new Date()): HallEncounterWindow[] {
  const parts = easternParts(now);
  const sky = getHallSky(parts.hour);
  const hourKey = `${parts.year}-${parts.month}-${parts.day}T${String(parts.hour).padStart(2, "0")}`;
  const random = randomFromSeed(hash(`the-habitat:${hourKey}`));
  const available = [...encountersBySky[sky]];

  return Array.from({ length: WINDOWS_PER_HOUR }, (_, slot) => {
    const encounterIndex = Math.floor(random() * available.length);
    const encounter = available.splice(encounterIndex, 1)[0] ?? "birds";
    const duration = encounterDuration[encounter];
    const margin = 90;
    const availableStartRange = SEGMENT_SECONDS - duration - margin * 2;
    const startsAtSecond = slot * SEGMENT_SECONDS + margin + Math.floor(random() * availableStartRange);
    return {
      encounter,
      encounterKey: `${hourKey}:${slot}:${encounter}`,
      startsAtSecond,
      endsAtSecond: startsAtSecond + duration,
    };
  });
}

export function getGreatHallAtmosphere(now = new Date()): GreatHallAtmosphere {
  const parts = easternParts(now);
  const secondOfHour = parts.minute * 60 + parts.second + now.getMilliseconds() / 1000;
  const activeWindow = getHallEncounterSchedule(now).find(
    (window) => secondOfHour >= window.startsAtSecond && secondOfHour < window.endsAtSecond,
  );
  return {
    sky: getHallSky(parts.hour),
    encounter: activeWindow?.encounter ?? "none",
    encounterKey: activeWindow?.encounterKey ?? null,
    encounterDurationSeconds: activeWindow ? activeWindow.endsAtSecond - activeWindow.startsAtSecond : 0,
    encounterProgress: activeWindow
      ? Math.min(1, Math.max(0, (secondOfHour - activeWindow.startsAtSecond) / (activeWindow.endsAtSecond - activeWindow.startsAtSecond)))
      : 0,
  };
}

export function isCurrentHallEncounter(encounter: Exclude<HallEncounter, "none">, encounterKey: string, now = new Date()) {
  const atmosphere = getGreatHallAtmosphere(now);
  return atmosphere.encounter === encounter && atmosphere.encounterKey === encounterKey;
}
