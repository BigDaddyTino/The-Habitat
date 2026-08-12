"use client";

import { Check, Copy, KeyRound } from "lucide-react";
import { useState } from "react";

export function WeeklyInviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_000);
  };
  return <div className="weekly-code-card">
    <div><KeyRound aria-hidden="true" size={17} /><span><small>Your weekly invite code</small><code>{code}</code></span></div>
    <button aria-label="Copy weekly invite code" onClick={copy} type="button">{copied ? <Check aria-hidden="true" size={15} /> : <Copy aria-hidden="true" size={15} />}{copied ? "Copied" : "Copy"}</button>
    <p>Unique to you · rotates Monday at midnight Eastern</p>
  </div>;
}
