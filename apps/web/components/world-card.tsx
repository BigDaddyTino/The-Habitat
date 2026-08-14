"use client";

import Link from "next/link";
import { ArrowUpRight, UsersRound, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { habitatLiveBrowserEvent, type HabitatLiveReactionKind, type VerifiedHabitatLiveEvent } from "@habitat/shared";
import type { WorldView } from "@/lib/world-data";
import { StatusBadge } from "./status-badge";

export function WorldCard({ world }: { world: WorldView }) {
  const [liveReaction, setLiveReaction] = useState<HabitatLiveReactionKind | null>(null);
  const [isPortalPreview, setIsPortalPreview] = useState(false);
  useEffect(() => {
    let timeout: number | undefined;
    let previewFrame: number | undefined;
    const isLocalPreview = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
    const preview = isLocalPreview ? new URLSearchParams(window.location.search).get("portalPreview") : null;
    const [previewSlug, previewKind] = preview?.split(":") ?? [];
    if (previewSlug === world.slug && (previewKind === "ignite" || previewKind === "sputter")) {
      previewFrame = window.requestAnimationFrame(() => {
        setIsPortalPreview(true);
        setLiveReaction(previewKind === "ignite" ? "PORTAL_IGNITE" : "PORTAL_SPUTTER");
      });
    }
    const react = (browserEvent: Event) => {
      const event = (browserEvent as CustomEvent<VerifiedHabitatLiveEvent>).detail;
      if (event.world.slug !== world.slug || (event.reaction.kind !== "PORTAL_IGNITE" && event.reaction.kind !== "PORTAL_SPUTTER")) return;
      setIsPortalPreview(false);
      setLiveReaction(event.reaction.kind);
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => setLiveReaction(null), event.reaction.durationMs);
    };
    window.addEventListener(habitatLiveBrowserEvent, react);
    return () => { window.removeEventListener(habitatLiveBrowserEvent, react); window.clearTimeout(timeout); if (previewFrame !== undefined) window.cancelAnimationFrame(previewFrame); };
  }, [world.slug]);
  const playerLabel = world.players === null ? "No live count" : `${world.players} / ${world.capacity ?? "-"}`;
  return (
    <Link href={`/worlds/${world.slug}`} className={`world-card world-card-link accent-${world.accent} state-${world.state.toLowerCase().replaceAll("_", "-")}${liveReaction ? ` live-${liveReaction.toLowerCase().replaceAll("_", "-")}` : ""}`} data-portal-preview={isPortalPreview ? "true" : undefined} aria-label={`Open ${world.worldName} server dossier`}>
      <span className="world-portal-reaction" aria-hidden="true"><i /><i /><i /><i /><i /><b /></span>
      {liveReaction ? <span className="world-portal-caption" aria-hidden="true">{isPortalPreview ? "Visual effect preview" : liveReaction === "PORTAL_IGNITE" ? "Portal link established" : "Portal link disrupted"}</span> : null}
      <div className="world-card-topline">
        <span className="world-game">{world.game}</span>
        <StatusBadge state={world.state} />
      </div>
      <h2>{world.worldName}</h2>
      <p>{world.description}</p>
      <dl className="world-metrics">
        <div><dt><UsersRound aria-hidden="true" size={14} /> Players</dt><dd>{playerLabel}</dd></div>
        <div><dt><Wifi aria-hidden="true" size={14} /> {world.ping === null ? "Last fire" : "Ping"}</dt><dd>{world.ping === null ? world.lastFire : `${world.ping} ms`}</dd></div>
      </dl>
      <span className="world-link">Open server dossier <ArrowUpRight aria-hidden="true" size={16} /></span>
    </Link>
  );
}
