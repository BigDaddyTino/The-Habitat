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
    ...(filters.gameType ? { OR: [{ gameType: null }, { gameType: filters.gameType }] } : {}),
    ...(filters.player ? { currentHolder: { is: { holderName: filters.player } } } : {}),
  };
  const [definitions, holders] = await Promise.all([
    db.recordDefinition.findMany({
      where,
      include: {
        currentHolder: true,
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
