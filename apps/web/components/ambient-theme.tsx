"use client";

import { useEffect } from "react";
import { getGreatHallAtmosphere, type HallSky } from "@/lib/hall-atmosphere";

const previewSkies = new Set<HallSky>(["sunrise", "midday", "sunset", "night"]);

function currentSky() {
  const live = getGreatHallAtmosphere().sky;
  if (!["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)) return live;
  const requested = new URLSearchParams(window.location.search).get("hallSky") as HallSky | null;
  return requested && previewSkies.has(requested) ? requested : live;
}

export function AmbientTheme({ initialSky }: { initialSky: HallSky }) {
  useEffect(() => {
    document.body.dataset.habitatSky = initialSky;
    const apply = () => { document.body.dataset.habitatSky = currentSky(); };
    apply();
    const interval = window.setInterval(apply, 30_000);
    return () => window.clearInterval(interval);
  }, [initialSky]);

  return null;
}
