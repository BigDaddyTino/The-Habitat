"use client";

import { useEffect, useRef, useState } from "react";
import { Rotate3D, RotateCcw, X, ZoomIn } from "lucide-react";
import { rarityPresentation } from "@habitat/shared";
import { CollectibleCanvas } from "@/components/collectible-canvas";
import { getCollectibleVisual, type CollectibleIdentity } from "@/lib/collectible-art";

type InspectedCollectible = CollectibleIdentity & {
  description?: string | null;
};

export function CollectibleInspector({ item, onClose }: { item: InspectedCollectible; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [viewKey, setViewKey] = useState(0);
  const presentation = rarityPresentation[item.rarity];
  const visual = getCollectibleVisual(item);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const keyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", keyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", keyDown); };
  }, [onClose]);

  return <div className={`collectible-inspector rarity-${item.rarity.toLowerCase().replaceAll("_", "-")}`} role="dialog" aria-modal="true" aria-labelledby="collectible-inspector-title" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <div className="collectible-inspector-shell">
      <button className="collectible-inspector-close" ref={closeRef} onClick={onClose} type="button" aria-label="Close collectible inspector"><X aria-hidden="true" /></button>
      <div className="collectible-inspector-stage">
        <div className="collectible-inspector-halo" aria-hidden="true" />
        <CollectibleCanvas key={viewKey} item={item} interactive />
        <div className="collectible-inspector-controls" aria-hidden="true"><Rotate3D /> Drag to rotate <span /> Scroll to zoom <ZoomIn /></div>
      </div>
      <article className="collectible-inspector-copy">
        <p className="eyebrow">Verified {item.kind.toLowerCase()} · {presentation.label}</p>
        <h2 id="collectible-inspector-title">{item.name}</h2>
        <p>{item.description ?? `Unlocked by ${item.achievementName ?? "a verified Habitat achievement"}.`}</p>
        <blockquote>{visual.inscription}</blockquote>
        <dl>
          <div><dt>Earned through</dt><dd>{item.achievementName ?? "Verified achievement"}</dd></div>
          {item.unlockedAt ? <div><dt>Entered into the Chronicle</dt><dd>{new Date(item.unlockedAt).toLocaleDateString()}</dd></div> : null}
          <div><dt>Construction</dt><dd>Relief enamel · modeled reverse · hand-worn metal</dd></div>
        </dl>
        <button className="collectible-reset-view" type="button" onClick={() => setViewKey((key) => key + 1)}><RotateCcw aria-hidden="true" /> Reset view</button>
      </article>
    </div>
  </div>;
}
