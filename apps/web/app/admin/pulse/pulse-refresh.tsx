"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Pulse is only as fresh as its last render, and an operator watching a red
 * tile should not have to reload to see it clear. The cadence deliberately
 * matches the worker's default evaluation interval rather than being faster:
 * polling more often than the data changes only costs queries.
 */
export function PulseRefresh() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => router.refresh(), 30_000);
    return () => window.clearInterval(interval);
  }, [router]);

  function refresh() {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 500);
  }

  return <button aria-label="Refresh Habitat Pulse" className="icon-action pulse-refresh" disabled={refreshing} onClick={refresh} title="Refresh Habitat Pulse" type="button"><RefreshCw aria-hidden="true" className={refreshing ? "spinning" : undefined} size={16} /></button>;
}
