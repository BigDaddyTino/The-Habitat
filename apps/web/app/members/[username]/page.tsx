/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { Award, BadgeCheck, ExternalLink, MapPinned, Trophy } from "lucide-react";
import { getPrismaClient } from "@habitat/db/client";
import { progressionForXp } from "@habitat/shared";
import { socialPlatformLabels } from "@/lib/social-platforms";

const db = getPrismaClient();
const fallbackAvatar = "/images/avatars/campfire.svg";
const safeBorders = new Set(["ember-ring", "aurora-ring", "ironwood-ring", "mythic-flame-ring", "centurion-ring", "porchlight-ring", "kindling-ring", "solar-flare-ring"]);
const safeLayouts = new Set(["trophy-case", "veteran-vault", "centurion-hall", "war-room", "weekend-myth"]);

export default async function MemberProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const member = await db.user.findFirst({
    where: { username: username.toLowerCase(), isActive: true },
    select: {
      name: true, username: true, displayName: true, image: true, bio: true, avatarBorder: true, profileLayout: true,
      socialAccounts: { where: { displayPublic: true }, orderBy: { platform: "asc" } },
      titles: { where: { equipped: true }, include: { title: true }, take: 1 },
      playerIdentities: { select: { gameType: true, displayName: true, _count: { select: { events: true } }, legacyEvidence: { select: { durationSeconds: true } } }, orderBy: { displayName: "asc" } },
      achievements: { include: { achievement: true }, orderBy: { awardedAt: "desc" } },
      unlockedRewards: { where: { reward: { kind: "BADGE" } }, include: { reward: true }, orderBy: { unlockedAt: "desc" } },
      xpEntries: { select: { amount: true } },
    },
  });
  if (!member) notFound();
  const events = member.playerIdentities.reduce((total, identity) => total + identity._count.events, 0);
  const legacySeconds = member.playerIdentities.flatMap((identity) => identity.legacyEvidence).reduce((total, evidence) => total + (evidence.durationSeconds ?? 0), 0);
  const legacyRecords = member.playerIdentities.reduce((total, identity) => total + identity.legacyEvidence.length, 0);
  const progression = progressionForXp(member.xpEntries.reduce((total, entry) => total + entry.amount, 0));
  const border = member.avatarBorder && safeBorders.has(member.avatarBorder) ? member.avatarBorder : "default";
  const layout = member.profileLayout && safeLayouts.has(member.profileLayout) ? member.profileLayout : "field-notes";
  const title = member.titles[0]?.title.name;

  return <section className={`page-shell public-profile layout-${layout}`}>
    <div className="public-profile-hero"><div className={`member-avatar avatar-border-${border}`}><img src={member.image ?? fallbackAvatar} alt={`${member.displayName ?? member.name ?? "Member"} avatar`} /></div><div><p className="eyebrow">Level {progression.level} Habitat member · @{member.username}</p><h1>{member.displayName ?? member.name ?? "Habitat member"}</h1><p className="public-title">{title ?? "Habitat member"}</p><p>{member.bio ?? "No field notes left for the lodge yet."}</p></div></div>
    <dl className="profile-metrics"><div><dt>Habitat level</dt><dd>{progression.level}</dd></div><div><dt>Total XP</dt><dd>{progression.totalXp.toLocaleString()}</dd></div><div><dt>Achievements</dt><dd>{member.achievements.length}</dd></div></dl>
    <div className="level-track compact"><i style={{ width: `${progression.progressPercent}%` }} /><div><span>{progression.currentLevelXp.toLocaleString()} XP this level</span><span>{progression.level === 100 ? "Maximum level" : `${progression.nextLevelXp.toLocaleString()} XP to Level ${progression.level + 1}`}</span><strong>{member.playerIdentities.length} worlds · {legacySeconds > 0 ? `${(legacySeconds / 3_600).toFixed(1)} legacy hours` : "live record"}</strong></div></div>
    <div className="public-profile-grid">
      <article><MapPinned aria-hidden="true" size={19} /><p className="eyebrow">Verified identity</p><h2>World trail</h2>{member.playerIdentities.length ? <ul>{member.playerIdentities.map((identity) => <li key={`${identity.gameType}-${identity.displayName}`}><strong>{identity.displayName}</strong><span>{identity.gameType.replaceAll("_", " ")} · {identity._count.events} events · {identity.legacyEvidence.length} legacy records</span></li>)}</ul> : <p>No verified game identities yet.</p>}<small>{legacyRecords > 0 ? `${legacyRecords} recovered records; only timestamp-paired sessions count as hours.` : `${events} verified Chronicle events.`}</small></article>
      <article><Trophy aria-hidden="true" size={19} /><p className="eyebrow">Trophy shelf</p><h2>Recent awards</h2>{member.achievements.length ? <ul>{member.achievements.slice(0, 5).map((award) => <li key={award.id}><strong>{award.achievement.name}</strong><span>{award.achievement.rarity.replaceAll("_", " ")}</span></li>)}</ul> : <p>The shelf is waiting for verified milestones.</p>}</article>
      <article><Award aria-hidden="true" size={19} /><p className="eyebrow">Patches</p><h2>Badges</h2>{member.unlockedRewards.length ? <ul>{member.unlockedRewards.map((unlock) => <li key={unlock.id}><BadgeCheck aria-hidden="true" size={14} /><strong>{unlock.reward.name}</strong></li>)}</ul> : <p>No badges unlocked yet.</p>}</article>
    </div>
    {member.socialAccounts.length ? <section className="member-links"><p className="eyebrow">Optional external links</p><div>{member.socialAccounts.map((account) => account.profileUrl ? <a href={account.profileUrl} key={account.id} rel="noreferrer" target="_blank">{socialPlatformLabels[account.platform]} <span>{account.handle}</span><ExternalLink aria-hidden="true" size={14} /></a> : <span key={account.id}>{socialPlatformLabels[account.platform]} <strong>{account.handle}</strong></span>)}</div><small>External handles are member-provided. The Habitat does not infer online status from them.</small></section> : null}
  </section>;
}
