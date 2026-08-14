"use client";

import { useEffect, useRef } from "react";
import { getCollectibleVisual, type CollectibleIdentity } from "@/lib/collectible-art";
import { animateCollectibleModel, createCollectibleModel, disposeCollectibleModel, loadCollectibleAtlases } from "@/lib/collectible-three";

export function CollectibleCanvas({ item, interactive = false, className = "" }: { item: CollectibleIdentity; interactive?: boolean; className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    let disposed = false;
    let renderer: import("three").WebGLRenderer | null = null;
    let model: import("three").Group | null = null;
    let atlases: Awaited<ReturnType<typeof loadCollectibleAtlases>> | null = null;
    const drag = { active: false, x: 0, y: 0, velocityX: 0, velocityY: 0 };
    const rotation = { x: -0.06, y: -0.28 };
    let distance = interactive ? 5.2 : 5.7;
    let detach: (() => void) | undefined;

    const initialize = async () => {
      const THREE = await import("three");
      const loadedAtlases = await loadCollectibleAtlases(THREE, getCollectibleVisual(item).atlas);
      if (disposed) { Object.values(loadedAtlases).forEach((texture) => texture.dispose()); return; }
      atlases = loadedAtlases;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(interactive ? 32 : 38, 1, 0.1, 30);
      camera.position.set(0, 0, distance);
      const webgl = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: (navigator.hardwareConcurrency ?? 8) > 4, powerPreference: "high-performance" });
      renderer = webgl;
      webgl.setPixelRatio(Math.min(window.devicePixelRatio || 1, interactive ? 1.8 : 1.35));
      webgl.outputColorSpace = THREE.SRGBColorSpace;
      webgl.toneMapping = THREE.ACESFilmicToneMapping;
      webgl.toneMappingExposure = 1.26;
      webgl.shadowMap.enabled = interactive;
      webgl.shadowMap.type = THREE.PCFShadowMap;
      scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      scene.add(new THREE.HemisphereLight(0xf8e8c7, 0x18231d, 2.5));
      const key = new THREE.SpotLight(0xffd99f, interactive ? 50 : 38, 20, Math.PI / 4, 0.55, 1.3);
      key.position.set(-3.2, 4.5, 5.2);
      key.castShadow = interactive;
      scene.add(key);
      const rim = new THREE.PointLight(0x83c5d1, 22, 14);
      rim.position.set(3.4, 0.7, -2.2);
      scene.add(rim);
      const warm = new THREE.PointLight(0xd78648, 16, 12);
      warm.position.set(1.4, -2.8, 2.8);
      scene.add(warm);

      const collectible = createCollectibleModel(THREE, item, loadedAtlases);
      model = collectible;
      collectible.rotation.set(rotation.x, rotation.y, 0);
      collectible.scale.setScalar(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0.18);
      scene.add(collectible);

      if (interactive) {
        const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.32, 48), new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.34 }));
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = -1.2;
        shadow.receiveShadow = true;
        scene.add(shadow);
      }

      const resize = () => {
        const bounds = root.getBoundingClientRect();
        webgl.setSize(Math.max(1, bounds.width), Math.max(1, bounds.height), false);
        camera.aspect = bounds.width / Math.max(1, bounds.height);
        camera.updateProjectionMatrix();
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(root);
      resize();

      const pointerDown = (event: PointerEvent) => {
        if (!interactive) return;
        drag.active = true;
        drag.x = event.clientX;
        drag.y = event.clientY;
        drag.velocityX = 0;
        drag.velocityY = 0;
        root.setPointerCapture(event.pointerId);
        root.classList.add("is-dragging");
      };
      const pointerMove = (event: PointerEvent) => {
        if (!drag.active) return;
        const deltaX = event.clientX - drag.x;
        const deltaY = event.clientY - drag.y;
        drag.x = event.clientX;
        drag.y = event.clientY;
        drag.velocityX = deltaX * 0.012;
        drag.velocityY = deltaY * 0.009;
        rotation.y += drag.velocityX;
        rotation.x = Math.max(-1.1, Math.min(1.1, rotation.x + drag.velocityY));
      };
      const pointerUp = (event: PointerEvent) => {
        drag.active = false;
        if (root.hasPointerCapture(event.pointerId)) root.releasePointerCapture(event.pointerId);
        root.classList.remove("is-dragging");
      };
      const wheel = (event: WheelEvent) => {
        if (!interactive) return;
        event.preventDefault();
        distance = Math.max(3.5, Math.min(7.2, distance + event.deltaY * 0.004));
      };
      const keyDown = (event: KeyboardEvent) => {
        if (!interactive) return;
        if (event.key === "ArrowLeft") rotation.y -= 0.18;
        else if (event.key === "ArrowRight") rotation.y += 0.18;
        else if (event.key === "ArrowUp") rotation.x = Math.max(-1.1, rotation.x - 0.14);
        else if (event.key === "ArrowDown") rotation.x = Math.min(1.1, rotation.x + 0.14);
        else if (event.key === "+" || event.key === "=") distance = Math.max(3.5, distance - 0.35);
        else if (event.key === "-") distance = Math.min(7.2, distance + 0.35);
        else return;
        event.preventDefault();
      };
      root.addEventListener("pointerdown", pointerDown);
      root.addEventListener("pointermove", pointerMove);
      root.addEventListener("pointerup", pointerUp);
      root.addEventListener("pointercancel", pointerUp);
      root.addEventListener("wheel", wheel, { passive: false });
      root.addEventListener("keydown", keyDown);

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let previousFrame = performance.now();
      webgl.setAnimationLoop((time) => {
        if (disposed || !model) return;
        const delta = Math.min((time - previousFrame) / 1000, 0.05);
        previousFrame = time;
        model.scale.lerp(new THREE.Vector3(1, 1, 1), reduced ? 1 : 1 - Math.exp(-delta * 7));
        if (!drag.active) {
          drag.velocityX *= Math.exp(-delta * 3.2);
          drag.velocityY *= Math.exp(-delta * 3.2);
          rotation.y += drag.velocityX;
          rotation.x = Math.max(-1.1, Math.min(1.1, rotation.x + drag.velocityY));
          if (!interactive && !reduced) rotation.y += delta * 0.34;
        }
        model.rotation.x += (rotation.x - model.rotation.x) * Math.min(1, delta * 12);
        model.rotation.y += (rotation.y - model.rotation.y) * Math.min(1, delta * 12);
        animateCollectibleModel(model, time / 1000, reduced);
        camera.position.z += (distance - camera.position.z) * Math.min(1, delta * 9);
        camera.lookAt(0, 0, 0);
        webgl.render(scene, camera);
      });
      root.dataset.collectibleReady = "true";
      return () => {
        resizeObserver.disconnect();
        root.removeEventListener("pointerdown", pointerDown);
        root.removeEventListener("pointermove", pointerMove);
        root.removeEventListener("pointerup", pointerUp);
        root.removeEventListener("pointercancel", pointerUp);
        root.removeEventListener("wheel", wheel);
        root.removeEventListener("keydown", keyDown);
      };
    };

    void initialize().then((cleanup) => { if (disposed) cleanup?.(); else detach = cleanup; }).catch(() => { root.dataset.collectibleFallback = "true"; });
    return () => {
      disposed = true;
      detach?.();
      renderer?.setAnimationLoop(null);
      if (model) disposeCollectibleModel(model);
      if (atlases) Object.values(atlases).forEach((texture) => texture.dispose());
      renderer?.dispose();
    };
  }, [interactive, item]);

  return <div className={`collectible-canvas ${interactive ? "is-interactive" : ""} ${className}`} ref={rootRef} role={interactive ? "application" : "img"} aria-label={`${item.name}, interactive three-dimensional ${item.kind.toLowerCase()}`} tabIndex={interactive ? 0 : undefined}>
    <canvas ref={canvasRef} aria-hidden="true" />
    <span className="collectible-canvas-fallback" aria-hidden="true">{item.kind}</span>
  </div>;
}
