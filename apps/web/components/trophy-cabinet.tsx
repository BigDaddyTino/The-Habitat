"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, Medal, Trophy } from "lucide-react";
import { rarityPresentation, type AchievementRarity } from "@habitat/shared";
import { RewardEmblem } from "@/components/reward-emblem";

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
  const selected = selectedIndex >= 0 ? items[selectedIndex] : null;
  const displayedItems = useMemo(() => items.slice(0, 24), [items]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    let disposed = false;
    let visible = true;
    let renderer: import("three").WebGLRenderer | null = null;
    const geometries: import("three").BufferGeometry[] = [];
    const materials: import("three").Material[] = [];
    const groups: import("three").Group[] = [];
    const pointer = { x: 0, y: 0 };

    const initialize = async () => {
      const THREE = await import("three");
      if (disposed) return;
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x090c0a, 0.08);
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
      camera.position.set(0, 0.15, 9.6);
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: (navigator.hardwareConcurrency ?? 8) > 4, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.55));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;

      scene.add(new THREE.AmbientLight(0xb7a983, 1.45));
      const key = new THREE.SpotLight(0xffce79, 28, 18, Math.PI / 4, 0.6, 1.4);
      key.position.set(-2.5, 5.5, 6);
      scene.add(key);
      const rim = new THREE.PointLight(0x768fa4, 12, 14);
      rim.position.set(4.5, 1.5, 3);
      scene.add(rim);

      const wood = new THREE.MeshStandardMaterial({ color: 0x251910, roughness: 0.62, metalness: 0.05 });
      const brass = new THREE.MeshStandardMaterial({ color: 0xa7894d, roughness: 0.3, metalness: 0.82 });
      materials.push(wood, brass);
      const addBox = (width: number, height: number, depth: number, x: number, y: number, z: number, material = wood) => {
        const geometry = new THREE.BoxGeometry(width, height, depth); geometries.push(geometry);
        const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); scene.add(mesh);
      };
      addBox(7.8, 5.45, 0.34, 0, 0, -0.75);
      addBox(8.2, 0.22, 0.82, 0, 2.78, -0.24, brass);
      addBox(8.2, 0.22, 0.82, 0, -2.78, -0.24, brass);
      addBox(0.22, 5.45, 0.82, -4.0, 0, -0.24, brass);
      addBox(0.22, 5.45, 0.82, 4.0, 0, -0.24, brass);
      [-1.78, 0, 1.78].forEach((y) => addBox(7.8, 0.16, 0.92, 0, y, -0.18));

      const slotCount = Math.max(12, Math.min(24, Math.ceil(Math.max(displayedItems.length, 1) / 6) * 6));
      for (let index = 0; index < slotCount; index += 1) {
        const row = Math.floor(index / 6);
        const column = index % 6;
        const x = -3.25 + column * 1.3;
        const y = 2.08 - row * 1.78;
        const item = displayedItems[index];
        if (!item) {
          const emptyGeometry = new THREE.RingGeometry(0.24, 0.27, 24); geometries.push(emptyGeometry);
          const emptyMaterial = new THREE.MeshBasicMaterial({ color: 0x6c6048, transparent: true, opacity: 0.13, side: THREE.DoubleSide }); materials.push(emptyMaterial);
          const empty = new THREE.Mesh(emptyGeometry, emptyMaterial); empty.position.set(x, y, -0.48); scene.add(empty); continue;
        }
        const group = new THREE.Group();
        group.position.set(x, y, 0.12);
        group.userData.itemIndex = index;
        group.userData.baseY = y;
        const color = new THREE.Color(rarityPresentation[item.rarity].color);
        const glow = new THREE.Color(rarityPresentation[item.rarity].glow);
        const face = new THREE.MeshStandardMaterial({ color, emissive: glow, emissiveIntensity: item.rarity === "LEGENDARY" || item.rarity === "QUESTIONABLE_LIFE_CHOICE" ? 0.34 : 0.12, metalness: 0.72, roughness: 0.26 });
        const dark = new THREE.MeshStandardMaterial({ color: 0x171c18, metalness: 0.48, roughness: 0.4 });
        materials.push(face, dark);
        if (item.kind === "TROPHY") {
          const baseGeometry = new THREE.CylinderGeometry(0.38, 0.45, 0.18, 20); geometries.push(baseGeometry);
          const base = new THREE.Mesh(baseGeometry, dark); base.position.y = -0.43; group.add(base);
          const stemGeometry = new THREE.CylinderGeometry(0.07, 0.1, 0.48, 16); geometries.push(stemGeometry);
          const stem = new THREE.Mesh(stemGeometry, face); stem.position.y = -0.15; group.add(stem);
          const cupGeometry = new THREE.SphereGeometry(0.34, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62); geometries.push(cupGeometry);
          const cup = new THREE.Mesh(cupGeometry, face); cup.scale.y = 0.72; cup.position.y = 0.32; cup.rotation.x = Math.PI; group.add(cup);
          const crownGeometry = new THREE.TorusGeometry(0.29, 0.045, 10, 28); geometries.push(crownGeometry);
          const crown = new THREE.Mesh(crownGeometry, face); crown.position.y = 0.36; group.add(crown);
        } else {
          const sides = item.kind === "BADGE" ? 6 : 32;
          const discGeometry = new THREE.CylinderGeometry(0.34, 0.34, 0.11, sides); geometries.push(discGeometry);
          const disc = new THREE.Mesh(discGeometry, face); disc.rotation.x = Math.PI / 2; group.add(disc);
          const insetGeometry = new THREE.TorusGeometry(0.22, 0.025, 8, sides); geometries.push(insetGeometry);
          group.add(new THREE.Mesh(insetGeometry, dark));
          if (item.kind === "MEDAL") {
            const ribbonGeometry = new THREE.ConeGeometry(0.2, 0.48, 3); geometries.push(ribbonGeometry);
            const ribbon = new THREE.Mesh(ribbonGeometry, dark); ribbon.position.y = 0.45; ribbon.rotation.z = Math.PI; group.add(ribbon);
          }
        }
        group.traverse((child) => { child.userData.itemIndex = index; });
        groups.push(group); scene.add(group);
      }

      const raycaster = new THREE.Raycaster();
      const rayPoint = new THREE.Vector2();
      // Under prefers-reduced-motion we render single still frames instead of running the loop.
      let renderStill: (() => void) | null = null;
      const resize = () => {
        if (!renderer) return;
        const bounds = root.getBoundingClientRect();
        renderer.setSize(Math.max(1, bounds.width), Math.max(1, bounds.height), false);
        camera.aspect = bounds.width / Math.max(1, bounds.height);
        camera.updateProjectionMatrix();
        renderStill?.();
      };
      const move = (event: PointerEvent) => {
        const bounds = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 2 - 1;
        pointer.y = -(((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 2 - 1);
        rayPoint.set(pointer.x, pointer.y); raycaster.setFromCamera(rayPoint, camera);
        const hit = raycaster.intersectObjects(groups, true).find((entry) => typeof entry.object.userData.itemIndex === "number");
        canvas.style.cursor = hit ? "pointer" : "default";
        if (hit) setSelectedIndex(hit.object.userData.itemIndex as number);
        renderStill?.();
      };
      const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(root); resize();
      const intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry?.isIntersecting ?? true; }, { threshold: 0.03 }); intersectionObserver.observe(root);
      canvas.addEventListener("pointermove", move);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const clock = new THREE.Clock();
      if (reduced) {
        renderStill = () => {
          if (!renderer || disposed) return;
          camera.position.set(pointer.x * 0.22, 0.15 + pointer.y * 0.13, 9.6);
          camera.lookAt(0, 0, -0.2);
          renderer.render(scene, camera);
        };
        renderStill();
      } else {
        renderer.setAnimationLoop(() => {
          if (!renderer || disposed || !visible) return;
          const elapsed = clock.getElapsedTime();
          camera.position.x += (pointer.x * 0.22 - camera.position.x) * 0.035;
          camera.position.y += (0.15 + pointer.y * 0.13 - camera.position.y) * 0.035;
          camera.lookAt(0, 0, -0.2);
          groups.forEach((group, index) => {
            group.rotation.y = Math.sin(elapsed * 0.55 + index * 0.7) * 0.12;
            group.position.y = (group.userData.baseY as number) + Math.sin(elapsed * 0.8 + index) * 0.018;
          });
          renderer.render(scene, camera);
        });
      }
      root.setAttribute("data-cabinet-ready", "true");
      return () => { resizeObserver.disconnect(); intersectionObserver.disconnect(); canvas.removeEventListener("pointermove", move); };
    };
    let detach: (() => void) | undefined;
    void initialize().then((value) => {
      // If the effect was cleaned up while initialize() was still resolving, run the
      // returned teardown immediately so observers and listeners are never leaked.
      if (disposed) value?.(); else detach = value;
    }).catch(() => root.setAttribute("data-cabinet-fallback", "true"));
    return () => { disposed = true; detach?.(); renderer?.setAnimationLoop(null); geometries.forEach((value) => value.dispose()); materials.forEach((value) => value.dispose()); renderer?.dispose(); };
  }, [displayedItems]);

  return <section className={`trophy-cabinet-section ${compact ? "compact" : ""}`}>
    <div className="cabinet-heading"><div><p className="eyebrow">Living collection</p><h2>{ownerName}&apos;s trophy cabinet</h2><p>{items.length ? `${items.length} verified piece${items.length === 1 ? "" : "s"} collected. Every object is tied to an earned achievement.` : "The cabinet is built. The shelves are waiting for the first verified piece."}</p></div><strong>{items.length}<span>pieces</span></strong></div>
    <div className="trophy-cabinet-stage" ref={rootRef}>
      <canvas aria-hidden="true" className="trophy-cabinet-canvas" ref={canvasRef} />
      <div className="cabinet-fallback" aria-hidden="true">{Array.from({ length: Math.max(12, Math.min(24, Math.ceil(Math.max(items.length, 1) / 6) * 6)) }, (_, index) => <i className={items[index] ? `filled rarity-${items[index].rarity.toLowerCase().replaceAll("_", "-")}` : ""} key={index} />)}</div>
      <div className="cabinet-inspection">
        {selected ? <><RewardEmblem rarity={selected.rarity} kind={selected.kind} size="large" /><p className="eyebrow">{selected.kind} · {rarityPresentation[selected.rarity].label}</p><h3>{selected.name}</h3><p>{selected.description ?? `Unlocked by ${selected.achievementName}.`}</p><small>Unlocked by {selected.achievementName} · {new Date(selected.unlockedAt).toLocaleDateString()}</small></> : <><Trophy aria-hidden="true" /><p className="eyebrow">Empty cabinet</p><h3>Room for legends</h3><p>Verified medals, badges, and trophies will appear here automatically.</p></>}
      </div>
    </div>
    {items.length ? <div className="cabinet-index" aria-label="Trophy cabinet inventory">{items.map((item, index) => { const Icon = kindIcon[item.kind]; return <button aria-pressed={selectedIndex === index} key={item.id} onClick={() => setSelectedIndex(index)} type="button"><Icon aria-hidden="true" size={14} /><span>{item.name}</span></button>; })}</div> : null}
  </section>;
}
