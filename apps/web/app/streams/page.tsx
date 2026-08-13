/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, BadgeCheck, Circle, Clock, Eye, Gamepad2, Headphones, Radio, Signal, Tv, Users } from "lucide-react";
import { auth } from "@/auth";
import { formatSessionDuration, formatUptime, formatViewerCount, getStreamShowcase, showcaseEmbedUrl, type ShowcaseChannel, type ShowcaseDiscordSignal } from "@/lib/stream-showcase";

export const metadata = {
  title: "On Air · The Habitat",
  description: "Who is broadcasting from God's Country right now.",
};

function when(value: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(value);
}

function broadcasterBadge(type: string | null) {
  if (type === "partner") return "Twitch partner";
  if (type === "affiliate") return "Twitch affiliate";
  return null;
}

function DiscordNote({ signal }: { signal: ShowcaseDiscordSignal }) {
  const label = signal.kind === "VOICE_GO_LIVE"
    ? `Go Live in ${signal.channelName ?? "a Habitat voice channel"}`
    : signal.activityName ? `Discord: ${signal.activityName}` : "Discord says they are streaming";
  return <span className="stream-discord-note" title={`Discord reported this at ${when(signal.observedAt)}`}>
    <Headphones aria-hidden="true" size={11} /> {label}
  </span>;
}

function LiveCard({ channel }: { channel: ShowcaseChannel }) {
  const uptime = channel.liveSince ? formatUptime(channel.liveSince) : null;
  const body = <>
    <div className="stream-card-frame">
      {channel.thumbnailUrl
        ? <img alt="" src={channel.thumbnailUrl} loading="lazy" />
        : <div className="stream-card-frame-empty" aria-hidden="true"><Tv size={26} /></div>}
      <span className="stream-live-pip"><Circle aria-hidden="true" size={7} /> Live</span>
      {channel.viewerCount !== null ? <span className="stream-card-viewers"><Eye aria-hidden="true" size={11} /> {formatViewerCount(channel.viewerCount)}</span> : null}
      {uptime ? <span className="stream-card-uptime"><Clock aria-hidden="true" size={11} /> {uptime}</span> : null}
    </div>
    <div className="stream-card-body">
      <div className="stream-card-identity">
        {channel.profileImageUrl ? <img alt="" src={channel.profileImageUrl} loading="lazy" /> : <span className="stream-avatar-fallback" aria-hidden="true">{channel.displayName.slice(0, 1)}</span>}
        <div>
          <strong>{channel.member.displayName}</strong>
          <small><BadgeCheck aria-hidden="true" size={10} /> {channel.displayName}</small>
        </div>
      </div>
      <p className="stream-card-title">{channel.title ?? "Broadcasting without a title."}</p>
      <div className="stream-card-meta">
        {channel.gameName ? <span><Gamepad2 aria-hidden="true" size={12} /> {channel.gameName}</span> : null}
        {channel.discord ? <DiscordNote signal={channel.discord} /> : null}
      </div>
    </div>
  </>;
  return channel.channelUrl
    ? <a className="stream-card live" href={channel.channelUrl} rel="noreferrer" target="_blank">{body}</a>
    : <article className="stream-card live">{body}</article>;
}

function OfflineCard({ channel }: { channel: ShowcaseChannel }) {
  const body = <>
    <div className="stream-roster-portrait">
      {channel.profileImageUrl ? <img alt="" src={channel.profileImageUrl} loading="lazy" /> : <span aria-hidden="true">{channel.displayName.slice(0, 1)}</span>}
    </div>
    <div className="stream-roster-copy">
      <strong>{channel.member.displayName}</strong>
      <small>{channel.displayName}{broadcasterBadge(channel.broadcasterType) ? ` · ${broadcasterBadge(channel.broadcasterType)}` : ""}</small>
      <span>{channel.lastLiveAt ? `Last live ${when(channel.lastLiveAt)}` : "No broadcast observed yet"}</span>
      {channel.discord ? <DiscordNote signal={channel.discord} /> : null}
    </div>
  </>;
  return channel.channelUrl
    ? <a className="stream-roster-card" href={channel.channelUrl} rel="noreferrer" target="_blank">{body}</a>
    : <article className="stream-roster-card">{body}</article>;
}

export default async function StreamsPage() {
  const [session, showcase] = await Promise.all([auth(), getStreamShowcase()]);
  const memberId = session?.user?.id && session.user.isActive ? session.user.id : null;
  const { featured, live, offline, recentSessions, discordOnly, integrationReady, embedParentHosts, totalViewers } = showcase;
  const embedUrl = featured ? showcaseEmbedUrl(featured.login, embedParentHosts) : null;
  const supporting = live.filter((channel) => channel.id !== featured?.id);
  const featuredUptime = featured?.liveSince ? formatUptime(featured.liveSince) : null;

  return <div className="stream-hall">
    <section className={`stream-hero ${featured ? "is-live" : "is-quiet"}`}>
      <div className="stream-hero-glow" aria-hidden="true" />
      <div className="content-shell stream-hero-inner">
        <div className="stream-hero-copy">
          <p className="eyebrow"><Radio aria-hidden="true" size={13} /> The broadcast wing</p>
          <h1>{featured ? "On Air" : "Off Air"}</h1>
          <p className="stream-hero-subtitle">God&apos;s Country, broadcasting</p>
          <p className="hero-copy">
            {featured
              ? `${featured.member.displayName} has the fire going${featured.gameName ? ` in ${featured.gameName}` : ""}. Pull up a chair.`
              : live.length > 0
                ? "The lodge is broadcasting."
                : "Nobody is broadcasting right now. The chairs stay warm, and the moment somebody goes live this room lights up on its own."}
          </p>
          <div className="hero-facts" aria-label="Broadcast overview">
            <div><Signal aria-hidden="true" /><strong>{live.length}</strong><span>{live.length === 1 ? "channel live" : "channels live"}</span></div>
            <div><Eye aria-hidden="true" /><strong>{totalViewers === null ? "—" : formatViewerCount(totalViewers)}</strong><span>watching now</span></div>
            <div><Users aria-hidden="true" /><strong>{live.length + offline.length}</strong><span>verified channels</span></div>
          </div>
          {memberId
            ? <Link className="primary-link" href="/profile">Put your channel on this wall <ArrowRight aria-hidden="true" size={17} /></Link>
            : <Link className="primary-link" href="/sign-in">Sign in to add your channel <ArrowRight aria-hidden="true" size={17} /></Link>}
        </div>

        {featured ? <div className="stream-hero-stage">
          <div className="stream-stage-frame">
            {embedUrl
              ? <iframe
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  height={378}
                  src={embedUrl}
                  title={`${featured.displayName} live on Twitch`}
                  width={672}
                />
              : featured.thumbnailUrl
                ? <a href={featured.channelUrl ?? "#"} rel="noreferrer" target="_blank"><img alt={`${featured.displayName} stream preview`} src={featured.thumbnailUrl} /></a>
                : <div className="stream-card-frame-empty" aria-hidden="true"><Tv size={30} /></div>}
          </div>
          <div className="stream-stage-caption">
            <span className="stream-live-pip"><Circle aria-hidden="true" size={7} /> Live</span>
            <strong>{featured.title ?? "Broadcasting without a title."}</strong>
            <small>
              {featured.displayName}
              {featured.gameName ? ` · ${featured.gameName}` : ""}
              {featured.viewerCount !== null ? ` · ${formatViewerCount(featured.viewerCount)} watching` : ""}
              {featuredUptime ? ` · up ${featuredUptime}` : ""}
            </small>
            {featured.channelUrl ? <a className="stream-stage-link" href={featured.channelUrl} rel="noreferrer" target="_blank">Watch on Twitch <ArrowRight aria-hidden="true" size={14} /></a> : null}
          </div>
        </div> : null}
      </div>
    </section>

    {!integrationReady ? <section className="content-shell stream-section">
      <div className="empty-data">
        <Radio aria-hidden="true" size={26} />
        <div>
          <h2>The Twitch feed is not connected yet</h2>
          <p>Live status stays blank until Habitat holds Twitch API credentials. Nothing here is a guess: an empty wall means Habitat has not been told how to ask Twitch, not that the lodge is quiet.</p>
        </div>
      </div>
    </section> : null}

    {supporting.length > 0 ? <section className="content-shell stream-section">
      <div className="section-heading">
        <div><p className="eyebrow">Also broadcasting</p><h2>More fires lit</h2></div>
      </div>
      <div className="stream-grid">{supporting.map((channel) => <LiveCard channel={channel} key={channel.id} />)}</div>
    </section> : null}

    {discordOnly.length > 0 ? <section className="content-shell stream-section">
      <div className="section-heading">
        <div><p className="eyebrow">Discord signal</p><h2>Streaming somewhere</h2></div>
        <p>Discord reports that these members are broadcasting. It never proves where to, so Habitat only links a destination it can match to a verified channel.</p>
      </div>
      <div className="stream-signal-row">
        {discordOnly.map(({ member, signal }) => <article className="stream-signal-card" key={`${member.username ?? member.displayName}-${signal.observedAt.toISOString()}`}>
          <div className="stream-signal-portrait">{member.avatarUrl ? <img alt="" src={member.avatarUrl} loading="lazy" /> : <span aria-hidden="true">{member.displayName.slice(0, 1)}</span>}</div>
          <div>
            <strong>{member.username ? <Link href={`/members/${member.username}`}>{member.displayName}</Link> : member.displayName}</strong>
            <DiscordNote signal={signal} />
            {signal.corroboratedUrl
              ? <a className="stream-signal-link" href={signal.corroboratedUrl} rel="noreferrer" target="_blank">Verified channel <ArrowRight aria-hidden="true" size={12} /></a>
              : signal.hasUnverifiedDestination
                ? <small className="stream-signal-caution">Destination unverified — not linked.</small>
                : null}
          </div>
        </article>)}
      </div>
    </section> : null}

    {offline.length > 0 ? <section className="content-shell stream-section">
      <div className="section-heading">
        <div><p className="eyebrow">The broadcast roster</p><h2>Off air, still ours</h2></div>
        <p>Every channel here was verified by its owner through Twitch and opted in to the wall.</p>
      </div>
      <div className="stream-roster">{offline.map((channel) => <OfflineCard channel={channel} key={channel.id} />)}</div>
    </section> : null}

    {recentSessions.length > 0 ? <section className="content-shell stream-section stream-log-section">
      <div className="section-heading">
        <div><p className="eyebrow">Broadcast log</p><h2>Recently live</h2></div>
        <p>Durations and peaks are only what Habitat actually observed while polling.</p>
      </div>
      <ol className="stream-log">
        {recentSessions.map((entry) => <li key={entry.id}>
          <time dateTime={entry.startedAt.toISOString()}>{when(entry.startedAt)}</time>
          <div>
            <strong>{entry.memberUsername ? <Link href={`/members/${entry.memberUsername}`}>{entry.channelDisplayName}</Link> : entry.channelDisplayName}</strong>
            <small>{entry.title ?? "No title recorded"}{entry.gameName ? ` · ${entry.gameName}` : ""}</small>
          </div>
          <span>{formatSessionDuration(entry.durationSeconds)}</span>
          <em>{entry.peakViewerCount !== null ? `${formatViewerCount(entry.peakViewerCount)} peak` : "—"}</em>
        </li>)}
      </ol>
    </section> : null}

    {live.length === 0 && offline.length === 0 && integrationReady ? <section className="content-shell stream-section">
      <div className="empty-data">
        <Tv aria-hidden="true" size={26} />
        <div>
          <h2>No channels on the wall yet</h2>
          <p>Verify your Twitch account from your profile and flip the showcase switch. Verification proves the channel is yours, and appearing here stays your choice — you can step off the wall at any time.</p>
        </div>
      </div>
    </section> : null}

    <footer className="content-shell stream-footer">
      <span>Live state comes from the Twitch API for channels their owners verified.</span>
      <p>Discord streaming presence is shown as a separate signal because it reports only that a member is broadcasting, never where. Nothing on this page is inferred from a typed-in handle.</p>
    </footer>
  </div>;
}
