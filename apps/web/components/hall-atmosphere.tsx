"use client";

import { useEffect, useRef, useState } from "react";
import type {
  Artboard,
  File as RiveFile,
  RiveCanvas,
  StateMachineInstance,
  WrappedRenderer,
} from "@rive-app/canvas-advanced-single";
import type {
  BufferGeometry,
  Group,
  Material,
  Mesh,
  PerspectiveCamera,
  Points,
  Scene,
  Texture,
  WebGLRenderer,
} from "three";
import type { HallEncounter, HallSky } from "@/lib/hall-atmosphere";

const SKY_IMAGE: Record<HallSky, string> = {
  sunrise: "/images/habitat-lodge-sunrise.png",
  midday: "/images/habitat-lodge-midday.png",
  sunset: "/images/habitat-lodge-sunset.png",
  night: "/images/habitat-lodge.png",
};

const SKY_PARTICLE_COLOR: Record<HallSky, number> = {
  sunrise: 0xf5bb72,
  midday: 0xd8f0e9,
  sunset: 0xf3a45f,
  night: 0xbfd4ff,
};

type NetworkInformation = { saveData?: boolean };

export function HallAtmosphere({ sky, encounter }: { sky: HallSky; encounter: HallEncounter }) {
  const atmosphereRef = useRef<HTMLDivElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);
  const riveCanvasRef = useRef<HTMLCanvasElement>(null);
  const controlRef = useRef<HTMLButtonElement>(null);
  const focusModeRef = useRef(false);
  const [focusMode, setFocusMode] = useState(false);

  const toggleFocusMode = () => {
    focusModeRef.current = !focusModeRef.current;
    setFocusMode(focusModeRef.current);
  };

  useEffect(() => {
    const atmosphere = atmosphereRef.current;
    const threeCanvas = threeCanvasRef.current;
    const riveCanvas = riveCanvasRef.current;
    const control = controlRef.current;
    const hero = atmosphere?.closest<HTMLElement>(".hall-hero");
    if (!atmosphere || !threeCanvas || !riveCanvas || !control || !hero) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    const conservativeMode = Boolean(connection?.saveData) || (navigator.hardwareConcurrency ?? 8) <= 4;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, hot: false };
    let disposed = false;
    let visible = true;
    let lastFrame = performance.now();
    let focusAmount = 0;
    let threeReady = false;
    let riveReady = false;
    let frameLoop: ((time: number) => void) | null = null;

    let threeRenderer: WebGLRenderer | null = null;
    let scene: Scene | null = null;
    let camera: PerspectiveCamera | null = null;
    let vistaTarget: Mesh | null = null;
    let particleField: Points | null = null;
    let fogGroup: Group | null = null;
    let imageTexture: Texture | null = null;
    const geometries: BufferGeometry[] = [];
    const materials: Material[] = [];

    let riveRuntime: RiveCanvas | null = null;
    let riveFile: RiveFile | null = null;
    let riveArtboard: Artboard | null = null;
    let riveStateMachine: StateMachineInstance | null = null;
    let riveRenderer: WrappedRenderer | null = null;

    const resizeRive = () => {
      if (!riveReady || !riveArtboard) return;
      const bounds = riveCanvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
      riveCanvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
      riveCanvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));
      riveArtboard.devicePixelRatioUsed = pixelRatio;
    };

    const resizeThree = () => {
      if (!threeRenderer || !camera) return;
      const bounds = hero.getBoundingClientRect();
      threeRenderer.setSize(Math.max(1, bounds.width), Math.max(1, bounds.height), false);
      camera.aspect = bounds.width / Math.max(1, bounds.height);
      camera.updateProjectionMatrix();
    };

    const renderRive = (delta: number) => {
      if (!riveRuntime || !riveRenderer || !riveArtboard || !riveStateMachine) return;
      riveStateMachine.advanceAndApply(delta * (focusModeRef.current ? 1.35 : pointer.hot ? 1.12 : 1));
      riveArtboard.advance(delta);
      riveRenderer.clear();
      riveRenderer.save();
      riveRenderer.align(
        riveRuntime.Fit.contain,
        riveRuntime.Alignment.center,
        { minX: 0, minY: 0, maxX: riveCanvas.width, maxY: riveCanvas.height },
        riveArtboard.bounds,
      );
      riveArtboard.draw(riveRenderer);
      riveRenderer.restore();
      riveRuntime.resolveAnimationFrame();
    };

    const mapPointerToRive = (event: PointerEvent) => {
      if (!riveArtboard || !riveStateMachine) return null;
      const bounds = control.getBoundingClientRect();
      const artboardBounds = riveArtboard.bounds;
      const normalizedX = Math.min(1, Math.max(0, (event.clientX - bounds.left) / Math.max(1, bounds.width)));
      const normalizedY = Math.min(1, Math.max(0, (event.clientY - bounds.top) / Math.max(1, bounds.height)));
      return {
        x: artboardBounds.minX + normalizedX * (artboardBounds.maxX - artboardBounds.minX),
        y: artboardBounds.minY + normalizedY * (artboardBounds.maxY - artboardBounds.minY),
      };
    };

    const move = (event: PointerEvent) => {
      const bounds = hero.getBoundingClientRect();
      pointer.targetX = Math.min(1, Math.max(-1, ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 2 - 1));
      pointer.targetY = Math.min(1, Math.max(-1, -(((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 2 - 1)));
      hero.style.setProperty("--hall-x", String(pointer.targetX * 0.5));
      hero.style.setProperty("--hall-y", String(pointer.targetY * -0.5));

      const dx = pointer.targetX - 0.72;
      const dy = pointer.targetY + 0.24;
      pointer.hot = dx * dx + dy * dy < 0.08;
      atmosphere.toggleAttribute("data-vista-hot", pointer.hot);

      const rivePoint = mapPointerToRive(event);
      if (rivePoint) riveStateMachine?.pointerMove(rivePoint.x, rivePoint.y, event.pointerId);
    };

    const leave = (event: PointerEvent) => {
      pointer.targetX = 0;
      pointer.targetY = 0;
      pointer.hot = false;
      hero.style.setProperty("--hall-x", "0");
      hero.style.setProperty("--hall-y", "0");
      atmosphere.removeAttribute("data-vista-hot");
      const rivePoint = mapPointerToRive(event);
      if (rivePoint) riveStateMachine?.pointerExit(rivePoint.x, rivePoint.y, event.pointerId);
    };

    const rivePointerDown = (event: PointerEvent) => {
      const point = mapPointerToRive(event);
      if (point) riveStateMachine?.pointerDown(point.x, point.y, event.pointerId);
    };

    const rivePointerUp = (event: PointerEvent) => {
      const point = mapPointerToRive(event);
      if (point) riveStateMachine?.pointerUp(point.x, point.y, event.pointerId);
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeThree();
      resizeRive();
    });
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (threeRenderer && frameLoop) threeRenderer.setAnimationLoop(visible && !reducedMotion.matches ? frameLoop : null);
    }, { threshold: 0.02 });

    const initializeThree = async () => {
      const THREE = await import("three");
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({
        canvas: threeCanvas,
        alpha: true,
        antialias: !conservativeMode,
        powerPreference: "high-performance",
      });
      threeRenderer = renderer;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, conservativeMode ? 1.1 : 1.65));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = sky === "night" ? 0.82 : 0.96;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
      camera.position.set(0, 0, 5);

      const image = await new THREE.TextureLoader().loadAsync(SKY_IMAGE[sky]);
      if (disposed) {
        image.dispose();
        return;
      }
      imageTexture = image;
      image.colorSpace = THREE.SRGBColorSpace;
      image.minFilter = THREE.LinearFilter;
      const imageElement = image.image as HTMLImageElement;

      const heroGeometry = new THREE.PlaneGeometry(2, 2);
      geometries.push(heroGeometry);
      const heroMaterial = new THREE.ShaderMaterial({
        depthWrite: false,
        uniforms: {
          uTexture: { value: image },
          uTime: { value: 0 },
          uPointer: { value: new THREE.Vector2() },
          uResolution: { value: new THREE.Vector2(1, 1) },
          uImageResolution: { value: new THREE.Vector2(imageElement.naturalWidth || imageElement.width || 1536, imageElement.naturalHeight || imageElement.height || 1024) },
          uFocus: { value: 0 },
          uNight: { value: sky === "night" ? 1 : 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;
          uniform sampler2D uTexture;
          uniform float uTime;
          uniform float uFocus;
          uniform float uNight;
          uniform vec2 uPointer;
          uniform vec2 uResolution;
          uniform vec2 uImageResolution;
          varying vec2 vUv;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
          }

          void main() {
            vec2 uv = vUv;
            float viewportAspect = uResolution.x / max(1.0, uResolution.y);
            float imageAspect = uImageResolution.x / max(1.0, uImageResolution.y);
            if (viewportAspect > imageAspect) {
              uv.y = (uv.y - .5) * (imageAspect / viewportAspect) + .5;
            } else {
              uv.x = (uv.x - .5) * (viewportAspect / imageAspect) + .5;
            }
            float depthMask = smoothstep(.05, .92, uv.y);
            uv += vec2(uPointer.x, -uPointer.y) * mix(.003, .011, depthMask);
            vec3 color = texture2D(uTexture, clamp(uv, .001, .999)).rgb;
            float luma = dot(color, vec3(.2126, .7152, .0722));
            color = mix(vec3(luma), color, 1.05 + uFocus * .09);
            color *= 1.0 + uFocus * .08;
            color += vec3(.018, .011, .004) * sin(uTime * .22 + uv.x * 4.0);
            color += (hash(gl_FragCoord.xy + floor(uTime * 12.0)) - .5) * mix(.018, .011, uNight);
            vec2 vignetteUv = vUv * (1.0 - vUv.yx);
            float vignette = pow(clamp(vignetteUv.x * vignetteUv.y * 19.0, 0.0, 1.0), .22);
            color *= mix(.52, 1.0, vignette);
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      });
      materials.push(heroMaterial);
      scene.add(new THREE.Mesh(heroGeometry, heroMaterial));

      const particleCount = conservativeMode ? 28 : 58;
      const particlePositions = new Float32Array(particleCount * 3);
      for (let index = 0; index < particleCount; index += 1) {
        particlePositions[index * 3] = THREE.MathUtils.randFloat(-4.6, 4.6);
        particlePositions[index * 3 + 1] = THREE.MathUtils.randFloat(-2.15, 2.4);
        particlePositions[index * 3 + 2] = THREE.MathUtils.randFloat(0.35, 1.35);
      }
      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
      geometries.push(particleGeometry);
      const particleMaterial = new THREE.PointsMaterial({
        color: SKY_PARTICLE_COLOR[sky],
        size: conservativeMode ? 0.018 : 0.026,
        transparent: true,
        opacity: sky === "night" ? 0.54 : 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      materials.push(particleMaterial);
      particleField = new THREE.Points(particleGeometry, particleMaterial);
      scene.add(particleField);

      fogGroup = new THREE.Group();
      const fogGeometry = new THREE.PlaneGeometry(3.5, 0.72);
      geometries.push(fogGeometry);
      for (let index = 0; index < (conservativeMode ? 1 : 3); index += 1) {
        const fogMaterial = new THREE.MeshBasicMaterial({
          color: sky === "sunset" || sky === "sunrise" ? 0xc89568 : 0x9aaca3,
          transparent: true,
          opacity: 0.025 + index * 0.012,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        materials.push(fogMaterial);
        const fog = new THREE.Mesh(fogGeometry, fogMaterial);
        fog.position.set(-3.8 + index * 3.1, -0.35 + index * 0.28, 0.42 + index * 0.06);
        fog.scale.set(1.45 + index * 0.22, 1, 1);
        fogGroup.add(fog);
      }
      scene.add(fogGroup);

      const targetGeometry = new THREE.RingGeometry(0.29, 0.305, 64);
      geometries.push(targetGeometry);
      const targetMaterial = new THREE.MeshBasicMaterial({
        color: 0xd6c397,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      materials.push(targetMaterial);
      vistaTarget = new THREE.Mesh(targetGeometry, targetMaterial);
      vistaTarget.position.set(1.9, -0.56, 1.08);
      scene.add(vistaTarget);

      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      const frame = (time: number) => {
        if (disposed || !threeRenderer || !scene || !camera) return;
        const delta = Math.min(0.05, Math.max(0.001, (time - lastFrame) / 1000));
        lastFrame = time;
        pointer.x += (pointer.targetX - pointer.x) * Math.min(1, delta * 4.6);
        pointer.y += (pointer.targetY - pointer.y) * Math.min(1, delta * 4.6);

        ndc.set(pointer.targetX, pointer.targetY);
        raycaster.setFromCamera(ndc, camera);
        const raycastHot = vistaTarget ? raycaster.intersectObject(vistaTarget, false).length > 0 : false;
        pointer.hot = pointer.hot || raycastHot;
        focusAmount += ((focusModeRef.current ? 1 : pointer.hot ? 0.34 : 0) - focusAmount) * Math.min(1, delta * 3.2);

        camera.position.x += (pointer.x * 0.055 - camera.position.x) * Math.min(1, delta * 2.4);
        camera.position.y += (pointer.y * 0.032 - camera.position.y) * Math.min(1, delta * 2.4);
        camera.position.z = 5 - focusAmount * 0.18;
        camera.lookAt(0, 0, 0);

        heroMaterial.uniforms.uTime.value = time / 1000;
        heroMaterial.uniforms.uPointer.value.set(pointer.x, pointer.y);
        heroMaterial.uniforms.uResolution.value.set(threeCanvas.clientWidth, threeCanvas.clientHeight);
        heroMaterial.uniforms.uFocus.value = focusAmount;

        if (particleField) {
          particleField.rotation.z = Math.sin(time * 0.00008) * 0.018;
          particleField.position.x = pointer.x * -0.07;
          particleField.position.y = Math.sin(time * 0.00031) * 0.045;
        }
        if (fogGroup) {
          fogGroup.position.x = ((time * 0.000035) % 3.1) - 1.55;
          fogGroup.position.y = pointer.y * -0.035;
        }
        if (vistaTarget) {
          vistaTarget.rotation.z = time * 0.00016;
          vistaTarget.scale.setScalar(1 + focusAmount * 0.22 + Math.sin(time * 0.0012) * 0.025);
          const material = vistaTarget.material as Material & { opacity: number };
          material.opacity = 0.12 + focusAmount * 0.34 + (pointer.hot ? 0.14 : 0);
        }

        renderRive(delta);
        threeRenderer.render(scene, camera);
      };
      frameLoop = frame;
      resizeThree();
      threeReady = true;
      atmosphere.setAttribute("data-three-ready", "true");
      if (reducedMotion.matches) frame(performance.now());
      else if (visible) renderer.setAnimationLoop(frame);
    };

    const initializeRive = async () => {
      const { default: createRiveRuntime } = await import("@rive-app/canvas-advanced-single");
      const [runtime, response] = await Promise.all([
        createRiveRuntime(),
        fetch("/rive/habitat-vista-control.riv", { cache: "force-cache" }),
      ]);
      if (!response.ok) throw new Error(`Rive asset request failed (${response.status})`);
      const file = await runtime.load(new Uint8Array(await response.arrayBuffer()));
      if (disposed) {
        file.unref();
        return;
      }
      const artboard = file.defaultArtboard();
      const stateMachineDefinition = artboard.stateMachineByName("State Machine 1") ?? artboard.stateMachineByIndex(0);
      const stateMachine = new runtime.StateMachineInstance(stateMachineDefinition, artboard);
      const renderer = runtime.makeRenderer(riveCanvas);

      riveRuntime = runtime;
      riveFile = file;
      riveArtboard = artboard;
      riveStateMachine = stateMachine;
      riveRenderer = renderer;
      riveReady = true;
      resizeRive();
      renderRive(0.001);
      atmosphere.setAttribute("data-rive-ready", "true");
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      atmosphere.removeAttribute("data-three-ready");
    };
    const onContextRestored = () => {
      if (threeReady) atmosphere.setAttribute("data-three-ready", "true");
    };
    const onMotionPreference = () => {
      if (!threeRenderer || !frameLoop) return;
      threeRenderer.setAnimationLoop(reducedMotion.matches || !visible ? null : frameLoop);
      if (reducedMotion.matches) frameLoop(performance.now());
    };

    hero.addEventListener("pointermove", move);
    hero.addEventListener("pointerleave", leave);
    control.addEventListener("pointerdown", rivePointerDown);
    control.addEventListener("pointerup", rivePointerUp);
    threeCanvas.addEventListener("webglcontextlost", onContextLost);
    threeCanvas.addEventListener("webglcontextrestored", onContextRestored);
    reducedMotion.addEventListener("change", onMotionPreference);
    resizeObserver.observe(hero);
    resizeObserver.observe(control);
    intersectionObserver.observe(hero);

    void initializeThree().catch((error: unknown) => {
      console.warn("The Great Hall WebGL scene fell back to its cinematic image.", error);
      atmosphere.setAttribute("data-three-fallback", "true");
    });
    void initializeRive().catch((error: unknown) => {
      console.warn("The Great Hall Rive control fell back to its HTML treatment.", error);
      atmosphere.setAttribute("data-rive-fallback", "true");
    });

    return () => {
      disposed = true;
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", leave);
      control.removeEventListener("pointerdown", rivePointerDown);
      control.removeEventListener("pointerup", rivePointerUp);
      threeCanvas.removeEventListener("webglcontextlost", onContextLost);
      threeCanvas.removeEventListener("webglcontextrestored", onContextRestored);
      reducedMotion.removeEventListener("change", onMotionPreference);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      threeRenderer?.setAnimationLoop(null);
      riveStateMachine?.delete();
      riveArtboard?.delete();
      riveRenderer?.delete();
      riveFile?.unref();
      imageTexture?.dispose();
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      threeRenderer?.dispose();
      hero.style.removeProperty("--hall-x");
      hero.style.removeProperty("--hall-y");
    };
  }, [sky]);

  return <>
    <div ref={atmosphereRef} className={`hall-atmosphere sky-${sky} encounter-${encounter}`} aria-hidden="true">
      <canvas ref={threeCanvasRef} className="hall-three-canvas" />
      <div className="hall-haze" /><div className="hall-stars" /><div className="hall-aurora" />
      <div className="hall-sun" /><div className="hall-cloud cloud-one" /><div className="hall-cloud cloud-two" />
      <svg className="hall-pines" viewBox="0 0 1440 300" preserveAspectRatio="none"><path d="M0 300V180l52-90 31 58 36-110 43 118 55-70 58 104 63-151 54 151 56-91 41 64 45-125 43 125 59-75 63 117 50-143 51 143 52-73 52 89 71-165 52 165 55-122 43 122 74-88 49 88 53-160 55 160 48-96 59 96 46-136 44 136 73-68 66 68v120z" /></svg>
      <svg className="hall-raven" viewBox="0 0 120 50"><path d="M2 31c17-21 31-20 48-4 8-23 21-25 31 0 10-13 21-13 37 4-20-5-35-3-49 9-14-12-35-14-67-9z" /></svg>
      <svg className="hall-bear" viewBox="0 0 180 105"><path d="M18 89c4-24 23-38 46-36 8-21 28-27 42-12 15-9 34 0 38 18 19 1 29 12 28 30h-25v16h-15V89H76v16H60V89H44v16H29V89z" /><circle cx="98" cy="43" r="6" /></svg>
      <svg className="hall-ufo" viewBox="0 0 190 85"><path d="M70 42c5-26 45-26 50 0" /><path d="M32 46c25-19 101-19 126 0-14 17-104 17-126 0z" /><path d="M53 65v14m42-11v14m42-17v14" /></svg>
      <svg className="hall-comet" viewBox="0 0 240 110"><path d="M0 103 176 20" /><circle cx="191" cy="13" r="12" /></svg>
      <div className="hall-fireflies">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div>
    </div>
    <button
      ref={controlRef}
      className="hall-vista-control"
      type="button"
      aria-pressed={focusMode}
      aria-label={`${focusMode ? "Leave" : "Enter"} cinematic vista focus mode`}
      onClick={toggleFocusMode}
    >
      <span className="hall-vista-kicker">Field glass</span>
      <canvas ref={riveCanvasRef} className="hall-rive-canvas" aria-hidden="true" />
      <span className="hall-vista-reticle" aria-hidden="true" />
      <span className="hall-vista-label">{focusMode ? "Return to hall" : "Survey the valley"}</span>
    </button>
  </>;
}
