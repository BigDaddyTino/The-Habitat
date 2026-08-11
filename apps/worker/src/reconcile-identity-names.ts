import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { getPrismaClient } from "@habitat/db/client";
import { reconcileSteamIdentityNames } from "./steam-personas.js";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env"), quiet: true });

const reconciled = await reconcileSteamIdentityNames();
const db = getPrismaClient();
const enshrouded = await db.playerIdentity.findMany({ where: { gameType: "ENSHROUDED" }, select: { displayName: true } });
const unresolved = enshrouded.filter((identity) => /^Steam \d{6}$/.test(identity.displayName)).length;
console.log(`Reconciled ${reconciled} fallback Steam identity name${reconciled === 1 ? "" : "s"}; ${unresolved} Enshrouded fallback${unresolved === 1 ? " remains" : "s remain"}.`);
await db.$disconnect();
