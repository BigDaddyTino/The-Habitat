"use client";

import { useCallback, useEffect, useRef } from "react";
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
  // Every codex editor and sheet keys its fields on the row's version so a
  // colleague's save replaces stale values instead of letting them be
  // re-submitted over the top. That is right until somebody is mid-sentence:
  // the remount then throws away whatever they had typed, silently, with no
  // way to get it back — which is what "I edited it and it didn't save" turned
  // out to be. So a refresh waits while there is unsaved text on the page, and
  // runs the moment the form is submitted or abandoned. Nothing is lost either
  // way: the version check still refuses a save made against a stale version,
  // and now it refuses it with the writer's words still on screen to copy.
  const dirty = useRef(false);
  const deferred = useRef(false);

  const refresh = useCallback(() => {
    if (dirty.current) { deferred.current = true; return; }
    router.refresh();
  }, [router]);

  useEffect(() => {
    // Delegated, so this covers every editor and every kind's sheet without
    // each of them having to remember to opt in.
    const isEditor = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest("form.story-form"));
    const onInput = (event: Event) => { if (isEditor(event.target)) dirty.current = true; };
    const settle = (event: Event) => {
      if (!isEditor(event.target)) return;
      dirty.current = false;
      if (deferred.current) { deferred.current = false; router.refresh(); }
    };
    document.addEventListener("input", onInput, true);
    document.addEventListener("submit", settle, true);
    document.addEventListener("reset", settle, true);
    return () => {
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("submit", settle, true);
      document.removeEventListener("reset", settle, true);
    };
  }, [router]);

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
      if (cursor && lastCursor && cursor !== lastCursor) refresh();
      if (cursor) lastCursor = cursor;
    };
    const onChanged = (event: MessageEvent) => {
      lastCursor = cursorOf(event) ?? lastCursor;
      refresh();
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
  }, [refresh]);

  useEffect(() => {
    const ping = () => {
      if (document.visibilityState !== "visible") return;
      void touchStoryPresence({ arcId, nodeId })
        .then(() => {
          // Presence and courtesy locks are deliberately not revision records.
          // Refreshing on our own heartbeat lets the small crew see them age in
          // and out without turning every ephemeral ping into audit history.
          if (arcId || refreshOnHeartbeat) refresh();
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
  }, [arcId, nodeId, refreshOnHeartbeat, refresh]);

  return null;
}
