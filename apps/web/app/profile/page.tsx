/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  BadgeCheck,
  Check,
  ChevronRight,
  ExternalLink,
  Gamepad2,
  ImagePlus,
  Link2,
  Map,
  Medal,
  Palette,
  Radio,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  Vault,
} from "lucide-react";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import { progressionForXp, twitchChannelUrl, type AchievementRarity } from "@habitat/shared";
import { TrophyCabinet, type CabinetItem } from "@/components/trophy-cabinet";
import { SocialAccountForm } from "@/components/social-account-form";
import { socialPlatformLabels } from "@/lib/social-platforms";
import { avatarBorderClass, titlePlateClass } from "@/lib/reward-presentation";
import { twitchLinkNotice } from "@/lib/twitch-link";
import { disconnectTwitchChannel, updateTwitchShowcaseVisibility } from "@/app/streams/actions";
import {
  disableSteamEnrichment,
  disconnectSteam,
  enableSteamEnrichment,
  equipCosmetic,
  equipTitle,
  removeSocialAccount,
  selectAvatarPreset,
  updateProfile,
  updateSteamEnrichmentVisibility,
} from "./actions";

const db = getPrismaClient();
const avatarPresets = ["/images/avatars/campfire.svg", "/images/avatars/raven.svg", "/images/avatars/mountain.svg", "/images/avatars/ufo.svg"];

type ProfileSearchParams = Promise<{ steam?: string | string[]; twitch?: string | string[] }>;

export default async function ProfilePage({ searchParams }: { searchParams: ProfileSearchParams }) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) redirect("/sign-in");

  const linkStatuses = await searchParams;
  const steamParamValue = linkStatuses.steam;
  const steamStatus = Array.isArray(steamParamValue) ? steamParamValue[0] : steamParamValue;
  const connectedMatch = steamStatus?.match(/^connected-(\d+)$/);
  const linkedIdentityCount = connectedMatch ? Number.parseInt(connectedMatch[1] ?? "0", 10) : null;
  const twitchNotice = twitchLinkNotice(linkStatuses.twitch);

  const [member, identities, titles, rewards, xpTotal, clubProfiles, twitchChannel] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: {
        name: true,
        username: true,
        displayName: true,
        image: true,
        bio: true,
        avatarBorder: true,
        profileLayout: true,
        socialAccounts: {
          include: {
            steamProfile: {
              include: {
                libraryGames: {
                  where: { isCurrent: true },
                  include: { app: { select: { appId: true, name: true, iconHash: true } } },
                  orderBy: { playtimeMinutes: "desc" },
                },
                achievementSyncs: { select: { status: true, definitionCount: true, achievedCount: true, lastSuccessfulAt: true } },
              },
            },
          },
          orderBy: { platform: "asc" },
        },
      },
    }),
    db.playerIdentity.findMany({
      where: { userId: session.user.id },
      include: { server: { select: { displayName: true, worldName: true } }, _count: { select: { events: true } } },
      orderBy: { displayName: "asc" },
    }),
    db.userTitle.findMany({ where: { userId: session.user.id }, include: { title: true }, orderBy: [{ equipped: "desc" }, { awardedAt: "desc" }] }),
    db.userAchievementReward.findMany({
      where: { userId: session.user.id },
      include: { reward: { include: { achievement: { select: { name: true, rarity: true } } } } },
      orderBy: { unlockedAt: "desc" },
    }),
    db.userXpEntry.aggregate({ where: { userId: session.user.id }, _sum: { amount: true } }),
    db.clubGameProfile.findMany({ where: { userId: session.user.id }, orderBy: { connectedAt: "asc" } }),
    db.twitchChannel.findUnique({
      where: { userId: session.user.id },
      select: { id: true, login: true, displayName: true, showcaseEnabled: true, isLive: true, lastLiveAt: true, connectedAt: true },
    }),
  ]);

  const progression = progressionForXp(xpTotal._sum.amount ?? 0);
  const recordedEvents = identities.reduce((total, identity) => total + identity._count.events, 0);
  const equippedTitle = titles.find((title) => title.equipped)?.title ?? null;
  const borders = rewards.filter((entry) => entry.reward.kind === "AVATAR_BORDER");
  const layouts = rewards.filter((entry) => entry.reward.kind === "PROFILE_LAYOUT");
  const badges = rewards.filter((entry) => entry.reward.kind === "BADGE");
  const medals = rewards.filter((entry) => entry.reward.kind === "MEDAL");
  const trophies = rewards.filter((entry) => entry.reward.kind === "TROPHY");
  const cabinetItems: CabinetItem[] = [...badges, ...medals, ...trophies].map((entry) => ({
    id: entry.id,
    code: entry.reward.code,
    name: entry.reward.name,
    description: entry.reward.description,
    kind: entry.reward.kind as CabinetItem["kind"],
    rarity: entry.reward.achievement.rarity as AchievementRarity,
    achievementName: entry.reward.achievement.name,
    unlockedAt: entry.unlockedAt.toISOString(),
  }));
  const avatar = member.image ?? avatarPresets[0];
  const steamAccount = member.socialAccounts.find((account) => account.platform === "STEAM" && account.verifiedAt);
  const steamProfile = steamAccount?.steamProfile ?? null;
  const steamGames = steamProfile?.libraryGames ?? [];
  const steamMinutes = steamGames.reduce((total, game) => total + game.playtimeMinutes, 0);
  const steamAchievementScans = steamProfile?.achievementSyncs ?? [];
  const steamAchievementCoverage = steamAchievementScans.filter((scan) => scan.status === "READY" || scan.status === "UNSUPPORTED").length;
  const steamAchievementsEarned = steamAchievementScans.filter((scan) => scan.status === "READY").reduce((total, scan) => total + scan.achievedCount, 0);
  const recentlyPlayed = [...steamGames]
    .filter((game) => game.lastPlayedAt)
    .sort((left, right) => (right.lastPlayedAt?.getTime() ?? 0) - (left.lastPlayedAt?.getTime() ?? 0))
    .slice(0, 5);
  const ownerName = member.displayName ?? member.name ?? "Habitat member";
  const twitchChannelLink = twitchChannel ? twitchChannelUrl(twitchChannel.login) : null;
  const connectedNetworkCount = new Set([
    ...member.socialAccounts.map((account) => account.platform),
    ...(twitchChannel ? ["TWITCH"] : []),
  ]).size;

  return <section className={`page-shell profile-page profile-command-center layout-${member.profileLayout ?? "field-notes"}`}>
    <header className="profile-legend-hero" id="profile-top">
      <div className="profile-hero-scene" aria-hidden="true" />
      <div className="profile-hero-content">
        <div className={`member-avatar profile-hero-avatar ${avatarBorderClass(member.avatarBorder)}`}><img src={avatar} alt="Your avatar" /></div>
        <div className="profile-hero-identity">
          <p className="eyebrow"><ShieldCheck aria-hidden="true" size={13} /> Private member command center</p>
          <h1>{ownerName}</h1>
          {equippedTitle ? <span className={`habitat-title ${titlePlateClass(equippedTitle.slug)}`}><span>{equippedTitle.name}</span></span> : <span className="profile-untitled">Legend in progress</span>}
          <p>{member.bio || "Your worlds, victories, connections, and clubhouse identity—assembled in one place."}</p>
        </div>
        <div className="profile-hero-actions">
          {member.username ? <Link className="profile-hero-primary" href={`/members/${member.username}`}>View public profile <ExternalLink aria-hidden="true" size={14} /></Link> : <a className="profile-hero-primary" href="#identity">Create your public profile <ChevronRight aria-hidden="true" size={14} /></a>}
          <a className="profile-hero-secondary" href="#identity">Edit identity <ChevronRight aria-hidden="true" size={14} /></a>
        </div>
      </div>
      <div className="profile-hero-lower">
        <dl className="profile-hero-metrics">
          <div><dt>Habitat level</dt><dd>{progression.level}</dd></div>
          <div><dt>Total XP</dt><dd>{progression.totalXp.toLocaleString()}</dd></div>
          <div><dt>Verified worlds</dt><dd>{identities.length}</dd></div>
          <div><dt>Collection</dt><dd>{rewards.length}</dd></div>
        </dl>
        <div className="profile-level-rail">
          <div><span>Level {progression.level}</span><span>{progression.level === 100 ? "Maximum level reached" : `${progression.nextLevelXp.toLocaleString()} XP to Level ${progression.level + 1}`}</span></div>
          <i aria-hidden="true"><span style={{ width: `${progression.progressPercent}%` }} /></i>
          <small>{progression.currentLevelXp.toLocaleString()} XP this level · {recordedEvents.toLocaleString()} verified Chronicle events</small>
        </div>
      </div>
    </header>

    <nav className="profile-section-nav" aria-label="Profile sections">
      <a href="#identity"><UserRound aria-hidden="true" size={15} /><span>Identity</span></a>
      <a href="#presence"><Map aria-hidden="true" size={15} /><span>Worlds</span><b>{identities.length + clubProfiles.length}</b></a>
      <a href="#connections"><Link2 aria-hidden="true" size={15} /><span>Connections</span><b>{connectedNetworkCount}</b></a>
      <a href="#collection"><Vault aria-hidden="true" size={15} /><span>Collection</span><b>{rewards.length}</b></a>
    </nav>

    <div className="profile-dashboard-intro">
      <div><p className="eyebrow">Member dossier</p><h2>Everything that makes you a Habitat legend.</h2><p>Start with how the lodge sees you, then manage the worlds, networks, and hard-earned artifacts attached to your account.</p></div>
      <div className="profile-signal-board" aria-label="Profile status">
        <span className={identities.length ? "ready" : "pending"}><ShieldCheck aria-hidden="true" size={14} /> {identities.length ? `${identities.length} verified ${identities.length === 1 ? "world" : "worlds"}` : "No worlds verified"}</span>
        <span className={steamAccount ? "ready" : "pending"}><Gamepad2 aria-hidden="true" size={14} /> Steam {steamAccount ? "verified" : "not linked"}</span>
        <span className={twitchChannel?.showcaseEnabled ? "live" : twitchChannel ? "ready" : "pending"}><Radio aria-hidden="true" size={14} /> {twitchChannel ? (twitchChannel.showcaseEnabled ? "Twitch showcased" : "Twitch private") : "Twitch not linked"}</span>
      </div>
    </div>

    <section className="profile-chapter" id="identity">
      <div className="profile-chapter-heading"><div><span>01</span><p className="eyebrow">Identity</p><h2>Shape your presence</h2><p>Your callsign, portrait, and story are the first things other members see.</p></div>{member.username ? <Link className="profile-text-link" href={`/members/${member.username}`}>Preview public profile <ExternalLink aria-hidden="true" size={14} /></Link> : null}</div>
      <div className="profile-customizer profile-identity-workbench">
        <form action={updateProfile} className="server-editor profile-form">
          <label>Callsign<input name="username" defaultValue={member.username ?? ""} placeholder="your-callsign" required /></label>
          <label>Display name<input name="displayName" defaultValue={ownerName} placeholder="How the lodge knows you" required /></label>
          <label className="field-wide">Bio<textarea name="bio" defaultValue={member.bio ?? ""} placeholder="Tell the lodge a little about your preferred brand of chaos." rows={4} /></label>
          <button className="save-server" type="submit">Save profile</button>
        </form>
        <div className="avatar-station">
          <div className="profile-station-heading"><div className={`member-avatar profile-station-avatar ${avatarBorderClass(member.avatarBorder)}`}><img src={avatar} alt="Current avatar" /></div><div><p className="eyebrow">Portrait workshop</p><h3>Choose your mark</h3><span>Your equipped achievement frame is shown live.</span></div></div>
          <div className="avatar-preset-row">{avatarPresets.map((preset) => <form action={selectAvatarPreset} key={preset}><input name="image" type="hidden" value={preset} /><button aria-label={`Use ${preset.split("/").pop()?.replace(".svg", "")} avatar`} className={avatar === preset ? "avatar-preset selected" : "avatar-preset"} title="Use this avatar" type="submit"><img src={preset} alt="" /></button></form>)}</div>
          <form action="/api/profile/avatar" className="avatar-upload" encType="multipart/form-data" method="post"><label><ImagePlus aria-hidden="true" size={16} /> Upload custom avatar<input accept="image/jpeg,image/png,image/webp,image/gif" name="avatar" required type="file" /></label><button type="submit">Upload</button></form>
          <small>PNG, JPG, WebP, or GIF up to 2 MB. Uploaded images stay in private Habitat storage.</small>
        </div>
      </div>
    </section>

    <section className="profile-chapter" id="presence">
      <div className="profile-chapter-heading"><div><span>02</span><p className="eyebrow">Your presence</p><h2>Worlds &amp; club rooms</h2><p>Jump straight to the characters, worlds, and competitive rooms tied to you.</p></div><Link className="profile-text-link" href="/profile/identities">Manage identity claims <ChevronRight aria-hidden="true" size={14} /></Link></div>
      <div className="profile-presence-grid">
        <article className="profile-surface profile-surface-worlds">
          <header><div><p className="eyebrow">Verified game identities</p><h3>Your worlds</h3></div><strong>{identities.length}</strong></header>
          {identities.length === 0 ? <div className="profile-empty"><Map aria-hidden="true" size={24} /><p>No verified identities yet.</p><span>Submit a claim once your game identity has been observed by a supported adapter.</span><Link href="/profile/identities">Claim an identity <ChevronRight aria-hidden="true" size={13} /></Link></div> : <div className="profile-world-list">{identities.map((identity) => <Link href={`/chronicle/identity/${identity.id}`} key={identity.id}><div><span>{identity.server?.displayName ?? identity.gameType.replaceAll("_", " ")}</span><strong>{identity.displayName}</strong><small>{identity.server?.worldName ?? "Habitat identity"} · {identity._count.events} recorded events</small></div><ChevronRight aria-hidden="true" size={17} /></Link>)}</div>}
        </article>
        <article className="profile-surface profile-surface-clubs">
          <header><div><p className="eyebrow">Competitive rooms</p><h3>Club profiles</h3></div><strong>{clubProfiles.length}</strong></header>
          {clubProfiles.length ? <div className="club-profile-list">{clubProfiles.map((profile) => <Link href="/club-games/marvel-rivals" key={profile.id}><Gamepad2 aria-hidden="true" size={18} /><div><strong>Marvel Rivals · {profile.displayName}</strong><span>Member-linked · {profile.rankName ?? "Unranked"}{profile.lastSyncedAt ? ` · Updated ${profile.lastSyncedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}</span></div><ExternalLink aria-hidden="true" size={14} /></Link>)}</div> : <div className="profile-empty"><Gamepad2 aria-hidden="true" size={24} /><p>No club profiles linked.</p><span>Join a Club Room to put your stats and callsign on its member board.</span><Link href="/club-games/marvel-rivals">Open Assembly Room <ChevronRight aria-hidden="true" size={13} /></Link></div>}
        </article>
      </div>
    </section>

    <section className="profile-chapter" id="connections">
      <div className="profile-chapter-heading"><div><span>03</span><p className="eyebrow">Connections</p><h2>Your network</h2><p>Provider verification, public links, privacy, and showcase controls—clearly separated.</p></div><Link className="profile-text-link" href="/privacy">Provider data &amp; privacy <ExternalLink aria-hidden="true" size={14} /></Link></div>

      {/* Verification routes are intentionally plain anchors: they redirect to external providers and must never be prefetched. */}
      {linkedIdentityCount !== null ? <div className="steam-link-notice success"><strong>Steam verification complete.</strong><span>{linkedIdentityCount > 0 ? `${linkedIdentityCount} exact server ${linkedIdentityCount === 1 ? "identity was" : "identities were"} attached to your account.` : <>No server identity carrying this exact Steam ID has been observed yet. Name-only legacy characters are never guessed; <Link href="/profile/identities">submit a character claim</Link> for administrator review.</>}</span></div> : null}
      {steamStatus === "invalid" || steamStatus === "expired" || steamStatus === "conflict" ? <div className="steam-link-notice error"><strong>Steam verification was not completed.</strong><span>{steamStatus === "conflict" ? "That Steam account is already linked to another Habitat member." : steamStatus === "expired" ? "The Steam verification request expired. Start the connection again." : "Steam returned a response that could not be verified. Start the connection again."}</span></div> : null}
      {twitchNotice ? <div className={`steam-link-notice ${twitchNotice.tone}`}><strong>{twitchNotice.heading}</strong><span>{twitchNotice.detail}</span></div> : null}

      <div className="profile-connection-stack">
        <article className="profile-connection-card steam-card">
          <header><div className="profile-connection-icon"><Gamepad2 aria-hidden="true" size={20} /></div><div><p className="eyebrow">Verified provider</p><h3>Steam</h3><span>Ownership and optional library enrichment</span></div><em className={steamAccount ? "connected" : "disconnected"}>{steamAccount ? "Verified" : "Not connected"}</em></header>
          <div className="profile-connection-body"><div><p>Verified Steam ownership can automatically attach exact matching game identities. Verification alone collects no library data.</p><div className="steam-connect">{steamAccount ? <><span><BadgeCheck aria-hidden="true" size={15} /> Steam verified</span><form action={disconnectSteam}><button type="submit">Disconnect Steam</button></form></> : <a className="provider-connect" href="/api/steam/connect">Verify with Steam</a>}</div></div>{steamAccount ? <div className="profile-connection-fact"><BadgeCheck aria-hidden="true" size={18} /><strong>Ownership proven</strong><span>Exact Steam IDs may attach automatically. Name-only identities are never guessed.</span></div> : <div className="profile-connection-fact"><ShieldCheck aria-hidden="true" size={18} /><strong>Private by default</strong><span>Library enrichment is a separate opt-in after verification.</span></div>}</div>

          {steamAccount ? <section className="steam-enrichment-panel">
            <div className="steam-enrichment-heading"><div><p className="eyebrow">Optional enrichment</p><h2>{steamProfile?.personaName ?? "Steam gaming history"}</h2></div>{steamProfile?.avatarMediumUrl ? <img alt="" src={steamProfile.avatarMediumUrl} /> : null}</div>
            {!steamProfile ? <div className="steam-consent"><p>Steam verification is active, but The Habitat is not collecting your Steam profile or library. Enrichment never affects Habitat XP.</p><form action={enableSteamEnrichment}><label><input name="consent" required type="checkbox" /> I request Steam profile and library enrichment and understand that The Habitat will cache the public Steam data described in its <Link href="/privacy">privacy notice</Link>.</label><button className="save-server" type="submit">Enable Steam enrichment</button></form></div> : <>
              <dl className="steam-summary-grid"><div><dt>Visible games</dt><dd>{steamProfile.libraryStatus === "READY" ? steamGames.length.toLocaleString() : "—"}</dd></div><div><dt>Steam-reported hours</dt><dd>{steamProfile.libraryStatus === "READY" ? Math.floor(steamMinutes / 60).toLocaleString() : "—"}</dd></div><div><dt>Achievements synced</dt><dd>{steamAchievementScans.length ? steamAchievementsEarned.toLocaleString() : "—"}</dd></div><div><dt>Profile sync</dt><dd>{steamProfile.profileStatus.toLowerCase()}</dd></div><div><dt>Library sync</dt><dd>{steamProfile.libraryStatus === "PRIVATE" ? "private / unavailable" : steamProfile.libraryStatus.toLowerCase()}</dd></div></dl>
              <p className="steam-sync-note">Last successful profile sync: {steamProfile.profileLastSuccessfulAt?.toLocaleString() ?? "not yet synced"}. Last successful library sync: {steamProfile.libraryLastSuccessfulAt?.toLocaleString() ?? "not yet synced"}. Achievement coverage: {steamAchievementCoverage} of {steamAchievementScans.length} queued visible games completed or confirmed unsupported. Cached data survives provider errors but is deleted when enrichment is disabled.</p>
              {steamProfile.currentGameName ? <p className="steam-current-game"><span /> Steam currently reports <strong>{steamProfile.currentGameName}</strong>.</p> : null}
              {steamProfile.libraryStatus === "READY" && steamGames.length ? <div className="steam-game-lists"><div><p className="eyebrow">Most played</p><ul>{steamGames.slice(0, 5).map((game) => <li key={game.id}><strong>{game.app.name}</strong><span>{Math.round(game.playtimeMinutes / 60).toLocaleString()}h</span></li>)}</ul></div><div><p className="eyebrow">Recently played</p>{recentlyPlayed.length ? <ul>{recentlyPlayed.map((game) => <li key={game.id}><strong>{game.app.name}</strong><span>{game.lastPlayedAt?.toLocaleDateString()}</span></li>)}</ul> : <p>No last-played timestamps were exposed.</p>}</div></div> : <div className="chronicle-empty"><p>No visible Steam library has been synced.</p><span>{steamProfile.librarySyncError ?? "The worker will attempt the first private sync when the integration is configured."}</span></div>}
              <div className="steam-enrichment-controls"><form action={updateSteamEnrichmentVisibility}><label><input defaultChecked={steamProfile.displayPublic} name="displayPublic" type="checkbox" /> Show this Steam gaming-history section on my public Habitat card.</label><button type="submit">Save visibility</button></form><form action={disableSteamEnrichment}><button type="submit">Stop enrichment and delete cached Steam data</button></form></div>
            </>}
          </section> : null}
        </article>

        <article className="profile-connection-card twitch-card">
          <header><div className="profile-connection-icon"><Radio aria-hidden="true" size={20} /></div><div><p className="eyebrow">Broadcast identity</p><h3>{twitchChannel?.displayName ?? "Twitch"}</h3><span>Channel ownership and public showcase</span></div><em className={twitchChannel ? (twitchChannel.showcaseEnabled ? "live" : "connected") : "disconnected"}>{twitchChannel ? (twitchChannel.showcaseEnabled ? "Showcased" : "Verified · private") : "Not connected"}</em></header>
          <div className="account-kit"><div><p>Verifying proves channel ownership. Public showcase placement is a separate opt-in you can switch off whenever you like.</p><div className="steam-connect">{twitchChannel ? <><span><BadgeCheck aria-hidden="true" size={15} /> Twitch verified · {twitchChannel.login}</span>{twitchChannelLink ? <a href={twitchChannelLink} rel="noreferrer" target="_blank">Open channel <ExternalLink aria-hidden="true" size={14} /></a> : null}<form action={disconnectTwitchChannel}><button type="submit">Disconnect Twitch</button></form></> : <a className="provider-connect" href="/api/twitch/connect">Verify with Twitch</a>}</div>{twitchChannel ? <form action={updateTwitchShowcaseVisibility} className="profile-visibility-form"><label><input defaultChecked={twitchChannel.showcaseEnabled} name="showcaseEnabled" type="checkbox" /> Feature this channel in the public streaming showcase, including while I am live.</label><button className="save-server" type="submit">Save showcase choice</button></form> : <small>Verification opens a Twitch authorization prompt, records only your channel identity, and never posts on your behalf.</small>}</div><div className="social-list">{twitchChannel ? <><article><div><strong>Showcase</strong><span>{twitchChannel.showcaseEnabled ? "Opted in · listed publicly" : "Opt-in off · verified but hidden"}</span></div></article><article><div><strong>Live state</strong><span>{twitchChannel.isLive ? "Twitch reports this channel live" : twitchChannel.lastLiveAt ? `Last live ${twitchChannel.lastLiveAt.toLocaleDateString()}` : "No broadcast observed yet"}</span></div></article><article><div><strong>Verified</strong><span>{twitchChannel.connectedAt.toLocaleDateString()}</span></div></article></> : <span>No Twitch channel verified yet.</span>}</div></div>
          <Link className="profile-card-footer-link" href="/streams">Open the streaming showcase <ExternalLink aria-hidden="true" size={14} /></Link>
        </article>

        <article className="profile-connection-card social-card">
          <header><div className="profile-connection-icon"><Link2 aria-hidden="true" size={20} /></div><div><p className="eyebrow">Public profile links</p><h3>Social &amp; gaming accounts</h3><span>Optional, unverified links shown on your member card</span></div><em className="neutral">{member.socialAccounts.length} linked</em></header>
          <div className="account-kit"><div><SocialAccountForm /></div><div className="social-list">{member.socialAccounts.length === 0 ? <span>No optional accounts added yet.</span> : member.socialAccounts.map((account) => <article key={account.id}><div><strong>{socialPlatformLabels[account.platform]} {account.verifiedAt ? <BadgeCheck aria-label="Verified" size={12} /> : null}</strong><span>{account.handle}</span></div>{account.profileUrl ? <a href={account.profileUrl} rel="noreferrer" target="_blank" aria-label={`Open ${account.platform} profile`}><ExternalLink size={15} /></a> : null}{account.verifiedAt ? null : <form action={removeSocialAccount}><input name="accountId" type="hidden" value={account.id} /><button type="submit">Remove</button></form>}</article>)}</div></div>
        </article>
      </div>
    </section>

    <section className="profile-chapter profile-collection-chapter" id="collection">
      <div className="profile-chapter-heading"><div><span>04</span><p className="eyebrow">Collection</p><h2>The proof of the journey</h2><p>Inspect your cabinet, wear a title, and equip the cosmetics earned from verified activity.</p></div><Link className="profile-text-link" href="/achievements">Explore achievements <ChevronRight aria-hidden="true" size={14} /></Link></div>
      <TrophyCabinet items={cabinetItems} ownerName={ownerName} />

      <div className="profile-subsection-heading"><div><Activity aria-hidden="true" size={18} /><div><p className="eyebrow">Habitat titles</p><h3>Wear your legend</h3></div></div><span>{titles.length} earned</span></div>
      {titles.length === 0 ? <div className="profile-empty profile-empty-wide"><Sparkles aria-hidden="true" size={24} /><p>No titles have been awarded.</p><span>Titles arrive from verified achievements or an administrator grant.</span></div> : <div className="title-grid">{titles.map((userTitle) => <article className={userTitle.equipped ? "title-card equipped" : "title-card"} key={userTitle.id}><p className="eyebrow">{userTitle.source.toLowerCase()} award</p><span className={`habitat-title title-card-art ${titlePlateClass(userTitle.title.slug)}`}><span>{userTitle.title.name}</span></span><p>{userTitle.title.description ?? "A Habitat title."}</p><form action={equipTitle}><input name="userTitleId" type="hidden" value={userTitle.id} /><button className={userTitle.equipped ? "icon-action approve" : "icon-action"} disabled={userTitle.equipped} title={userTitle.equipped ? "Equipped title" : "Equip title"} aria-label={userTitle.equipped ? "Equipped title" : `Equip ${userTitle.title.name}`}><Check aria-hidden="true" size={17} /></button></form></article>)}</div>}

      <div className="profile-subsection-heading"><div><Sparkles aria-hidden="true" size={18} /><div><p className="eyebrow">Achievement armory</p><h3>Wear the receipts</h3></div></div><span>{rewards.length} unlocked</span></div>
      {rewards.length === 0 ? <div className="profile-empty profile-empty-wide"><Vault aria-hidden="true" size={24} /><p>The armory is waiting.</p><span>Achievement cosmetics unlock only from verified Chronicle activity.</span></div> : <div className="reward-grid">
        {borders.map((entry) => <article className="reward-card avatar-border-reward" key={entry.id}><div className={`avatar-frame-preview ${avatarBorderClass(entry.reward.code)}`}><img alt="" src={avatar} /></div><Palette aria-hidden="true" size={18} /><p className="eyebrow">Avatar border</p><h2>{entry.reward.name}</h2><p>{entry.reward.description}</p><form action={equipCosmetic}><input name="kind" type="hidden" value="AVATAR_BORDER" /><input name="code" type="hidden" value={entry.reward.code} /><button className="save-server" disabled={member.avatarBorder === entry.reward.code} type="submit">{member.avatarBorder === entry.reward.code ? "Equipped" : "Equip"}</button></form></article>)}
        {layouts.map((entry) => <article className="reward-card" key={entry.id}><Sparkles aria-hidden="true" size={18} /><p className="eyebrow">Profile layout</p><h2>{entry.reward.name}</h2><p>{entry.reward.description}</p><form action={equipCosmetic}><input name="kind" type="hidden" value="PROFILE_LAYOUT" /><input name="code" type="hidden" value={entry.reward.code} /><button className="save-server" disabled={member.profileLayout === entry.reward.code} type="submit">{member.profileLayout === entry.reward.code ? "Equipped" : "Equip"}</button></form></article>)}
        {badges.map((entry) => <article className="reward-card badge" key={entry.id}><Medal aria-hidden="true" size={18} /><p className="eyebrow">Badge · {entry.reward.achievement.rarity.replaceAll("_", " ")}</p><h2>{entry.reward.name}</h2><p>{entry.reward.description}</p><span><BadgeCheck aria-hidden="true" size={14} /> Unlocked by {entry.reward.achievement.name}</span></article>)}
        {medals.map((entry) => <article className="reward-card medal" key={entry.id}><Medal aria-hidden="true" size={18} /><p className="eyebrow">Medal · {entry.reward.achievement.rarity.replaceAll("_", " ")}</p><h2>{entry.reward.name}</h2><p>{entry.reward.description}</p><span><BadgeCheck aria-hidden="true" size={14} /> Displayed in your cabinet</span></article>)}
        {trophies.map((entry) => <article className="reward-card trophy" key={entry.id}><Trophy aria-hidden="true" size={18} /><p className="eyebrow">Trophy · {entry.reward.achievement.rarity.replaceAll("_", " ")}</p><h2>{entry.reward.name}</h2><p>{entry.reward.description}</p><span><BadgeCheck aria-hidden="true" size={14} /> Cabinet centerpiece</span></article>)}
      </div>}
    </section>
  </section>;
}
