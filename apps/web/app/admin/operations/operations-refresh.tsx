"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function OperationsRefresh() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => router.refresh(), 10_000);
    return () => window.clearInterval(interval);
  }, [router]);

  function refresh() {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 500);
  }

  return <button aria-label="Refresh operations status" className="icon-action operation-refresh" disabled={refreshing} onClick={refresh} title="Refresh operations status" type="button"><RefreshCw aria-hidden="true" className={refreshing ? "spinning" : undefined} size={16} /></button>;
}
