"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { AchievementRarity, AchievementRewardKind } from "@habitat/shared";
import type { BufferGeometry, Group, Material, PerspectiveCamera, Points, Scene, Texture, WebGLRenderer } from "three";
import { getGreatHallAtmosphere, type GreatHallAtmosphere } from "@/lib/hall-atmosphere";
import { previewReward } from "@/lib/reward-events";

const SKY_IMAGE: Record<GreatHallAtmosphere["sky"], string> = {
  sunrise: "/images/habitat-lodge-sunrise.webp",
  midday: "/images/habitat-lodge-midday.webp",
  sunset: "/images/habitat-lodge-sunset.webp",
  night: "/images/habitat-lodge.webp",
};

const SKY_PARTICLE_COLOR: Record<GreatHallAtmosphere["sky"], number> = {
  sunrise: 0xf5bb72,
  midday: 0xd8f0e9,
  sunset: 0xf3a45f,
  night: 0xbfd4ff,
};

const RAVEN_PLATES = ["one", "two", "three", "four", "five"] as const;

type NetworkInformation = { saveData?: boolean };
const hallPreviewEncounters = new Set<GreatHallAtmosphere["encounter"]>(["birds", "bear", "ufo", "comet", "aurora", "fireflies", "eclipse", "blood-moon", "lightning", "storm"]);
const hallPreviewSkies = new Set<GreatHallAtmosphere["sky"]>(["sunrise", "midday", "sunset", "night"]);
const hallPreviewProgress: Record<Exclude<GreatHallAtmosphere["encounter"], "none">, number> = {
  birds: 0.42,
  bear: 0.5,
  ufo: 0.48,
  comet: 0.5,
  aurora: 0.5,
  fireflies: 0.5,
  eclipse: 0.5,
  "blood-moon": 0.5,
  lightning: 0.63,
  storm: 0.5,
};
type BearResponse = {
  awarded: boolean;
  alreadyEarned: boolean;
  achievement: {
    awardId: string;
    name: string;
    description: string;
    rarity: AchievementRarity;
    category: string;
    points: number;
    rewards: Array<{ kind: AchievementRewardKind; code?: string; name: string }>;
  };
};

function playBearRoar() {
  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) return;
  const context = new AudioContextConstructor();
  const now = context.currentTime;
  const master = context.createGain();
  const filter = context.createBiquadFilter();
  const oscillator = context.createOscillator();
  const oscillatorGain = context.createGain();
  const noise = context.createBuffer(1, Math.ceil(context.sampleRate * 1.7), context.sampleRate);
  const noiseData = noise.getChannelData(0);
  for (let index = 0; index < noiseData.length; index += 1) noiseData[index] = Math.random() * 2 - 1;
  const noiseSource = context.createBufferSource();

  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.42, now + 0.08);
  master.gain.exponentialRampToValueAtTime(0.12, now + 1.15);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(480, now);
  filter.frequency.exponentialRampToValueAtTime(110, now + 1.6);
  filter.Q.value = 2.4;
  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(68, now);
  oscillator.frequency.exponentialRampToValueAtTime(34, now + 1.55);
  oscillatorGain.gain.value = 0.36;
  noiseSource.buffer = noise;
  noiseSource.connect(filter);
  oscillator.connect(oscillatorGain).connect(filter);
  filter.connect(master).connect(context.destination);
  oscillator.start(now);
  noiseSource.start(now);
  oscillator.stop(now + 1.7);
  noiseSource.stop(now + 1.7);
  window.setTimeout(() => { void context.close(); }, 2_000);
}

export function HallAtmosphere(initial: GreatHallAtmosphere) {
  const atmosphereRef = useRef<HTMLDivElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);
  const claimedBearRef = useRef<string | null>(null);
  const atmosphereSynchronizedRef = useRef(false);
  const [atmosphere, setAtmosphere] = useState(initial);
  const [bearFeedback, setBearFeedback] = useState<{ key: string | null; status: "roaring" | "awarded" | "remembered" | "signed-out" | "missed" } | null>(null);
  const bearState = bearFeedback?.key === atmosphere.encounterKey ? bearFeedback.status : "idle";

  useEffect(() => {
    const tick = () => {
      const next = getGreatHallAtmosphere();
      const preview = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)
        ? new URLSearchParams(window.location.search).get("hallPreview") as GreatHallAtmosphere["encounter"] | null
        : null;
      if (preview && hallPreviewEncounters.has(preview)) {
        const previewEncounter = preview as Exclude<GreatHallAtmosphere["encounter"], "none">;
        const requestedSky = new URLSearchParams(window.location.search).get("hallSky") as GreatHallAtmosphere["sky"] | null;
        const sky = requestedSky && hallPreviewSkies.has(requestedSky) ? requestedSky : next.sky;
        setAtmosphere({ ...next, sky, encounter: previewEncounter, encounterKey: `visual-preview:${sky}:${previewEncounter}`, encounterDurationSeconds: 45, encounterProgress: hallPreviewProgress[previewEncounter] });
        return;
      }
      setAtmosphere((current) => {
        if (!atmosphereSynchronizedRef.current) {
          atmosphereSynchronizedRef.current = true;
          return next;
        }
        return current.sky === next.sky && current.encounterKey === next.encounterKey ? current : next;
      });
    };
    tick();
    const interval = window.setInterval(tick, 1_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const root = atmosphereRef.current;
    const canvas = threeCanvasRef.current;
    const hero = root?.closest<HTMLElement>(".hall-hero");
    if (!root || !canvas || !hero) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    const conservativeMode = Boolean(connection?.saveData) || (navigator.hardwareConcurrency ?? 8) <= 4;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let disposed = false;
    let visible = true;
    let lastFrame = performance.now();
    let ready = false;
    let renderer: WebGLRenderer | null = null;
    let scene: Scene | null = null;
    let camera: PerspectiveCamera | null = null;
    let particleField: Points | null = null;
    let fogGroup: Group | null = null;
    let imageTexture: Texture | null = null;
    let frameLoop: ((time: number) => void) | null = null;
    const geometries: BufferGeometry[] = [];
    const materials: Material[] = [];

    const resize = () => {
      if (!renderer || !camera) return;
      const bounds = hero.getBoundingClientRect();
      renderer.setSize(Math.max(1, bounds.width), Math.max(1, bounds.height), false);
      camera.aspect = bounds.width / Math.max(1, bounds.height);
      camera.updateProjectionMatrix();
    };
    const move = (event: PointerEvent) => {
      const bounds = hero.getBoundingClientRect();
      pointer.targetX = Math.min(1, Math.max(-1, ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 2 - 1));
      pointer.targetY = Math.min(1, Math.max(-1, -(((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 2 - 1)));
      hero.style.setProperty("--hall-x", String(pointer.targetX * 0.5));
      hero.style.setProperty("--hall-y", String(pointer.targetY * -0.5));
    };
    const leave = () => {
      pointer.targetX = 0;
      pointer.targetY = 0;
      hero.style.setProperty("--hall-x", "0");
      hero.style.setProperty("--hall-y", "0");
    };
    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (renderer && frameLoop) renderer.setAnimationLoop(visible && !reducedMotion.matches ? frameLoop : null);
    }, { threshold: 0.02 });

    const initialize = async () => {
      const THREE = await import("three");
      if (disposed) return;
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !conservativeMode, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, conservativeMode ? 1.1 : 1.65));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = atmosphere.sky === "night" ? 0.82 : 0.96;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
      camera.position.set(0, 0, 4.97);

      const image = await new THREE.TextureLoader().loadAsync(SKY_IMAGE[atmosphere.sky]);
      if (disposed) { image.dispose(); return; }
      imageTexture = image;
      image.colorSpace = THREE.SRGBColorSpace;
      image.minFilter = THREE.LinearFilter;
      const imageElement = image.image as HTMLImageElement;
      const heroGeometry = new THREE.PlaneGeometry(2, 2);
      geometries.push(heroGeometry);
      const heroMaterial = new THREE.ShaderMaterial({
        depthWrite: false,
        uniforms: {
          uTexture: { value: image }, uTime: { value: 0 }, uPointer: { value: new THREE.Vector2() },
          uResolution: { value: new THREE.Vector2(1, 1) },
          uImageResolution: { value: new THREE.Vector2(imageElement.naturalWidth || imageElement.width || 1536, imageElement.naturalHeight || imageElement.height || 1024) },
          uNight: { value: atmosphere.sky === "night" ? 1 : 0 },
        },
        vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.0);}`,
        fragmentShader: `
          precision highp float; uniform sampler2D uTexture; uniform float uTime; uniform float uNight;
          uniform vec2 uPointer; uniform vec2 uResolution; uniform vec2 uImageResolution; varying vec2 vUv;
          float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
          void main(){
            vec2 uv=vUv; float viewportAspect=uResolution.x/max(1.0,uResolution.y); float imageAspect=uImageResolution.x/max(1.0,uImageResolution.y);
            if(viewportAspect>imageAspect){uv.y=(uv.y-.5)*(imageAspect/viewportAspect)+.5;}else{uv.x=(uv.x-.5)*(viewportAspect/imageAspect)+.5;}
            float depthMask=smoothstep(.05,.92,uv.y); uv+=vec2(uPointer.x,-uPointer.y)*mix(.003,.011,depthMask);
            vec3 color=texture2D(uTexture,clamp(uv,.001,.999)).rgb; float luma=dot(color,vec3(.2126,.7152,.0722));
            color=mix(vec3(luma),color,1.065); color*=1.025; color+=vec3(.018,.011,.004)*sin(uTime*.22+uv.x*4.0);
            color+=(hash(gl_FragCoord.xy+floor(uTime*12.0))-.5)*mix(.018,.011,uNight);
            vec2 vignetteUv=vUv*(1.0-vUv.yx); float vignette=pow(clamp(vignetteUv.x*vignetteUv.y*19.0,0.0,1.0),.22);
            color*=mix(.52,1.0,vignette); gl_FragColor=vec4(color,1.0);
          }`,
      });
      materials.push(heroMaterial);
      scene.add(new THREE.Mesh(heroGeometry, heroMaterial));

      const count = conservativeMode ? 28 : 58;
      const positions = new Float32Array(count * 3);
      for (let index = 0; index < count; index += 1) {
        positions[index * 3] = THREE.MathUtils.randFloat(-4.6, 4.6);
        positions[index * 3 + 1] = THREE.MathUtils.randFloat(-2.15, 2.4);
        positions[index * 3 + 2] = THREE.MathUtils.randFloat(0.35, 1.35);
      }
      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometries.push(particleGeometry);
      const particleMaterial = new THREE.PointsMaterial({ color: SKY_PARTICLE_COLOR[atmosphere.sky], size: conservativeMode ? 0.018 : 0.026, transparent: true, opacity: atmosphere.sky === "night" ? 0.54 : 0.25, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
      materials.push(particleMaterial);
      particleField = new THREE.Points(particleGeometry, particleMaterial);
      scene.add(particleField);

      fogGroup = new THREE.Group();
      const fogGeometry = new THREE.PlaneGeometry(3.5, 0.72);
      geometries.push(fogGeometry);
      for (let index = 0; index < (conservativeMode ? 1 : 3); index += 1) {
        const fogMaterial = new THREE.MeshBasicMaterial({ color: atmosphere.sky === "sunset" || atmosphere.sky === "sunrise" ? 0xc89568 : 0x9aaca3, transparent: true, opacity: 0.025 + index * 0.012, blending: THREE.AdditiveBlending, depthWrite: false });
        materials.push(fogMaterial);
        const fog = new THREE.Mesh(fogGeometry, fogMaterial);
        fog.position.set(-3.8 + index * 3.1, -0.35 + index * 0.28, 0.42 + index * 0.06);
        fog.scale.set(1.45 + index * 0.22, 1, 1);
        fogGroup.add(fog);
      }
      scene.add(fogGroup);

      const frame = (time: number) => {
        if (disposed || !renderer || !scene || !camera) return;
        const delta = Math.min(0.05, Math.max(0.001, (time - lastFrame) / 1_000));
        lastFrame = time;
        pointer.x += (pointer.targetX - pointer.x) * Math.min(1, delta * 4.6);
        pointer.y += (pointer.targetY - pointer.y) * Math.min(1, delta * 4.6);
        camera.position.x += (pointer.x * 0.055 - camera.position.x) * Math.min(1, delta * 2.4);
        camera.position.y += (pointer.y * 0.032 - camera.position.y) * Math.min(1, delta * 2.4);
        camera.lookAt(0, 0, 0);
        heroMaterial.uniforms.uTime.value = time / 1_000;
        heroMaterial.uniforms.uPointer.value.set(pointer.x, pointer.y);
        heroMaterial.uniforms.uResolution.value.set(canvas.clientWidth, canvas.clientHeight);
        if (particleField) { particleField.rotation.z = Math.sin(time * 0.00008) * 0.018; particleField.position.setX(pointer.x * -0.07); }
        if (fogGroup) { fogGroup.position.x = ((time * 0.000035) % 3.1) - 1.55; fogGroup.position.y = pointer.y * -0.035; }
        renderer.render(scene, camera);
      };
      frameLoop = frame;
      resize();
      ready = true;
      root.setAttribute("data-three-ready", "true");
      if (reducedMotion.matches) frame(performance.now()); else if (visible) renderer.setAnimationLoop(frame);
    };

    const onContextLost = (event: Event) => { event.preventDefault(); root.removeAttribute("data-three-ready"); };
    const onContextRestored = () => { if (ready) root.setAttribute("data-three-ready", "true"); };
    const onMotionPreference = () => {
      if (!renderer || !frameLoop) return;
      renderer.setAnimationLoop(reducedMotion.matches || !visible ? null : frameLoop);
      if (reducedMotion.matches) frameLoop(performance.now());
    };
    hero.addEventListener("pointermove", move);
    hero.addEventListener("pointerleave", leave);
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    reducedMotion.addEventListener("change", onMotionPreference);
    resizeObserver.observe(hero);
    intersectionObserver.observe(hero);
    void initialize().catch((error: unknown) => {
      console.warn("The Great Hall WebGL scene fell back to its cinematic image.", error);
      root.setAttribute("data-three-fallback", "true");
    });
    return () => {
      disposed = true;
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      reducedMotion.removeEventListener("change", onMotionPreference);
      resizeObserver.disconnect(); intersectionObserver.disconnect(); renderer?.setAnimationLoop(null);
      imageTexture?.dispose(); geometries.forEach((geometry) => geometry.dispose()); materials.forEach((material) => material.dispose()); renderer?.dispose();
      hero.style.removeProperty("--hall-x"); hero.style.removeProperty("--hall-y");
    };
  }, [atmosphere.sky]);

  const meetTheBear = async () => {
    const key = atmosphere.encounterKey;
    if (!key) return;
    playBearRoar();
    setBearFeedback({ key, status: "roaring" });
    if (claimedBearRef.current === key) return;
    claimedBearRef.current = key;
    const response = await fetch("/api/hall/encounters/bear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encounterKey: key }),
    }).catch(() => null);
    if (!response) { setBearFeedback({ key, status: "missed" }); return; }
    if (response.status === 401) { setBearFeedback({ key, status: "signed-out" }); return; }
    if (!response.ok) { setBearFeedback({ key, status: "missed" }); return; }
    const result = await response.json() as BearResponse;
    setBearFeedback({ key, status: result.awarded ? "awarded" : "remembered" });
    if (result.awarded) {
      localStorage.setItem("habitat:last-legendary-achievement", result.achievement.awardId);
      previewReward({
        id: `achievement-${result.achievement.awardId}`,
        title: result.achievement.name,
        detail: result.achievement.description,
        rarity: result.achievement.rarity,
        category: result.achievement.category,
        points: result.achievement.points,
        rewards: result.achievement.rewards,
        kind: "achievement",
      });
    }
  };

  const bearMessage = bearState === "awarded" ? "Secret unlocked: Do Not Tap the Glass" : bearState === "remembered" ? "The bear remembers you." : bearState === "signed-out" ? "The bear roared. Sign in to earn its mark next time." : bearState === "missed" ? "The moment escaped into the treeline." : bearState === "roaring" ? "That was louder than expected." : "";
  const eventDuration = Math.max(1, atmosphere.encounterDurationSeconds);
  const eventStyle = {
    "--event-duration": `${eventDuration}s`,
    "--event-delay": `${-(atmosphere.encounterProgress * eventDuration)}s`,
    "--hall-event-image": `url(${SKY_IMAGE[atmosphere.sky]})`,
  } as CSSProperties;

  return <>
    <div ref={atmosphereRef} className={`hall-atmosphere sky-${atmosphere.sky} encounter-${atmosphere.encounter}`} data-encounter={atmosphere.encounter} data-preview={atmosphere.encounterKey?.startsWith("visual-preview:") ? "true" : undefined} style={eventStyle}>
      <Image className="hall-event-preload" src="/images/hall-events/bear.png" alt="" width={906} height={969} sizes="(max-width: 800px) 250px, 350px" preload aria-hidden="true" />
      <canvas ref={threeCanvasRef} className="hall-three-canvas" aria-hidden="true" />
      <div className="hall-haze" aria-hidden="true" /><div className="hall-stars" aria-hidden="true" /><div className="hall-aurora" aria-hidden="true" />
      <div className="hall-event-window" aria-hidden="true">
        <div className="hall-eclipse" /><div className="hall-blood-moon" />
        <div className="hall-storm"><i /><i /><i /></div>
        <div className="hall-lightning">
          <svg viewBox="0 0 120 520" role="presentation">
            <path className="lightning-core" d="M67 4 57 91 70 94 47 191 59 194 38 286 49 284 25 413 33 409 14 516" />
            <path className="lightning-branch" d="m52 168-29 63 20-15-18 78M43 269l35 52-24-18 8 62M31 382l-20 43 15-11-9 49" />
          </svg>
        </div>
        <div className="hall-cloud cloud-one" /><div className="hall-cloud cloud-two" />
        <div className="hall-ravens">
          {RAVEN_PLATES.map((raven, index) => <Image className={`hall-raven-plate hall-raven-${raven}`} src="/images/hall-events/ravens.png" alt="" width={1629} height={777} sizes="(max-width: 800px) 280px, 390px" preload={index === 0} key={raven} />)}
        </div>
        <div className="hall-ufo">
          <div className="hall-ufo-haze" />
          <div className="hall-ufo-beam" />
          <div className="hall-ufo-craft"><Image src="/images/hall-events/ufo.png" alt="" width={686} height={214} sizes="(max-width: 800px) 190px, 290px" preload /><i /><i /><i /></div>
        </div>
        <div className="hall-comet"><i /><i /><span /></div>
        <div className="hall-fireflies">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</div>
      </div>
      <div className="hall-scene-bounce" aria-hidden="true" />
      {atmosphere.encounter === "bear" ? <>
        <button className={`hall-bear-encounter ${bearState !== "idle" ? "is-roaring" : ""}`} type="button" onClick={() => { void meetTheBear(); }} aria-label="A black bear is visiting the Great Hall balcony. Tap it before it leaves.">
          <span className="hall-bear-shadow" aria-hidden="true" />
          <Image src="/images/hall-events/bear.png" alt="" width={906} height={969} sizes="(max-width: 800px) 250px, 350px" />
          <span className="hall-bear-blink" aria-hidden="true"><i /><i /></span>
          <span className="hall-bear-caption">Something is watching</span>
        </button>
        <div className="hall-depth-rail" aria-hidden="true" />
      </> : null}
      <div className="hall-glass-reflection" aria-hidden="true" />
    </div>
    <p className="hall-encounter-status" aria-live="polite">{bearMessage}</p>
  </>;
}
