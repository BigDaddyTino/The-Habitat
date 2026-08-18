/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";

export function ResilientAvatar({ src, fallbackSrc, alt }: { src: string | null; fallbackSrc: string; alt: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const shownSrc = src && src !== failedSrc ? src : fallbackSrc;

  useEffect(() => {
    if (src && imageRef.current?.complete && imageRef.current.naturalWidth === 0) setFailedSrc(src);
  }, [src]);

  return <img alt={alt} onError={() => { if (src && shownSrc !== fallbackSrc) setFailedSrc(src); }} ref={imageRef} src={shownSrc} />;
}
