import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

export type { Prisma } from "./generated/prisma/client";

export function createPrismaClient(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL must be configured before creating a Prisma client.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

const globalForPrisma = globalThis as unknown as { habitatPrisma?: ReturnType<typeof createPrismaClient> };

export function getPrismaClient() {
  if (!globalForPrisma.habitatPrisma) {
    globalForPrisma.habitatPrisma = createPrismaClient();
  }

  return globalForPrisma.habitatPrisma;
}
