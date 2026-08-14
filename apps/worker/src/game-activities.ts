import { getPrismaClient, type Prisma } from "@habitat/db/client";
import type { GameActivityType, HabitatGameKey } from "@habitat/shared";
import { evaluateAchievementsForActivity } from "./achievements.js";
import { evaluateRecordsForActivity } from "./records.js";
import { recordEvaluationFailure, resolveEvaluationFailures } from "./evaluation-failures.js";

const PROJECTOR_STARTED_AT = new Date();

export type ActivitySpec = { activityType: GameActivityType; valueNumber?: number; valueText?: string; metadata?: Prisma.InputJsonObject };

export function activitySpecsForServerEvent(eventType: string, valueNumber: number | null): ActivitySpec[] {
  if (eventType === "PLAYER_JOINED") return [{ activityType: "SESSION_STARTED", valueNumber: 1 }];
  if (eventType === "PLAYER_DIED") return [{ activityType: "DEATHS_RECORDED", valueNumber: valueNumber && valueNumber > 0 ? valueNumber : 1 }];
  if (eventType === "PLAYER_KILLED") return [{ activityType: "KILLS_RECORDED", valueNumber: valueNumber && valueNumber > 0 ? valueNumber : 1 }];
  if (eventType === "BOSS_KILLED") return [{ activityType: "BOSS_KILLED", valueNumber: 1 }];
  return [];
}

export function activitySpecsForMatchParticipant(input: { result: string; kills: number | null; deaths: number | null; assists: number | null; scoreChange: number | null; mvp: boolean; svp: boolean; sharedMemberCount: number }): ActivitySpec[] {
  const specs: ActivitySpec[] = [{ activityType: "MATCH_PLAYED", valueNumber: 1 }];
  if (input.result === "WIN") specs.push({ activityType: "MATCH_WON", valueNumber: 1 });
  else if (input.result === "LOSS") specs.push({ activityType: "MATCH_LOST", valueNumber: 1 });
  else if (input.result === "DRAW") specs.push({ activityType: "MATCH_DRAWN", valueNumber: 1 });
  if (input.kills !== null) specs.push({ activityType: "KILLS_RECORDED", valueNumber: input.kills });
  if (input.deaths !== null) specs.push({ activityType: "DEATHS_RECORDED", valueNumber: input.deaths });
  if (input.assists !== null) specs.push({ activityType: "ASSISTS_RECORDED", valueNumber: input.assists });
  if (input.mvp) specs.push({ activityType: "MVP_EARNED", valueNumber: 1 });
  if (input.svp) specs.push({ activityType: "SVP_EARNED", valueNumber: 1 });
  if (input.scoreChange !== null) specs.push({ activityType: "RATING_CHANGED", valueNumber: input.scoreChange });
  if (input.sharedMemberCount > 1) specs.push({ activityType: "SHARED_MATCH_PLAYED", valueNumber: input.sharedMemberCount, metadata: { sharedMemberCount: input.sharedMemberCount } });
  return specs;
}

async function projectServerEvent(transaction: Prisma.TransactionClient, event: { id: string; gameType: string; eventType: string; occurredAt: Date; receivedAt: Date; valueNumber: number | null; valueText: string | null; source: string; sourceConfidence: number; playerIdentity: { userId: string | null } | null }) {
  if (!event.playerIdentity?.userId) return 0;
  const specs = activitySpecsForServerEvent(event.eventType, event.valueNumber);
  for (const spec of specs) {
    const activity = await transaction.gameActivity.upsert({
      where: { dedupeKey: `activity:server:${event.id}:${spec.activityType}` },
      create: { userId: event.playerIdentity.userId, gameKey: event.gameType, activityType: spec.activityType, occurredAt: event.occurredAt, source: event.source.slice(0, 40), sourceConfidence: event.sourceConfidence, valueNumber: spec.valueNumber, valueText: spec.valueText ?? event.valueText?.slice(0, 200), metadata: spec.metadata, sourceServerEventId: event.id, dedupeKey: `activity:server:${event.id}:${spec.activityType}` },
      update: {},
    });
    await evaluateAchievementsForActivity(transaction, activity.id, { suppressNotifications: event.receivedAt < PROJECTOR_STARTED_AT });
    await evaluateRecordsForActivity(transaction, activity.id, { suppressNotifications: event.receivedAt < PROJECTOR_STARTED_AT });
  }
  return specs.length;
}

async function projectMatchParticipant(transaction: Prisma.TransactionClient, participant: { id: string; result: string; kills: number | null; deaths: number | null; assists: number | null; scoreChange: number | null; mvp: boolean; svp: boolean; clubGameProfile: { userId: string; gameType: string }; match: { providerMatchId: string; occurredAt: Date; ingestedAt: Date; participants: Array<{ clubGameProfile: { userId: string } }> } }) {
  const sharedMemberCount = new Set(participant.match.participants.map((entry) => entry.clubGameProfile.userId)).size;
  const specs = activitySpecsForMatchParticipant({ result: participant.result, kills: participant.kills, deaths: participant.deaths, assists: participant.assists, scoreChange: participant.scoreChange, mvp: participant.mvp, svp: participant.svp, sharedMemberCount });
  for (const spec of specs) {
    const dedupeKey = `activity:club:${participant.id}:${spec.activityType}`;
    const activity = await transaction.gameActivity.upsert({
      where: { dedupeKey },
      create: { userId: participant.clubGameProfile.userId, gameKey: participant.clubGameProfile.gameType, activityType: spec.activityType, occurredAt: participant.match.occurredAt, source: "MARVEL_RIVALS_API", sourceConfidence: 90, valueNumber: spec.valueNumber, valueText: spec.valueText, metadata: { providerMatchId: participant.match.providerMatchId, ...(spec.metadata ?? {}) }, sourceClubMatchParticipantId: participant.id, providerEventId: participant.match.providerMatchId, dedupeKey },
      update: {},
    });
    await evaluateAchievementsForActivity(transaction, activity.id, { suppressNotifications: participant.match.ingestedAt < PROJECTOR_STARTED_AT });
    await evaluateRecordsForActivity(transaction, activity.id, { suppressNotifications: participant.match.ingestedAt < PROJECTOR_STARTED_AT });
  }
  return specs.length;
}

/** Bounded replay-safe projector for only activity-producing source rows. */
export async function projectGameActivities(): Promise<{ serverSources: number; clubSources: number; activities: number }> {
  const db = getPrismaClient();
  const [events, participants] = await Promise.all([
    db.serverEvent.findMany({
      where: { eventType: { in: ["PLAYER_JOINED", "PLAYER_DIED", "PLAYER_KILLED", "BOSS_KILLED"] }, playerIdentity: { is: { userId: { not: null } } }, gameActivities: { none: {} } },
      orderBy: [{ occurredAt: "asc" }, { id: "asc" }],
      take: 200,
      select: { id: true, gameType: true, eventType: true, occurredAt: true, receivedAt: true, valueNumber: true, valueText: true, source: true, sourceConfidence: true, playerIdentity: { select: { userId: true } } },
    }),
    db.clubGameMatchParticipant.findMany({
      where: { gameActivities: { none: {} } },
      orderBy: [{ match: { occurredAt: "asc" } }, { id: "asc" }],
      take: 200,
      select: { id: true, result: true, kills: true, deaths: true, assists: true, scoreChange: true, mvp: true, svp: true, clubGameProfile: { select: { userId: true, gameType: true } }, match: { select: { providerMatchId: true, occurredAt: true, ingestedAt: true, participants: { select: { clubGameProfile: { select: { userId: true } } } } } } },
    }),
  ]);
  let activities = 0;
  for (const event of events) {
    try {
      activities += await db.$transaction((transaction) => projectServerEvent(transaction, { ...event, gameType: event.gameType as HabitatGameKey }));
      await resolveEvaluationFailures("ACTIVITY_PROJECTION", [event.id]);
    } catch (error) {
      await recordEvaluationFailure({ kind: "ACTIVITY_PROJECTION", scope: "server-event", reference: event.id, error });
    }
  }
  for (const participant of participants) {
    try {
      activities += await db.$transaction((transaction) => projectMatchParticipant(transaction, participant));
      await resolveEvaluationFailures("ACTIVITY_PROJECTION", [participant.id]);
    } catch (error) {
      await recordEvaluationFailure({ kind: "ACTIVITY_PROJECTION", scope: "club-match", reference: participant.id, error });
    }
  }
  return { serverSources: events.length, clubSources: participants.length, activities };
}
