import { notFound } from "next/navigation";
import { BadgeCheck, Crosshair, Link2, Radio, Shield, Sparkles, Swords, TimerReset, UsersRound } from "lucide-react";
import { getClubGameBySlug } from "@/lib/club-games";

export default async function ClubGameDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getClubGameBySlug(slug);
  if (!game) notFound();

  return <section className={`club-room club-${game.accent}`}>
    <div className="club-hero-shell">
      <div className="club-hero-copy">
        <p className="eyebrow"><Radio size={13} aria-hidden="true" /> Club game · squad channel</p>
        <h1>{game.name}</h1>
        <p className="club-tagline">{game.tagline}</p>
        <p className="club-hero-description">{game.description}</p>
        <div className="club-hero-markers"><span><Shield aria-hidden="true" size={15} /> Hosted by the publisher</span><span><BadgeCheck aria-hidden="true" size={15} /> Member profiles are opt-in</span></div>
      </div>
      <div className="club-hero-visual" aria-hidden="true">
        <div className="rivals-orbit orbit-one" /><div className="rivals-orbit orbit-two" /><div className="rivals-core"><Crosshair size={54} strokeWidth={1.05} /></div>
        <div className="rivals-scan" /><div className="rivals-grid" /><i className="rivals-star star-one" /><i className="rivals-star star-two" /><i className="rivals-star star-three" />
      </div>
    </div>

    <div className="club-room-body">
      <section className="club-command-strip">
        <div><p className="eyebrow">Identity protocol</p><h2>Steam in. Rivals UID next.</h2><p>{game.platformNote}</p></div>
        <div className="club-source-state"><Link2 aria-hidden="true" size={19} /><strong>{game.sourceLabel}</strong><span>Stats remain unavailable until an administrator configures the private provider key.</span></div>
      </section>

      <section className="club-launch-grid">
        <article className="club-launch-card club-launch-primary"><Sparkles aria-hidden="true" /><p className="eyebrow">First deployment</p><h2>Build the squad board.</h2><p>When the adapter is live, members will confirm one Rivals handle. Habitat resolves and retains the stable provider UID, then syncs permitted profile data with an honest timestamp.</p><button type="button" disabled>Profile link opens with adapter</button></article>
        <article className="club-launch-card"><UsersRound aria-hidden="true" /><p className="eyebrow">Squad roster</p><h2>Awaiting first connection</h2><p>No Marvel Rivals profiles are connected yet. A member becomes visible here only after explicitly linking a profile.</p></article>
        <article className="club-launch-card"><Swords aria-hidden="true" /><p className="eyebrow">Game night</p><h2>Ready to rally.</h2><p>Marvel Rivals can already take its place in the clubhouse conversation; stats, matches, and ranks arrive only from the configured provider.</p></article>
      </section>

      <section className="club-stats-surface">
        <div className="club-stats-heading"><div><p className="eyebrow">Telemetry, with receipts</p><h2>Rivals intelligence</h2></div><span><TimerReset aria-hidden="true" size={14} /> Awaiting first approved sync</span></div>
        <div className="club-stat-grid">
          <article><span>Rank</span><strong>—</strong><p>Profile connection required</p></article>
          <article><span>Hero pool</span><strong>—</strong><p>Profile connection required</p></article>
          <article><span>Match history</span><strong>—</strong><p>Profile connection required</p></article>
          <article><span>Habitat leaders</span><strong>—</strong><p>Profile connection required</p></article>
        </div>
        <p className="club-data-note">No placeholder statistics. This board will only populate from an opt-in member profile and a successful provider response.</p>
      </section>
    </div>
  </section>;
}
