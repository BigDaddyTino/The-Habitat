"use client";

import { useEffect, useRef } from "react";

export function PollCloseField() {
  const tzOffsetRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (tzOffsetRef.current) tzOffsetRef.current.value = String(new Date().getTimezoneOffset()); }, []);
  return <>
    <label className="field-wide">Closes at<input name="closesAt" type="datetime-local" required /></label>
    <input defaultValue={0} name="tzOffsetMinutes" ref={tzOffsetRef} type="hidden" />
  </>;
}
