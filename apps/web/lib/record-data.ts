import { getPrismaClient } from "@habitat/db/client";

const db = getPrismaClient();

export type RecordHall = "LEGENDS" | "SHAME";

/**
 * Returns every definition in the hall, connected or not. A category whose source is switched off
 * still gets its wing so members can see it exists and that nothing is being counted there yet —
 * silently omitting it reads as "this hall has four categories", which is not true.
 */
export async function getRecordHallData(hall: RecordHall) {
  const definitions = await db.recordDefinition.findMany({
    where: { hall },
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
  });
  return { definitions, activeRecords: definitions.filter((definition) => definition.enabled).length };
}
