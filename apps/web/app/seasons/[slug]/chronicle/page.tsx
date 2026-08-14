import { notFound } from "next/navigation";
import { getPrismaClient } from "@habitat/db/client";
import { SeasonChronicle, type SeasonChronicleStory } from "@/components/season-chronicle";

const db = getPrismaClient();

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function parseStory(season: { seasonName: string; ordinal: number; theme: string }, snapshotValue: unknown): SeasonChronicleStory {
  const snapshot = record(snapshotValue);
  const contributors = Array.isArray(snapshot.contributors) ? snapshot.contributors.map(record).map((entry) => ({ userId: text(entry.userId), name: text(entry.name) || "Habitat member", username: text(entry.username) || null, xp: number(entry.xp) })).filter((entry) => entry.userId) : [];
  const expeditions = Array.isArray(snapshot.expeditions) ? snapshot.expeditions.map(record).map((entry) => ({ name: text(entry.name), gameType: text(entry.gameType), progress: number(entry.progress), threshold: number(entry.threshold), completedAt: text(entry.completedAt) || null })).filter((entry) => entry.name) : [];
  const quests = Array.isArray(snapshot.quests) ? snapshot.quests.map(record).map((entry) => ({ name: text(entry.name), scope: text(entry.scope), completions: number(entry.completions) })).filter((entry) => entry.name) : [];
  return { ...season, communityXp: number(snapshot.communityXp), memberCount: number(snapshot.memberCount), contributors, expeditions, quests };
}

export default async function SeasonChroniclePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const season = await db.season.findFirst({ where: { slug, isEnabled: true, status: "COMPLETED" }, include: { chronicle: true } });
  if (!season?.chronicle) notFound();
  return <SeasonChronicle story={parseStory({ seasonName: season.name, ordinal: season.ordinal, theme: season.theme }, season.chronicle.snapshot)} />;
}
