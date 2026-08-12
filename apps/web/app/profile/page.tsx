/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, Check, ExternalLink, Gamepad2, ImagePlus, Medal, Palette, Sparkles, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { getPrismaClient } from "@habitat/db/client";
import { progressionForXp, type AchievementRarity } from "@habitat/shared";
import { TrophyCabinet, type CabinetItem } from "@/components/trophy-cabinet";
import { SocialAccountForm } from "@/components/social-account-form";
import { socialPlatformLabels } from "@/lib/social-platforms";
import { avatarBorderClass, titlePlateClass } from "@/lib/reward-presentation";
import { disableSteamEnrichment, disconnectSteam, enableSteamEnrichment, equipCosmetic, equipTitle, removeSocialAccount, selectAvatarPreset, updateProfile, updateSteamEnrichmentVisibility } from "./actions";

const db = getPrismaClient();
const avatarPresets = ["/images/avatars/campfire.svg", "/images/avatars/raven.svg", "/images/avatars/mountain.svg", "/images/avatars/ufo.svg"];

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) redirect("/sign-in");
  const [member, identities, titles, rewards, xpTotal, clubProfiles] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { name: true, username: true, displayName: true, image: true, bio: true, avatarBorder: true, profileLayout: true, socialAccounts: { include: { steamProfile: { include: { libraryGames: { where: { isCurrent: true }, include: { app: { select: { appId: true, name: true, iconHash: true } } }, orderBy: { playtimeMinutes: "desc" } }, achievementSyncs: { select: { status: true, definitionCount: true, achievedCount: true, lastSuccessfulAt: true } } } } }, orderBy: { platform: "asc" } } } }),
    db.playerIdentity.findMany({ where: { userId: session.user.id }, include: { server: { select: { displayName: true, worldName: true } }, _count: { select: { events: true } } }, orderBy: { displayName: "asc" } }),
    db.userTitle.findMany({ where: { userId: session.user.id }, include: { title: true }, orderBy: [{ equipped: "desc" }, { awardedAt: "desc" }] }),
    db.userAchievementReward.findMany({ where: { userId: session.user.id }, include: { reward: { include: { achievement: { select: { name: true, rarity: true } } } } }, orderBy: { unlockedAt: "desc" } }),
    db.userXpEntry.aggregate({ where: { userId: session.user.id }, _sum: { amount: true } }),
    db.clubGameProfile.findMany({ where: { userId: session.user.id }, orderBy: { connectedAt: "asc" } }),
  ]);
  const progression = progressionForXp(xpTotal._sum.amount ?? 0);
  const recordedEvents = identities.reduce((total, identity) => total + identity._count.events, 0);
  const equippedTitle = titles.find((title) => title.equipped)?.title ?? null;
  const borders = rewards.filter((entry) => entry.reward.kind === "AVATAR_BORDER");
  const layouts = rewards.filter((entry) => entry.reward.kind === "PROFILE_LAYOUT");
  const badges = rewards.filter((entry) => entry.reward.kind === "BADGE");
  const medals = rewards.filter((entry) => entry.reward.kind === "MEDAL");
  const trophies = rewards.filter((entry) => entry.reward.kind === "TROPHY");
  const cabinetItems: CabinetItem[] = [...badges, ...medals, ...trophies].map((entry) => ({ id: entry.id, code: entry.reward.code, name: entry.reward.name, description: entry.reward.description, kind: entry.reward.kind as CabinetItem["kind"], rarity: entry.reward.achievement.rarity as AchievementRarity, achievementName: entry.reward.achievement.name, unlockedAt: entry.unlockedAt.toISOString() }));
  const avatar = member.image ?? avatarPresets[0];
  const steamAccount = member.socialAccounts.find((account) => account.platform === "STEAM" && account.verifiedAt);
  const steamProfile = steamAccount?.steamProfile ?? null;
  const steamGames = steamProfile?.libraryGames ?? [];
  const steamMinutes = steamGames.reduce((total, game) => total + game.playtimeMinutes, 0);
  const steamAchievementScans = steamProfile?.achievementSyncs ?? [];
  const steamAchievementCoverage = steamAchievementScans.filter((scan) => scan.status === "READY" || scan.status === "UNSUPPORTED").length;
  const steamAchievementsEarned = steamAchievementScans.filter((scan) => scan.status === "READY").reduce((total, scan) => total + scan.achievedCount, 0);
  const recentlyPlayed = [...steamGames].filter((game) => game.lastPlayedAt).sort((left, right) => (right.lastPlayedAt?.getTime() ?? 0) - (left.lastPlayedAt?.getTime() ?? 0)).slice(0, 5);
  const ownerName = member.displayName ?? member.name ?? "Habitat member";

  return <section className="page-shell profile-page">
    <div className="profile-command-deck">
      <div className={`member-avatar ${avatarBorderClass(member.avatarBorder)}`}><img src={avatar} alt="Your avatar" /></div>
      <div><p className="eyebrow">Habitat profile</p><h1>{ownerName}</h1>{equippedTitle ? <span className={`habitat-title ${titlePlateClass(equippedTitle.slug)}`}><span>{equippedTitle.name}</span></span> : null}<p>Your world record, appearance, and optional links live here.</p></div>
      {member.username ? <Link className="primary-link" href={`/members/${member.username}`}>View public card <ExternalLink aria-hidden="true" size={15} /></Link> : null}
    </div>
    <dl className="profile-metrics"><div><dt>Habitat level</dt><dd>{progression.level}</dd></div><div><dt>Total XP</dt><dd>{progression.totalXp.toLocaleString()}</dd></div><div><dt>Loot unlocked</dt><dd>{rewards.length}</dd></div></dl>
    <div className="level-track compact"><i style={{ width: `${progression.progressPercent}%` }} /><div><span>{progression.currentLevelXp.toLocaleString()} XP this level</span><span>{progression.level === 100 ? "Maximum level" : `${progression.nextLevelXp.toLocaleString()} XP to Level ${progression.level + 1}`}</span><strong>{identities.length} verified worlds · {recordedEvents} recorded events</strong></div></div>

    <TrophyCabinet items={cabinetItems} ownerName={ownerName} />

    <div className="profile-heading"><div><p className="eyebrow">Identity kit</p><h2>Make it yours</h2></div></div>
    <div className="profile-customizer">
      <form action={updateProfile} className="server-editor profile-form"><label>Callsign<input name="username" defaultValue={member.username ?? ""} placeholder="your-callsign" required /></label><label>Display name<input name="displayName" defaultValue={ownerName} placeholder="How the lodge knows you" required /></label><label className="field-wide">Bio<textarea name="bio" defaultValue={member.bio ?? ""} placeholder="Tell the lodge a little about your preferred brand of chaos." rows={4} /></label><button className="save-server" type="submit">Save profile</button></form>
      <div className="avatar-station"><p className="eyebrow">Avatar station</p><div className="avatar-preset-row">{avatarPresets.map((preset) => <form action={selectAvatarPreset} key={preset}><input name="image" type="hidden" value={preset} /><button className={avatar === preset ? "avatar-preset selected" : "avatar-preset"} title="Use this avatar" type="submit"><img src={preset} alt="" /></button></form>)}</div><form action="/api/profile/avatar" className="avatar-upload" encType="multipart/form-data" method="post"><label><ImagePlus aria-hidden="true" size={16} /> Upload custom avatar<input accept="image/jpeg,image/png,image/webp,image/gif" name="avatar" required type="file" /></label><button type="submit">Upload</button></form><small>PNG, JPG, WebP, or GIF up to 2 MB. Uploaded images stay in private Habitat storage.</small></div>
    </div>

    <div className="profile-heading"><div><p className="eyebrow">Connected accounts</p><h2>Your gaming identity</h2></div></div>
    <div className="account-kit"><div><p>Verified Steam ownership can automatically attach matching game identities. Other services remain optional profile links and never imply live presence.</p><div className="steam-connect">{steamAccount ? <><span><BadgeCheck aria-hidden="true" size={15} /> Steam verified</span><form action={disconnectSteam}><button type="submit">Disconnect Steam</button></form></> : <Link href="/api/steam/connect">Verify with Steam</Link>}</div><SocialAccountForm /></div><div className="social-list">{member.socialAccounts.length === 0 ? <span>No optional accounts added yet.</span> : member.socialAccounts.map((account) => <article key={account.id}><div><strong>{socialPlatformLabels[account.platform]} {account.verifiedAt ? <BadgeCheck aria-label="Verified" size={12} /> : null}</strong><span>{account.handle}</span></div>{account.profileUrl ? <a href={account.profileUrl} rel="noreferrer" target="_blank" aria-label={`Open ${account.platform} profile`}><ExternalLink size={15} /></a> : null}{account.verifiedAt ? null : <form action={removeSocialAccount}><input name="accountId" type="hidden" value={account.id} /><button type="submit">Remove</button></form>}</article>)}</div></div>

    {steamAccount ? <section className="steam-enrichment-panel">
      <div className="steam-enrichment-heading"><div><p className="eyebrow">Steam enrichment</p><h2>{steamProfile?.personaName ?? "Your Steam gaming history"}</h2></div>{steamProfile?.avatarMediumUrl ? <img alt="" src={steamProfile.avatarMediumUrl} /> : null}</div>
      {!steamProfile ? <div className="steam-consent"><p>Steam verification is active, but The Habitat is not collecting your Steam profile or library. Enrichment is optional and never affects Habitat XP.</p><form action={enableSteamEnrichment}><label><input name="consent" required type="checkbox" /> I request Steam profile and library enrichment and understand that The Habitat will cache the public Steam data described in its <Link href="/privacy">privacy notice</Link>.</label><button className="save-server" type="submit">Enable Steam enrichment</button></form></div> : <>
        <dl className="steam-summary-grid">
          <div><dt>Visible games</dt><dd>{steamProfile.libraryStatus === "READY" ? steamGames.length.toLocaleString() : "—"}</dd></div>
          <div><dt>Steam-reported hours</dt><dd>{steamProfile.libraryStatus === "READY" ? Math.floor(steamMinutes / 60).toLocaleString() : "—"}</dd></div>
          <div><dt>Achievements synced</dt><dd>{steamAchievementScans.length ? steamAchievementsEarned.toLocaleString() : "—"}</dd></div>
          <div><dt>Profile sync</dt><dd>{steamProfile.profileStatus.toLowerCase()}</dd></div>
          <div><dt>Library sync</dt><dd>{steamProfile.libraryStatus === "PRIVATE" ? "private / unavailable" : steamProfile.libraryStatus.toLowerCase()}</dd></div>
        </dl>
        <p className="steam-sync-note">Last successful profile sync: {steamProfile.profileLastSuccessfulAt?.toLocaleString() ?? "not yet synced"}. Last successful library sync: {steamProfile.libraryLastSuccessfulAt?.toLocaleString() ?? "not yet synced"}. Achievement coverage: {steamAchievementCoverage} of {steamAchievementScans.length} queued visible games completed or confirmed unsupported. Cached data survives provider errors but is deleted when enrichment is disabled.</p>
        {steamProfile.currentGameName ? <p className="steam-current-game"><span /> Steam currently reports <strong>{steamProfile.currentGameName}</strong>.</p> : null}
        {steamProfile.libraryStatus === "READY" && steamGames.length ? <div className="steam-game-lists"><div><p className="eyebrow">Most played</p><ul>{steamGames.slice(0, 5).map((game) => <li key={game.id}><strong>{game.app.name}</strong><span>{Math.round(game.playtimeMinutes / 60).toLocaleString()}h</span></li>)}</ul></div><div><p className="eyebrow">Recently played</p>{recentlyPlayed.length ? <ul>{recentlyPlayed.map((game) => <li key={game.id}><strong>{game.app.name}</strong><span>{game.lastPlayedAt?.toLocaleDateString()}</span></li>)}</ul> : <p>No last-played timestamps were exposed.</p>}</div></div> : <div className="chronicle-empty"><p>No visible Steam library has been synced.</p><span>{steamProfile.librarySyncError ?? "The worker will attempt the first private sync when the integration is configured."}</span></div>}
        <div className="steam-enrichment-controls"><form action={updateSteamEnrichmentVisibility}><label><input defaultChecked={steamProfile.displayPublic} name="displayPublic" type="checkbox" /> Show this Steam gaming-history section on my public Habitat card.</label><button type="submit">Save visibility</button></form><form action={disableSteamEnrichment}><button type="submit">Stop enrichment and delete cached Steam data</button></form></div>
      </>}
    </section> : null}

    <div className="profile-heading"><div><p className="eyebrow">Club profiles</p><h2>Rooms you have joined</h2></div><Link className="primary-link" href="/club-games/marvel-rivals">Open Assembly Room</Link></div>
    {clubProfiles.length ? <div className="club-profile-list">{clubProfiles.map((profile) => <Link href="/club-games/marvel-rivals" key={profile.id}><Gamepad2 aria-hidden="true" size={18} /><div><strong>Marvel Rivals · {profile.displayName}</strong><span>Member-linked · {profile.rankName ?? "Unranked"}{profile.lastSyncedAt ? ` · Updated ${profile.lastSyncedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}</span></div><ExternalLink aria-hidden="true" size={14} /></Link>)}</div> : <div className="chronicle-empty"><p>No club profiles linked.</p><span>Join a Club Room to put your stats and callsign on its member board.</span></div>}

    <div className="profile-heading"><div><p className="eyebrow">Claimed identities</p><h2>Your worlds</h2></div><Link className="primary-link" href="/profile/identities">Claim an identity</Link></div>
    {identities.length === 0 ? <div className="chronicle-empty"><p>No verified identities yet.</p><span>Submit a claim once your game identity has been observed by a supported adapter.</span></div> : <div className="identity-grid">{identities.map((identity) => <Link className="identity-card identity-card-link" href={`/chronicle/identity/${identity.id}`} key={identity.id}><p className="eyebrow">{identity.server?.displayName ?? identity.gameType.replaceAll("_", " ")}</p><h2>{identity.displayName}</h2><p>{identity.server?.worldName ?? "Habitat identity"}</p><span>{identity._count.events} recorded events · Open Chronicle</span></Link>)}</div>}

    <div className="profile-heading"><div><p className="eyebrow">Habitat titles</p><h2>Wear one</h2></div></div>
    {titles.length === 0 ? <div className="chronicle-empty"><p>No titles have been awarded.</p><span>Titles arrive from verified achievements or an administrator grant.</span></div> : <div className="title-grid">{titles.map((userTitle) => <article className={userTitle.equipped ? "title-card equipped" : "title-card"} key={userTitle.id}><p className="eyebrow">{userTitle.source.toLowerCase()} award</p><span className={`habitat-title title-card-art ${titlePlateClass(userTitle.title.slug)}`}><span>{userTitle.title.name}</span></span><p>{userTitle.title.description ?? "A Habitat title."}</p><form action={equipTitle}><input name="userTitleId" type="hidden" value={userTitle.id} /><button className={userTitle.equipped ? "icon-action approve" : "icon-action"} disabled={userTitle.equipped} title={userTitle.equipped ? "Equipped title" : "Equip title"} aria-label={userTitle.equipped ? "Equipped title" : `Equip ${userTitle.title.name}`}><Check aria-hidden="true" size={17} /></button></form></article>)}</div>}

    <div className="profile-heading"><div><p className="eyebrow">Achievement armory</p><h2>Wear the receipts</h2></div></div>
    {rewards.length === 0 ? <div className="chronicle-empty"><p>The armory is waiting.</p><span>Achievement cosmetics unlock only from verified Chronicle activity.</span></div> : <div className="reward-grid">
      {borders.map((entry) => <article className="reward-card avatar-border-reward" key={entry.id}><div className={`avatar-frame-preview ${avatarBorderClass(entry.reward.code)}`}><img alt="" src={avatar} /></div><Palette aria-hidden="true" size={18} /><p className="eyebrow">Avatar border</p><h2>{entry.reward.name}</h2><p>{entry.reward.description}</p><form action={equipCosmetic}><input name="kind" type="hidden" value="AVATAR_BORDER" /><input name="code" type="hidden" value={entry.reward.code} /><button className="save-server" disabled={member.avatarBorder === entry.reward.code} type="submit">{member.avatarBorder === entry.reward.code ? "Equipped" : "Equip"}</button></form></article>)}
      {layouts.map((entry) => <article className="reward-card" key={entry.id}><Sparkles aria-hidden="true" size={18} /><p className="eyebrow">Profile layout</p><h2>{entry.reward.name}</h2><p>{entry.reward.description}</p><form action={equipCosmetic}><input name="kind" type="hidden" value="PROFILE_LAYOUT" /><input name="code" type="hidden" value={entry.reward.code} /><button className="save-server" disabled={member.profileLayout === entry.reward.code} type="submit">{member.profileLayout === entry.reward.code ? "Equipped" : "Equip"}</button></form></article>)}
      {badges.map((entry) => <article className="reward-card badge" key={entry.id}><Medal aria-hidden="true" size={18} /><p className="eyebrow">Badge · {entry.reward.achievement.rarity.replaceAll("_", " ")}</p><h2>{entry.reward.name}</h2><p>{entry.reward.description}</p><span><BadgeCheck aria-hidden="true" size={14} /> Unlocked by {entry.reward.achievement.name}</span></article>)}
      {medals.map((entry) => <article className="reward-card medal" key={entry.id}><Medal aria-hidden="true" size={18} /><p className="eyebrow">Medal · {entry.reward.achievement.rarity.replaceAll("_", " ")}</p><h2>{entry.reward.name}</h2><p>{entry.reward.description}</p><span><BadgeCheck aria-hidden="true" size={14} /> Displayed in your cabinet</span></article>)}
      {trophies.map((entry) => <article className="reward-card trophy" key={entry.id}><Trophy aria-hidden="true" size={18} /><p className="eyebrow">Trophy · {entry.reward.achievement.rarity.replaceAll("_", " ")}</p><h2>{entry.reward.name}</h2><p>{entry.reward.description}</p><span><BadgeCheck aria-hidden="true" size={14} /> Cabinet centerpiece</span></article>)}
    </div>}
  </section>;
}
