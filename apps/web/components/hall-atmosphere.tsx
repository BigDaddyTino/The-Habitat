import type { HallEncounter, HallSky } from "@/lib/hall-atmosphere";

export function HallAtmosphere({ sky, encounter }: { sky: HallSky; encounter: HallEncounter }) {
  return <div className={`hall-atmosphere sky-${sky} encounter-${encounter}`} aria-hidden="true">
    <div className="hall-sun" /><div className="hall-cloud cloud-one" /><div className="hall-cloud cloud-two" />
    <svg className="hall-pines" viewBox="0 0 1440 300" preserveAspectRatio="none"><path d="M0 300V180l52-90 31 58 36-110 43 118 55-70 58 104 63-151 54 151 56-91 41 64 45-125 43 125 59-75 63 117 50-143 51 143 52-73 52 89 71-165 52 165 55-122 43 122 74-88 49 88 53-160 55 160 48-96 59 96 46-136 44 136 73-68 66 68v120z" /></svg>
    <svg className="hall-raven" viewBox="0 0 120 50"><path d="M2 31c17-21 31-20 48-4 8-23 21-25 31 0 10-13 21-13 37 4-20-5-35-3-49 9-14-12-35-14-67-9z" /></svg>
    <svg className="hall-bear" viewBox="0 0 180 105"><path d="M18 89c4-24 23-38 46-36 8-21 28-27 42-12 15-9 34 0 38 18 19 1 29 12 28 30h-25v16h-15V89H76v16H60V89H44v16H29V89z" /><circle cx="98" cy="43" r="6" /></svg>
    <svg className="hall-ufo" viewBox="0 0 190 85"><path d="M70 42c5-26 45-26 50 0" /><path d="M32 46c25-19 101-19 126 0-14 17-104 17-126 0z" /><path d="M53 65v14m42-11v14m42-17v14" /></svg>
    <svg className="hall-comet" viewBox="0 0 240 110"><path d="M0 103 176 20" /><circle cx="191" cy="13" r="12" /></svg>
    <div className="hall-eclipse" /><div className="hall-blood-moon" />
  </div>;
}
