"use client";

import { useEffect, useRef } from "react";
import { Crown, Sparkles, Trophy, Zap } from "lucide-react";
import { rarityPresentation } from "@habitat/shared";
import type { Artboard, File as RiveFile, StateMachineInstance, WrappedRenderer } from "@rive-app/canvas-advanced-single";
import type { BufferAttribute } from "three";
import type { RewardCeremonyDetail } from "@/lib/reward-events";
import { RewardEmblem } from "@/components/reward-emblem";
import { CollectibleCanvas } from "@/components/collectible-canvas";
import type { PhysicalRewardKind } from "@/lib/collectible-art";

export function RewardCeremony({ toast, leaving = false }: { toast: RewardCeremonyDetail; leaving?: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);
  const riveCanvasRef = useRef<HTMLCanvasElement>(null);
  const presentation = rarityPresentation[toast.rarity];
  const headline = toast.preview ? "Cinematic visual preview" : toast.kind === "achievement" ? `${presentation.label} achievement` : toast.kind === "level" ? "Habitat level increased" : toast.kind === "world" ? `${presentation.label} live event` : "Verified XP recorded";

  useEffect(() => {
    const root = rootRef.current;
    const threeCanvas = threeCanvasRef.current;
    const riveCanvas = riveCanvasRef.current;
    if (!root || !threeCanvas || !riveCanvas) return;
    let disposed = false;
    let threeRenderer: import("three").WebGLRenderer | null = null;
    let riveFile: RiveFile | null = null;
    let riveArtboard: Artboard | null = null;
    let riveStateMachine: StateMachineInstance | null = null;
    let riveRenderer: WrappedRenderer | null = null;
    const geometries: import("three").BufferGeometry[] = [];
    const materials: import("three").Material[] = [];

    const initialize = async () => {
      const [THREE, riveModule, response] = await Promise.all([
        import("three"),
        import("@rive-app/canvas-advanced-single"),
        fetch("/rive/habitat-vista-control.riv", { cache: "force-cache" }),
      ]);
      if (disposed) return;
      const runtime = await riveModule.default();
      if (!response.ok) throw new Error(`Reward Rive asset unavailable (${response.status})`);
      const file = await runtime.load(new Uint8Array(await response.arrayBuffer()));
      if (disposed) { file.unref(); return; }
      const artboard = file.defaultArtboard();
      const machineDefinition = artboard.stateMachineByName("State Machine 1") ?? artboard.stateMachineByIndex(0);
      const machine = new runtime.StateMachineInstance(machineDefinition, artboard);
      const riveRenderContext = runtime.makeRenderer(riveCanvas);
      riveFile = file; riveArtboard = artboard; riveStateMachine = machine; riveRenderer = riveRenderContext;
      const riveBounds = riveCanvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      riveCanvas.width = Math.max(1, Math.round(riveBounds.width * ratio));
      riveCanvas.height = Math.max(1, Math.round(riveBounds.height * ratio));
      artboard.devicePixelRatioUsed = ratio;
      const artboardBounds = artboard.bounds;
      const centerX = (artboardBounds.minX + artboardBounds.maxX) / 2;
      const centerY = (artboardBounds.minY + artboardBounds.maxY) / 2;
      machine.pointerMove(centerX, centerY, 1); machine.pointerDown(centerX, centerY, 1); machine.pointerUp(centerX, centerY, 1);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
      camera.position.set(0, 0, 8);
      const renderer = new THREE.WebGLRenderer({ canvas: threeCanvas, alpha: true, antialias: (navigator.hardwareConcurrency ?? 8) > 4, powerPreference: "high-performance" });
      threeRenderer = renderer;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      const light = new THREE.PointLight(new THREE.Color(presentation.color), 34, 20); light.position.set(2.5, 2, 5); scene.add(light);

      const ceremonyColor = new THREE.Color(presentation.color);
      const glowColor = new THREE.Color(presentation.glow);
      const highTier = presentation.ceremony === "legendary" || presentation.ceremony === "storm";
      const particleCount = highTier ? 110 : presentation.ceremony === "flare" ? 64 : 34;
      const positions = new Float32Array(particleCount * 3);
      const velocities = new Float32Array(particleCount * 3);
      for (let index = 0; index < particleCount; index += 1) {
        const angle = (index / particleCount) * Math.PI * 2 + Math.random() * 0.22;
        const radius = Math.random() * 0.28;
        positions[index * 3] = Math.cos(angle) * radius;
        positions[index * 3 + 1] = Math.sin(angle) * radius;
        positions[index * 3 + 2] = Math.random() * 0.5;
        const speed = 0.18 + Math.random() * (highTier ? 0.8 : 0.45);
        velocities[index * 3] = Math.cos(angle) * speed;
        velocities[index * 3 + 1] = Math.sin(angle) * speed + 0.08;
        velocities[index * 3 + 2] = (Math.random() - 0.5) * 0.32;
      }
      const particleGeometry = new THREE.BufferGeometry(); particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3)); geometries.push(particleGeometry);
      const particleMaterial = new THREE.PointsMaterial({ color: ceremonyColor, size: highTier ? 0.09 : 0.065, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending, depthWrite: false }); materials.push(particleMaterial);
      const particles = new THREE.Points(particleGeometry, particleMaterial); particles.position.set(2.8, -1.55, 0); scene.add(particles);

      const ringGeometry = new THREE.TorusGeometry(highTier ? 0.82 : 0.62, 0.035, 12, 72); geometries.push(ringGeometry);
      const ringMaterial = new THREE.MeshStandardMaterial({ color: ceremonyColor, emissive: glowColor, emissiveIntensity: 1.2, metalness: 0.72, roughness: 0.22, transparent: true, opacity: 0.88 }); materials.push(ringMaterial);
      const ring = new THREE.Mesh(ringGeometry, ringMaterial); ring.position.set(2.8, -1.55, 0); scene.add(ring);
      const coreGeometry = new THREE.OctahedronGeometry(highTier ? 0.33 : 0.24, 1); geometries.push(coreGeometry);
      const coreMaterial = new THREE.MeshStandardMaterial({ color: ceremonyColor, emissive: glowColor, emissiveIntensity: highTier ? 1.1 : 0.55, metalness: 0.82, roughness: 0.18 }); materials.push(coreMaterial);
      const core = new THREE.Mesh(coreGeometry, coreMaterial); core.position.copy(ring.position); scene.add(core);

      const resize = () => {
        if (!threeRenderer) return;
        threeRenderer.setSize(window.innerWidth, window.innerHeight, false);
        camera.aspect = window.innerWidth / Math.max(1, window.innerHeight); camera.updateProjectionMatrix();
        const mobile = window.innerWidth < 700;
        particles.position.set(mobile ? -0.95 : 2.8, mobile ? -2.36 : -1.55, 0);
        particles.scale.setScalar(mobile ? 0.68 : 1);
        ring.scale.setScalar(mobile ? 0.62 : 1);
        core.scale.setScalar(mobile ? 0.68 : 1);
        ring.position.copy(particles.position); core.position.copy(particles.position);
      };
      resize(); window.addEventListener("resize", resize);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let lastTime = performance.now();
      const frame = (time: number) => {
        if (!threeRenderer || disposed) return;
        const delta = Math.min(0.05, (time - lastTime) / 1000); lastTime = time;
        const positionAttribute = particleGeometry.getAttribute("position") as BufferAttribute;
        for (let index = 0; index < particleCount; index += 1) {
          const x = index * 3;
          positions[x] += velocities[x] * delta;
          positions[x + 1] += velocities[x + 1] * delta;
          positions[x + 2] += velocities[x + 2] * delta;
          velocities[x + 1] -= 0.065 * delta;
        }
        positionAttribute.needsUpdate = true;
        particleMaterial.opacity = Math.max(0.12, particleMaterial.opacity - delta * 0.055);
        ring.rotation.z += delta * (highTier ? 0.72 : 0.42); ring.rotation.x = Math.sin(time * 0.0008) * 0.18;
        core.rotation.x += delta * 0.7; core.rotation.y += delta * 1.1;

        machine.advanceAndApply(delta * (highTier ? 1.25 : 1)); artboard.advance(delta);
        riveRenderContext.clear(); riveRenderContext.save();
        riveRenderContext.align(runtime.Fit.contain, runtime.Alignment.center, { minX: 0, minY: 0, maxX: riveCanvas.width, maxY: riveCanvas.height }, artboard.bounds);
        artboard.draw(riveRenderContext); riveRenderContext.restore(); runtime.resolveAnimationFrame();
        threeRenderer.render(scene, camera);
      };
      root.setAttribute("data-ceremony-ready", "true");
      if (reduced) frame(performance.now() + 16); else renderer.setAnimationLoop(frame);
      return () => window.removeEventListener("resize", resize);
    };

    let detach: (() => void) | undefined;
    void initialize().then((value) => {
      // If the effect was cleaned up while initialize() was still resolving, run the
      // returned teardown immediately so the resize listener is never leaked.
      if (disposed) value?.(); else detach = value;
    }).catch(() => root.setAttribute("data-ceremony-fallback", "true"));
    return () => {
      disposed = true; detach?.(); threeRenderer?.setAnimationLoop(null);
      riveStateMachine?.delete(); riveArtboard?.delete(); riveRenderer?.delete(); riveFile?.unref();
      geometries.forEach((value) => value.dispose()); materials.forEach((value) => value.dispose()); threeRenderer?.dispose();
    };
  }, [presentation.ceremony, presentation.color, presentation.glow, toast.id]);

  const physicalReward = toast.rewards?.find((reward): reward is typeof reward & { kind: PhysicalRewardKind } => reward.kind === "TROPHY" || reward.kind === "MEDAL" || reward.kind === "BADGE");
  const emblemKind = physicalReward?.kind ?? "BADGE";
  return <aside className={`reward-ceremony kind-${toast.kind} rarity-${toast.rarity.toLowerCase().replaceAll("_", "-")}${toast.preview ? " is-preview" : ""}${leaving ? " is-leaving" : ""}`} ref={rootRef} aria-live={toast.preview ? "off" : presentation.ceremony === "legendary" ? "assertive" : "polite"}>
    <canvas className="reward-three-canvas" ref={threeCanvasRef} aria-hidden="true" />
    <div className="reward-toast-card">
      <i className="reward-toast-scan" aria-hidden="true" />
      <div className="reward-toast-sigil"><canvas className="reward-rive-canvas" ref={riveCanvasRef} aria-hidden="true" />{physicalReward ? <CollectibleCanvas item={{ code: physicalReward.code ?? `unclassified-${physicalReward.kind.toLowerCase()}`, name: physicalReward.name, kind: physicalReward.kind, rarity: toast.rarity, achievementName: toast.title }} className="reward-toast-collectible" /> : <RewardEmblem rarity={toast.rarity} kind={emblemKind} size="large" />}</div>
      <div className="reward-toast-copy"><p className="eyebrow">{headline}</p><strong>{toast.title}</strong><span>{toast.detail}</span>{toast.points ? <small>+{toast.points} achievement points</small> : null}</div>
      <div className="reward-toast-loot">{toast.rewards?.length ? toast.rewards.slice(0, 3).map((reward) => <span key={`${reward.kind}-${reward.name}`}><Trophy aria-hidden="true" size={12} />{reward.name}</span>) : toast.kind === "level" ? <span><Crown aria-hidden="true" size={12} />Milestone reached</span> : toast.kind === "xp" ? <span><Zap aria-hidden="true" size={12} />Verified progress</span> : toast.kind === "world" ? <span><Sparkles aria-hidden="true" size={12} />Verified Chronicle event</span> : <span><Sparkles aria-hidden="true" size={12} />Archive updated</span>}</div>
    </div>
  </aside>;
}
