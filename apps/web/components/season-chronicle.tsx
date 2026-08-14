"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Film, RotateCcw, Sparkles, Trophy, Users } from "lucide-react";

export type SeasonChronicleStory = {
  seasonName: string;
  ordinal: number;
  theme: string;
  communityXp: number;
  memberCount: number;
  contributors: Array<{ userId: string; name: string; username: string | null; xp: number }>;
  expeditions: Array<{ name: string; gameType: string; progress: number; threshold: number; completedAt: string | null }>;
  quests: Array<{ name: string; scope: string; completions: number }>;
};

export function SeasonChronicle({ story }: { story: SeasonChronicleStory }) {
  const [take, setTake] = useState(0);
  const completedExpeditions = story.expeditions.filter((entry) => entry.completedAt).length;
  const top = story.contributors[0];
  return <section className="season-film" key={take}>
    <div className="season-film-grain" aria-hidden="true" />
    <nav><Link href="/seasons"><ChevronLeft aria-hidden="true" /> Seasons</Link><button type="button" onClick={() => setTake((value) => value + 1)}><RotateCcw aria-hidden="true" /> Replay chronicle</button></nav>
    <header className="season-film-title"><p>THE HABITAT PRESENTS</p><span>Season {String(story.ordinal).padStart(2, "0")}</span><h1>{story.seasonName}</h1><i>{story.theme}</i><Film aria-hidden="true" /></header>
    <div className="season-film-beat beat-one"><Sparkles aria-hidden="true" /><p>Together, the lodge raised</p><strong>{story.communityXp.toLocaleString()}</strong><span>season XP without surrendering a single point of lifetime progress.</span></div>
    <div className="season-film-beat beat-two"><Users aria-hidden="true" /><p>{story.memberCount} expedition members</p><strong>{completedExpeditions} / {story.expeditions.length}</strong><span>game expeditions completed</span></div>
    <section className="season-film-expeditions"><p className="eyebrow">The routes we marked</p><div>{story.expeditions.map((expedition) => <article className={expedition.completedAt ? "complete" : ""} key={expedition.name}><span>{expedition.gameType.replaceAll("_", " ")}</span><strong>{expedition.name}</strong><small>{expedition.progress.toLocaleString()} / {expedition.threshold.toLocaleString()}</small></article>)}</div></section>
    <section className="season-film-roll"><p className="eyebrow">The names in the ledger</p><h2>{top ? `${top.name} led the trail.` : "The ledger stayed quiet."}</h2><ol>{story.contributors.slice(0, 8).map((entry, index) => <li key={entry.userId}><span>{String(index + 1).padStart(2, "0")}</span>{entry.username ? <Link href={`/members/${entry.username}`}>{entry.name}</Link> : <strong>{entry.name}</strong>}<b>{entry.xp.toLocaleString()} XP</b></li>)}</ol></section>
    <footer className="season-film-finale"><Trophy aria-hidden="true" /><p>The chronicle closes. The shelf remains.</p><h2>{story.ordinal === 1 ? "Founders of the First Light" : `Veterans of ${story.seasonName}`}</h2><span>Lifetime levels · achievements · records · permanent commemorative trophies</span><Link href="/seasons">Return to the expedition board</Link></footer>
  </section>;
}
