"use client";

import { CirclePlay, RefreshCw, Square, Upload } from "lucide-react";
import { useFormStatus } from "react-dom";

const controls = [
  { action: "START", label: "Start", icon: CirclePlay },
  { action: "STOP", label: "Stop", icon: Square },
  { action: "RESTART", label: "Restart", icon: RefreshCw },
  { action: "UPDATE", label: "Update", icon: Upload },
] as const;

export function OperationButtons({ busy }: { busy: boolean }) {
  const { pending } = useFormStatus();
  return <>{controls.map(({ action, label, icon: Icon }) => <button
    className={action === "START" ? "operation-button" : "operation-button danger"}
    key={action} name="action" value={action} type="submit" disabled={busy || pending}
    title={action === "UPDATE" ? "Stop the world, install updates, then start it again" : label}
  ><Icon aria-hidden="true" size={15} />{pending ? "Wait…" : label}</button>)}</>;
}
