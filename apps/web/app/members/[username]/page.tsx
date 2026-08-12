/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, BadgeCheck, ExternalLink, Gamepad2, MapPinned, Trophy } from "lucide-react";
import { getPrismaClient } from "@habitat/db/client";
import { progressionForXp, type AchievementRarity } from "@habitat/shared";
import { TrophyCabinet, type CabinetItem } from "@/components/trophy-cabinet";
import { socialPlatformLabels } from "@/lib/social-platforms";
import { avatarBorderClass, titlePlateClass } from "@/lib/reward-presentation";

const db = getPrismaClient();
const fallbackAvatar = "/images/avatars/campfire.svg";
const safeLayouts = new Set(["trophy-case", "veteran-vault", "centurion-hall", "war-room", "weekend-myth"]);

export default async function MemberProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const member = await db.user.findFirst({
    where: { username: username.toLowerCase(), isActive: true },
    select: {
      name: true, username: true, displayName: true, image: true, bio: true, avatarBorder: true, profileLayout: true,
      socialAccounts: { where: { displayPublic: true }, include: { steamProfile: { include: { libraryGames: { where: { isCurrent: true }, include: { app: { select: { name: true } } }, orderBy: { playtimeMinutes: "desc" } }, achievementSyncs: { select: { status: true, achievedCount: true } } } } }, orderBy: { platform: "asc" } },
      titles: { where: { equipped: true }, include: { title: true }, take: 1 },
      playerIdentities: { select: { id: true, gameType: true, displayName: true, server: { select: { displayName: true, worldName: true } }, _count: { select: { events: true } }, legacyEvidence: { select: { durationSeconds: true } } }, orderBy: { displayName: "asc" } },
      achievements: { include: { achievement: true }, orderBy: { awardedAt: "desc" } },
      unlockedRewards: { where: { reward: { kind: { in: ["BADGE", "MEDAL", "TROPHY"] } } }, include: { reward: { include: { achievement: { select: { name: true, rarity: true } } } } }, orderBy: { unlockedAt: "desc" } },
      xpEntries: { select: { amount: true } },
    },
  });
  if (!member) notFound();
  const events = member.playerIdentities.reduce((total, identity) => total + identity._count.events, 0);
  const legacySeconds = member.playerIdentities.flatMap((identity) => identity.legacyEvidence).reduce((total, evidence) => total + (evidence.durationSeconds ?? 0), 0);
  const legacyRecords = member.playerIdentities.reduce((total, identity) => total + identity.legacyEvidence.length, 0);
  const progression = progressionForXp(member.xpEntries.reduce((total, entry) => total + entry.amount, 0));
  const layout = member.profileLayout && safeLayouts.has(member.profileLayout) ? member.profileLayout : "field-notes";
  const title = member.titles[0]?.title;
  const ownerName = member.displayName ?? member.name ?? "Habitat member";
  const cabinetItems: CabinetItem[] = member.unlockedRewards.map((entry) => ({ id: entry.id, code: entry.reward.code, name: entry.reward.name, description: entry.reward.description, kind: entry.reward.kind as CabinetItem["kind"], rarity: entry.reward.achievement.rarity as AchievementRarity, achievementName: entry.reward.achievement.name, unlockedAt: entry.unlockedAt.toISOString() }));
  const publicSteam = member.socialAccounts.find((account) => account.platform === "STEAM" && account.steamProfile?.displayPublic)?.steamProfile ?? null;
  const steamGames = publicSteam?.libraryGames ?? [];
  const steamMinutes = steamGames.reduce((total, game) => total + game.playtimeMinutes, 0);
  const publicSteamAchievements = publicSteam?.achievementSyncs.filter((scan) => scan.status === "READY").reduce((total, scan) => total + scan.achievedCount, 0) ?? 0;
  const publicSteamCoverage = publicSteam?.achievementSyncs.filter((scan) => scan.status === "READY" || scan.status === "UNSUPPORTED").length ?? 0;

  return <section className={`page-shell public-profile layout-${layout}`}>
    <div className="public-profile-hero"><div className={`member-avatar ${avatarBorderClass(member.avatarBorder)}`}><img src={member.image ?? fallbackAvatar} alt={`${ownerName} avatar`} /></div><div><p className="eyebrow">Level {progression.level} Habitat member · @{member.username}</p><h1>{ownerName}</h1><span className={`habitat-title public-title ${titlePlateClass(title?.slug, "MEMBER")}`}><span>{title?.name ?? "Habitat member"}</span></span><p>{member.bio ?? "No field notes left for the lodge yet."}</p></div></div>
    <dl className="profile-metrics"><div><dt>Habitat level</dt><dd>{progression.level}</dd></div><div><dt>Total XP</dt><dd>{progression.totalXp.toLocaleString()}</dd></div><div><dt>Achievements</dt><dd>{member.achievements.length}</dd></div></dl>
    <div className="level-track compact"><i style={{ width: `${progression.progressPercent}%` }} /><div><span>{progression.currentLevelXp.toLocaleString()} XP this level</span><span>{progression.level === 100 ? "Maximum level" : `${progression.nextLevelXp.toLocaleString()} XP to Level ${progression.level + 1}`}</span><strong>{member.playerIdentities.length} worlds · {legacySeconds > 0 ? `${(legacySeconds / 3_600).toFixed(1)} legacy hours` : "live record"}</strong></div></div>
    <TrophyCabinet compact items={cabinetItems} ownerName={ownerName} />
    <div className="public-profile-grid">
      <article><MapPinned aria-hidden="true" size={19} /><p className="eyebrow">Verified identity</p><h2>World trail</h2>{member.playerIdentities.length ? <ul>{member.playerIdentities.map((identity) => <li key={identity.id}><Link className="identity-trail-link" href={`/chronicle/identity/${identity.id}`}><strong>{identity.displayName}</strong><span>{identity.server?.worldName ?? identity.server?.displayName ?? identity.gameType.replaceAll("_", " ")} · {identity._count.events} events · {identity.legacyEvidence.length} legacy records</span></Link></li>)}</ul> : <p>No verified game identities yet.</p>}<small>{legacyRecords > 0 ? `${legacyRecords} recovered records; only timestamp-paired sessions count as hours.` : `${events} verified Chronicle events.`}</small></article>
      <article><Trophy aria-hidden="true" size={19} /><p className="eyebrow">Trophy record</p><h2>Recent awards</h2>{member.achievements.length ? <ul>{member.achievements.slice(0, 5).map((award) => <li key={award.id}><strong>{award.achievement.name}</strong><span>{award.achievement.rarity.replaceAll("_", " ")}</span></li>)}</ul> : <p>The shelf is waiting for verified milestones.</p>}</article>
      <article><Award aria-hidden="true" size={19} /><p className="eyebrow">Physical collection</p><h2>Cabinet pieces</h2>{member.unlockedRewards.length ? <ul>{member.unlockedRewards.slice(0, 6).map((unlock) => <li key={unlock.id}><BadgeCheck aria-hidden="true" size={14} /><strong>{unlock.reward.name}</strong><span>{unlock.reward.kind.toLowerCase()} · {unlock.reward.achievement.rarity.replaceAll("_", " ")}</span></li>)}</ul> : <p>No cabinet pieces unlocked yet.</p>}</article>
    </div>
    {publicSteam ? <section className="public-steam-history"><div><Gamepad2 aria-hidden="true" size={20} /><div><p className="eyebrow">Steam-reported gaming history</p><h2>{publicSteam.personaName ?? "Verified Steam account"}</h2></div></div><dl><div><dt>Visible games</dt><dd>{publicSteam.libraryStatus === "READY" ? steamGames.length.toLocaleString() : "—"}</dd></div><div><dt>Visible playtime</dt><dd>{publicSteam.libraryStatus === "READY" ? `${Math.floor(steamMinutes / 60).toLocaleString()}h` : "—"}</dd></div><div><dt>Achievements</dt><dd>{publicSteam.achievementSyncs.length ? publicSteamAchievements.toLocaleString() : "—"}</dd></div><div><dt>Last successful sync</dt><dd>{publicSteam.libraryLastSuccessfulAt?.toLocaleDateString() ?? "Pending"}</dd></div></dl>{publicSteam.libraryStatus === "READY" && steamGames.length ? <ul>{steamGames.slice(0, 5).map((game) => <li key={game.id}><strong>{game.app.name}</strong><span>{Math.round(game.playtimeMinutes / 60).toLocaleString()}h</span></li>)}</ul> : <p>The member has shared this section, but Steam has not exposed a visible library.</p>}<small>Steam-reported data can be incomplete because of privacy and provider coverage. Achievement coverage is {publicSteamCoverage} of {publicSteam.achievementSyncs.length} queued visible games. It does not contribute Habitat XP.</small></section> : null}
    {member.socialAccounts.length ? <section className="member-links"><p className="eyebrow">Optional external links</p><div>{member.socialAccounts.map((account) => account.profileUrl ? <a href={account.profileUrl} key={account.id} rel="noreferrer" target="_blank">{socialPlatformLabels[account.platform]} <span>{account.platform === "STEAM" ? account.steamProfile?.personaName ?? "Verified account" : account.handle}</span><ExternalLink aria-hidden="true" size={14} /></a> : <span key={account.id}>{socialPlatformLabels[account.platform]} <strong>{account.handle}</strong></span>)}</div><small>Steam identity is verified through OpenID. Other external handles are member-provided, and The Habitat does not infer online status from them.</small></section> : null}
  </section>;
}
