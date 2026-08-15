import type { Prisma } from "@habitat/db/client";
import { getPrismaClient } from "@habitat/db/client";
import type { ChronicleGameType } from "./world-data";

const db = getPrismaClient();

export type RecordHall = "LEGENDS" | "SHAME";

export type RecordHallFilters = {
  gameType?: ChronicleGameType;
  player?: string;
};

export async function getRecordHallData(hall: RecordHall, filters: RecordHallFilters = {}) {
  const where: Prisma.RecordDefinitionWhereInput = {
    hall,
    enabled: true,
    ...(filters.gameType ? { gameKey: null, OR: [{ gameType: null }, { gameType: filters.gameType }] } : {}),
    ...(filters.player ? { currentHolder: { is: { holderName: filters.player } } } : {}),
  };
  const [definitions, holders] = await Promise.all([
    db.recordDefinition.findMany({
      where,
      include: {
        // The activity receipt page hides evidence behind a private Club Game profile, so the
        // hall needs the same visibility facts to avoid offering a link that resolves to 404.
        currentHolder: {
          include: {
            sourceActivity: {
              select: {
                sourceServerEventId: true,
                sourceClubMatchParticipant: { select: { clubGameProfile: { select: { displayPublic: true } } } },
              },
            },
          },
        },
        history: { orderBy: { occurredAt: "desc" }, take: 1 },
      },
      orderBy: [{ category: "asc" }, { title: "asc" }],
    }),
    db.recordHolder.findMany({
      where: { definition: { hall, enabled: true } },
      select: { holderName: true },
      orderBy: { holderName: "asc" },
    }),
  ]);
  return { definitions, players: [...new Set(holders.map((holder) => holder.holderName))] };
}
