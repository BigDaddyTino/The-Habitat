"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { storyHeartbeatMs } from "@habitat/shared";
import { touchStoryPresence } from "@/app/codex/actions";

/**
 * Keeps a codex surface current and announces the viewer to everyone else on it.
 *
 * The stream only ever says "something changed". Re-reading goes through the
 * ordinary authenticated render, so live sync can never deliver content the
 * server would have withheld — and a dropped stream degrades to a stale page
 * rather than a wrong one.
 */
export function StoryLiveSync({ arcId = null, nodeId = null, refreshOnHeartbeat = false }: { arcId?: string | null; nodeId?: string | null; refreshOnHeartbeat?: boolean }) {
  const router = useRouter();

  useEffect(() => {
    const source = new EventSource("/api/codex/stream");
    const onChanged = () => router.refresh();
    source.addEventListener("changed", onChanged);
    // EventSource retries on its own, so an error here needs no handling beyond
    // not tearing the page down over it.
    return () => {
      source.removeEventListener("changed", onChanged);
      source.close();
    };
  }, [router]);

  useEffect(() => {
    const ping = () => {
      if (document.visibilityState !== "visible") return;
      void touchStoryPresence({ arcId, nodeId })
        .then(() => {
          // Presence and courtesy locks are deliberately not revision records.
          // Refreshing on our own heartbeat lets the small crew see them age in
          // and out without turning every ephemeral ping into audit history.
          if (arcId || refreshOnHeartbeat) router.refresh();
        })
        .catch(() => {
          // A missed heartbeat just ages the viewer out of the roster.
        });
    };
    ping();
    const interval = window.setInterval(ping, storyHeartbeatMs);
    document.addEventListener("visibilitychange", ping);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", ping);
    };
  }, [arcId, nodeId, refreshOnHeartbeat, router]);

  return null;
}
