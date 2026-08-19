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
    // The server recycles every stream after ten minutes and EventSource
    // reconnects on its own — but each new connection starts a fresh cursor.
    // A change landing in the reconnect gap would never produce a `changed`
    // event, so the `ready` cursor is compared against the last one seen:
    // if it moved while we were not listening, the page refreshes to catch up.
    let lastCursor: string | null = null;
    const cursorOf = (event: MessageEvent) => {
      try {
        const parsed: unknown = JSON.parse(String(event.data));
        const cursor = (parsed as { cursor?: unknown } | null)?.cursor;
        return typeof cursor === "string" && cursor ? cursor : null;
      } catch {
        return null;
      }
    };
    const onReady = (event: MessageEvent) => {
      const cursor = cursorOf(event);
      if (cursor && lastCursor && cursor !== lastCursor) router.refresh();
      if (cursor) lastCursor = cursor;
    };
    const onChanged = (event: MessageEvent) => {
      lastCursor = cursorOf(event) ?? lastCursor;
      router.refresh();
    };
    source.addEventListener("ready", onReady);
    source.addEventListener("changed", onChanged);
    // EventSource retries on its own, so an error here needs no handling beyond
    // not tearing the page down over it.
    return () => {
      source.removeEventListener("ready", onReady);
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
