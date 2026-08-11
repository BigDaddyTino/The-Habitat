export type HallSky = "sunrise" | "midday" | "sunset" | "night";
export type HallEncounter = "raven" | "bear" | "ufo" | "comet" | "eclipse" | "blood-moon";

export function getGreatHallAtmosphere(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23", day: "numeric", month: "numeric" }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const hour = value("hour");
  const seed = value("month") * 31 + value("day") + Math.floor(now.getTime() / (1000 * 60 * 20));
  const sky: HallSky = hour >= 5 && hour < 8 ? "sunrise" : hour >= 8 && hour < 16 ? "midday" : hour >= 16 && hour < 20 ? "sunset" : "night";
  const encounters: HallEncounter[] = ["raven", "bear", "ufo", "comet", "eclipse", "blood-moon"];
  return { sky, encounter: encounters[seed % encounters.length] };
}
