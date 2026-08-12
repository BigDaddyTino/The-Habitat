"use client";

import { useEffect, useRef } from "react";

export function MembersLodge() {
  const shell = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = shell.current;
    if (!element) return;
    const move = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      element.style.setProperty("--member-x", String((event.clientX - rect.left) / rect.width - 0.5));
      element.style.setProperty("--member-y", String((event.clientY - rect.top) / rect.height - 0.5));
    };
    element.addEventListener("pointermove", move);
    return () => element.removeEventListener("pointermove", move);
  }, []);

  return <div aria-hidden="true" className="members-atmosphere" ref={shell}><i /><i /><i /><span /></div>;
}
