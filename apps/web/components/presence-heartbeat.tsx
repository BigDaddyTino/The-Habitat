"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const HEARTBEAT_INTERVAL_MS = 60_000;

export function PresenceHeartbeat({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    const ping = () => {
      if (document.visibilityState === "visible") {
        void fetch("/api/presence", { method: "POST", keepalive: true, cache: "no-store" })
          .then((response) => { if (response.ok && pathname === "/members") router.refresh(); });
      }
    };
    ping();
    const interval = window.setInterval(ping, HEARTBEAT_INTERVAL_MS);
    document.addEventListener("visibilitychange", ping);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", ping);
    };
  }, [enabled, pathname, router]);

  return null;
}
