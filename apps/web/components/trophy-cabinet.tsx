"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, Expand, Medal, Trophy } from "lucide-react";
import { rarityPresentation, type AchievementRarity } from "@habitat/shared";
import { CollectibleInspector } from "@/components/collectible-inspector";
import { RewardEmblem } from "@/components/reward-emblem";
import { createCollectibleModel, disposeCollectibleModel, loadCollectibleAtlases } from "@/lib/collectible-three";

export type CabinetItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  kind: "BADGE" | "MEDAL" | "TROPHY";
  rarity: AchievementRarity;
  achievementName: string;
  unlockedAt: string;
};

const kindIcon = { BADGE: BadgeCheck, MEDAL: Medal, TROPHY: Trophy } as const;

export function TrophyCabinet({ items, ownerName, compact = false }: { items: CabinetItem[]; ownerName: string; compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(items.length ? 0 : -1);
  const [inspected, setInspected] = useState<CabinetItem | null>(null);
  const displayedItems = useMemo(() => items.slice(0, 35), [items]);
  const selected = selectedIndex >= 0 ? displayedItems[selectedIndex] ?? null : null;
  const closeInspector = useCallback(() => setInspected(null), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    let disposed = false;
    let visible = true;
    let renderer: import("three").WebGLRenderer | null = null;
    let atlases: Awaited<ReturnType<typeof loadCollectibleAtlases>> | null = null;
    const geometries: import("three").BufferGeometry[] = [];
    const materials: import("three").Material[] = [];
    const models: import("three").Group[] = [];
    const pointer = { x: 0, y: 0 };

    const initialize = async () => {
      const THREE = await import("three");
      const loadedAtlases = await loadCollectibleAtlases(THREE);
      if (disposed) { Object.values(loadedAtlases).forEach((texture) => texture.dispose()); return; }
      atlases = loadedAtlases;
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x080a08, 0.045);
      const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 40);
      camera.position.set(-0.78, 0.08, 10.4);
      const webgl = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: (navigator.hardwareConcurrency ?? 8) > 4, powerPreference: "high-performance" });
      renderer = webgl;
      webgl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
      webgl.outputColorSpace = THREE.SRGBColorSpace;
      webgl.toneMapping = THREE.ACESFilmicToneMapping;
      webgl.toneMappingExposure = 1.06;
      scene.add(new THREE.HemisphereLight(0xf5d9a7, 0x111813, 1.85));
      const key = new THREE.SpotLight(0xffc875, 38, 20, Math.PI / 3.2, 0.6, 1.2);
      key.position.set(-2.7, 5.8, 5.6);
      scene.add(key);
      const rim = new THREE.PointLight(0x668fa0, 18, 15);
      rim.position.set(4.8, 1.8, 2.6);
      scene.add(rim);
      const ember = new THREE.PointLight(0xb85c2e, 12, 12);
      ember.position.set(-4, -2.5, 2);
      scene.add(ember);

      const columns = 7;
      const slotCount = Math.max(14, Math.min(35, Math.ceil(Math.max(displayedItems.length, 1) / columns) * columns));
      const rowCount = Math.ceil(slotCount / columns);
      for (let index = 0; index < slotCount; index += 1) {
        const row = Math.floor(index / columns);
        const column = index % columns;
        const x = -3.34 + column * 1.02;
        const y = rowCount === 4 ? 2.14 - row * 1.43 : 2.25 - row * (4.5 / Math.max(1, rowCount - 1));
        const item = displayedItems[index];
        if (!item) {
          const geometry = new THREE.RingGeometry(0.17, 0.195, 28);
          const material = new THREE.MeshBasicMaterial({ color: 0x8f7650, transparent: true, opacity: 0.11, side: THREE.DoubleSide });
          geometries.push(geometry); materials.push(material);
          const empty = new THREE.Mesh(geometry, material);
          empty.position.set(x, y, -0.28);
          scene.add(empty);
          continue;
        }
        const model = createCollectibleModel(THREE, item, loadedAtlases);
        model.position.set(x, y, 0.12);
        model.scale.setScalar(item.kind === "TROPHY" ? 0.51 : 0.46);
        model.rotation.y = (index % 3 - 1) * 0.12;
        model.userData.itemIndex = index;
        model.userData.baseY = y;
        model.traverse((child) => { child.userData.itemIndex = index; });
        models.push(model);
        scene.add(model);
      }

      const raycaster = new THREE.Raycaster();
      const rayPoint = new THREE.Vector2();
      const hitAt = (event: PointerEvent | MouseEvent) => {
        const bounds = canvas.getBoundingClientRect();
        rayPoint.set(((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 2 - 1, -(((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 2 - 1));
        raycaster.setFromCamera(rayPoint, camera);
        return raycaster.intersectObjects(models, true).find((entry) => typeof entry.object.userData.itemIndex === "number");
      };
      let renderStill: (() => void) | null = null;
      const resize = () => {
        const bounds = root.getBoundingClientRect();
        webgl.setSize(Math.max(1, bounds.width), Math.max(1, bounds.height), false);
        camera.aspect = bounds.width / Math.max(1, bounds.height);
        camera.updateProjectionMatrix();
        renderStill?.();
      };
      const move = (event: PointerEvent) => {
        const bounds = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 2 - 1;
        pointer.y = -(((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 2 - 1);
        const hit = hitAt(event);
        canvas.style.cursor = hit ? "zoom-in" : "default";
        if (hit) setSelectedIndex(hit.object.userData.itemIndex as number);
        renderStill?.();
      };
      const click = (event: MouseEvent) => {
        const hit = hitAt(event);
        if (!hit) return;
        const index = hit.object.userData.itemIndex as number;
        setSelectedIndex(index);
        const item = displayedItems[index];
        if (item) setInspected(item);
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(root);
      const intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry?.isIntersecting ?? true; }, { threshold: 0.03 });
      intersectionObserver.observe(root);
      canvas.addEventListener("pointermove", move);
      canvas.addEventListener("click", click);
      resize();
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const renderFrame = () => {
        camera.position.x += (-0.78 + pointer.x * 0.16 - camera.position.x) * 0.035;
        camera.position.y += (0.08 + pointer.y * 0.1 - camera.position.y) * 0.035;
        camera.lookAt(-0.35, 0, -0.12);
        webgl.render(scene, camera);
      };
      if (reduced) { renderStill = renderFrame; renderFrame(); }
      else webgl.setAnimationLoop((time) => {
        if (disposed || !visible) return;
        const elapsed = time / 1000;
        models.forEach((model, index) => {
          model.rotation.y += ((index % 3 - 1) * 0.12 + Math.sin(elapsed * 0.48 + index * 0.63) * 0.12 - model.rotation.y) * 0.04;
          model.position.y = (model.userData.baseY as number) + Math.sin(elapsed * 0.72 + index) * 0.014;
        });
        renderFrame();
      });
      root.dataset.cabinetReady = "true";
      return () => { resizeObserver.disconnect(); intersectionObserver.disconnect(); canvas.removeEventListener("pointermove", move); canvas.removeEventListener("click", click); };
    };

    let detach: (() => void) | undefined;
    void initialize().then((cleanup) => { if (disposed) cleanup?.(); else detach = cleanup; }).catch(() => { root.dataset.cabinetFallback = "true"; });
    return () => {
      disposed = true;
      detach?.();
      renderer?.setAnimationLoop(null);
      models.forEach(disposeCollectibleModel);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      if (atlases) Object.values(atlases).forEach((texture) => texture.dispose());
      renderer?.dispose();
    };
  }, [displayedItems]);

  return <section className={`trophy-cabinet-section ${compact ? "compact" : ""}`}>
    <div className="cabinet-heading"><div><p className="eyebrow">Living collection</p><h2>{ownerName}&apos;s trophy cupboard</h2><p>{items.length ? `${items.length} verified piece${items.length === 1 ? "" : "s"}, each physically modeled from the way it was earned. Select any piece to inspect every side.` : "The cupboard is built. The shelves are waiting for the first verified piece."}</p></div><strong>{items.length}<span>pieces</span></strong></div>
    <div className="trophy-cabinet-stage" ref={rootRef}>
      <canvas aria-label="Interactive three-dimensional trophy cupboard. Select a collectible below for an accessible inspection view." className="trophy-cabinet-canvas" ref={canvasRef} />
      <div className="cabinet-fallback" aria-hidden="true">{Array.from({ length: Math.max(14, Math.min(35, Math.ceil(Math.max(items.length, 1) / 7) * 7)) }, (_, index) => <i className={items[index] ? `filled rarity-${items[index].rarity.toLowerCase().replaceAll("_", "-")}` : ""} key={index} />)}</div>
      <div className="cabinet-inspection">
        {selected ? <><RewardEmblem rarity={selected.rarity} kind={selected.kind} code={selected.code} size="large" /><p className="eyebrow">{selected.kind} · {rarityPresentation[selected.rarity].label}</p><h3>{selected.name}</h3><p>{selected.description ?? `Unlocked by ${selected.achievementName}.`}</p><small>Unlocked by {selected.achievementName} · {new Date(selected.unlockedAt).toLocaleDateString()}</small><button type="button" onClick={() => setInspected(selected)}><Expand aria-hidden="true" /> Inspect in 3D</button></> : <><Trophy aria-hidden="true" /><p className="eyebrow">Empty cupboard</p><h3>Room for legends</h3><p>Verified medals, badges, and trophies will appear here automatically.</p></>}
      </div>
    </div>
    {items.length ? <div className="cabinet-index" aria-label="Trophy cupboard inventory">{items.map((item, index) => { const Icon = kindIcon[item.kind]; return <button aria-pressed={selectedIndex === index} key={item.id} onPointerEnter={() => setSelectedIndex(index)} onFocus={() => setSelectedIndex(index)} onClick={() => { setSelectedIndex(index); setInspected(item); }} type="button"><Icon aria-hidden="true" size={14} /><span>{item.name}</span><Expand aria-hidden="true" size={11} /></button>; })}</div> : null}
    {inspected ? <CollectibleInspector item={inspected} onClose={closeInspector} /> : null}
  </section>;
}
