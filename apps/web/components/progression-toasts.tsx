"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Zap } from "lucide-react";

type ProgressionResponse = { level: number; totalXp: number; entries: Array<{ id: string; amount: number; description: string }> };
type Toast = { id: string; title: string; detail: string; levelUp?: boolean };

export function ProgressionToasts() {
  const initialized = useRef(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let stopped = false;
    const poll = async () => {
      const response = await fetch("/api/progression", { cache: "no-store" }).catch(() => null);
      if (!response?.ok || stopped) return;
      const data = await response.json() as ProgressionResponse;
      const lastEntryKey = "habitat:last-xp-entry";
      const lastLevelKey = "habitat:last-level";
      const priorEntry = localStorage.getItem(lastEntryKey);
      const priorLevel = Number(localStorage.getItem(lastLevelKey) ?? data.level);
      if (initialized.current && priorEntry) {
        const newEntries = data.entries.slice(0, Math.max(0, data.entries.findIndex((entry) => entry.id === priorEntry)) || (data.entries.some((entry) => entry.id === priorEntry) ? 0 : data.entries.length));
        const additions: Toast[] = newEntries.reverse().map((entry) => ({ id: entry.id, title: `+${entry.amount.toLocaleString()} XP`, detail: entry.description }));
        if (data.level > priorLevel) additions.push({ id: `level-${data.level}`, title: `Level ${data.level} reached`, detail: "New rewards may be waiting in your profile.", levelUp: true });
        if (additions.length) setToasts((current) => [...current, ...additions].slice(-5));
      }
      localStorage.setItem(lastEntryKey, data.entries[0]?.id ?? "none");
      localStorage.setItem(lastLevelKey, String(data.level));
      initialized.current = true;
    };
    void poll();
    const interval = window.setInterval(() => { void poll(); }, 30_000);
    return () => { stopped = true; window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!toasts.length) return;
    const timeout = window.setTimeout(() => setToasts((current) => current.slice(1)), 6_000);
    return () => window.clearTimeout(timeout);
  }, [toasts]);

  return <aside aria-live="polite" className="xp-toast-stack">{toasts.map((toast) => <div className={toast.levelUp ? "xp-toast level-up" : "xp-toast"} key={toast.id}>{toast.levelUp ? <Sparkles aria-hidden="true" /> : <Zap aria-hidden="true" />}<div><strong>{toast.title}</strong><span>{toast.detail}</span></div><i aria-hidden="true" /></div>)}</aside>;
}
