import { readFile } from "node:fs/promises";
import path from "node:path";
import type { AtlasMapConnectionPath } from "@habitat/shared";

export type AtlasRouteBacklogStatus = "AUTHOR_NOW" | "REVIEW_REQUIRED" | "DEFER";
export type AtlasRouteConfidence = "HIGH_CONFIDENCE" | "REVIEW_REQUIRED" | "NOT_ENOUGH_EVIDENCE";

export type AtlasCanonicalRouteBacklogItem = {
  connectionId: string;
  source: string;
  destination: string;
  type: string;
  description: string;
  visualEvidence: string;
  loreEvidence: string;
  recommendedScene: string;
  confidence: AtlasRouteConfidence;
  status: AtlasRouteBacklogStatus;
  reviewState: "APPROVED" | "REVIEW_REQUIRED" | "DEFERRED";
  geometry?: AtlasMapConnectionPath["geometry"];
};

export type AtlasCanonicalRouteBacklog = {
  contract: "martino-atlas-canonical-route-backlog";
  contractVersion: 1;
  reviewedOn: string;
  policy: string;
  counts: { connections: number; authorNow: number; reviewRequired: number; defer: number };
  routes: AtlasCanonicalRouteBacklogItem[];
};

export async function loadAtlasCanonicalRouteBacklog(root = path.resolve(process.cwd(), "..", "..")) {
  const content = await readFile(path.join(root, "Docs", "atlas-route-authoring-backlog.json"), "utf8");
  const backlog = JSON.parse(content) as AtlasCanonicalRouteBacklog;
  if (backlog.contract !== "martino-atlas-canonical-route-backlog" || backlog.contractVersion !== 1) throw new Error("Unsupported Atlas route backlog contract.");
  const identifiers = new Set<string>();
  for (const route of backlog.routes) {
    if (identifiers.has(route.connectionId)) throw new Error(`Duplicate route-backlog connection ${route.connectionId}.`);
    identifiers.add(route.connectionId);
    if (route.status === "AUTHOR_NOW" && (route.confidence !== "HIGH_CONFIDENCE" || route.reviewState !== "APPROVED" || !route.geometry)) throw new Error(`Approved route ${route.connectionId} lacks high-confidence geometry.`);
    if (route.status !== "AUTHOR_NOW" && route.geometry) throw new Error(`Unapproved route ${route.connectionId} must not contain persistent geometry.`);
  }
  const count = (status: AtlasRouteBacklogStatus) => backlog.routes.filter((route) => route.status === status).length;
  if (backlog.routes.length !== backlog.counts.connections || count("AUTHOR_NOW") !== backlog.counts.authorNow || count("REVIEW_REQUIRED") !== backlog.counts.reviewRequired || count("DEFER") !== backlog.counts.defer) throw new Error("Atlas route backlog counts do not match its records.");
  return backlog;
}
