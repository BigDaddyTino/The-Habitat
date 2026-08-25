import "server-only";
import { getPrismaClient } from "@habitat/db/client";
import { createAtlasPersistenceService } from "./atlas-persistence-service";

/**
 * Internal server-only Atlas authoring service. No route or server action
 * exposes it in Prompt 3; future callers must authenticate before supplying
 * the actor identity recorded by every mutation.
 */
export const atlasPersistence = createAtlasPersistenceService(getPrismaClient());

export { AtlasPersistenceError } from "./atlas-persistence-service";
export type {
  CreateBoundaryInput,
  CreateConnectionPathInput,
  CreatePointPlacementInput,
  CreateTopologyNodeInput,
  CreateWorldConnectionInput,
  PersistedAreaRingInput,
  ReplacePlacementTopologyInput,
  SplitBoundaryInput,
  UpdateBoundaryInput,
  UpdateConnectionPathInput,
  UpdatePointPlacementInput,
  UpdateTopologyNodeInput,
  UpdateWorldConnectionInput,
} from "./atlas-persistence-service";
