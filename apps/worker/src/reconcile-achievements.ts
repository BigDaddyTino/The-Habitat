import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { getPrismaClient } from "@habitat/db/client";
import { reconcileAchievementCatalog } from "./achievements.js";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env"), quiet: true });

const reconciled = await reconcileAchievementCatalog();
console.log(`Reconciled the achievement catalogue for ${reconciled} user${reconciled === 1 ? "" : "s"}.`);
await getPrismaClient().$disconnect();
