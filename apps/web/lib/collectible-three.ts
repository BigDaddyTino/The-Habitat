import type * as Three from "three";
import { collectibleAtlasGrid, collectibleAtlasPaths, getCollectibleVisual, type CollectibleIdentity } from "@/lib/collectible-art";

type ThreeModule = typeof import("three");
export type CollectibleAtlases = Record<keyof typeof collectibleAtlasPaths, Three.Texture>;

export async function loadCollectibleAtlases(THREE: ThreeModule, only?: keyof typeof collectibleAtlasPaths): Promise<Partial<CollectibleAtlases>> {
  const loader = new THREE.TextureLoader();
  const paths = Object.entries(collectibleAtlasPaths).filter(([key]) => !only || key === only);
  const entries = await Promise.all(paths.map(async ([key, path]) => {
    const texture = await loader.loadAsync(path);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return [key, texture] as const;
  }));
  return Object.fromEntries(entries) as Partial<CollectibleAtlases>;
}

function atlasTile(THREE: ThreeModule, source: Three.Texture, atlas: keyof CollectibleAtlases, index: number | null) {
  if (index === null) return null;
  const texture = source.clone();
  const grid = collectibleAtlasGrid[atlas];
  const column = index % grid.columns;
  const row = Math.floor(index / grid.columns);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1 / grid.columns, 1 / grid.rows);
  texture.offset.set(column / grid.columns, 1 - (row + 1) / grid.rows);
  texture.needsUpdate = true;
  return texture;
}

function reliefMaterial(THREE: ThreeModule, texture: Three.Texture) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: true,
    depthTest: true,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    uniforms: { map: { value: texture }, uvRepeat: { value: texture.repeat.clone() }, uvOffset: { value: texture.offset.clone() } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D map;
      uniform vec2 uvRepeat;
      uniform vec2 uvOffset;
      varying vec2 vUv;
      void main() {
        vec4 tex=texture2D(map,vUv*uvRepeat+uvOffset);
        float light=max(tex.r,max(tex.g,tex.b));
        if(light<.035) discard;
        float alpha=smoothstep(.035,.14,light);
        vec3 museumLit=pow(tex.rgb,vec3(.82));
        float luma=dot(museumLit,vec3(.2126,.7152,.0722));
        museumLit=mix(vec3(luma),museumLit,1.16);
        museumLit=(museumLit-.5)*1.08+.5;
        gl_FragColor=vec4(museumLit*1.18,alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

function reverseTexture(THREE: ThreeModule, item: CollectibleIdentity, inscription: string, accent: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 768;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const gradient = context.createRadialGradient(384, 320, 20, 384, 384, 370);
  gradient.addColorStop(0, "#323229");
  gradient.addColorStop(1, "#090b09");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 768, 768);
  context.strokeStyle = accent;
  context.globalAlpha = 0.82;
  context.lineWidth = 12;
  context.beginPath();
  context.arc(384, 384, 332, 0, Math.PI * 2);
  context.stroke();
  context.lineWidth = 3;
  context.beginPath();
  context.arc(384, 384, 296, 0, Math.PI * 2);
  context.stroke();
  context.globalAlpha = 1;
  context.fillStyle = "#dbcba6";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "700 39px Georgia, serif";
  const words = item.name.toUpperCase().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width > 520 && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  lines.slice(0, 3).forEach((value, index) => context.fillText(value, 384, 275 + index * 48 - (lines.length - 1) * 24));
  context.fillStyle = accent;
  context.font = "600 24px ui-monospace, monospace";
  context.fillText(inscription, 384, 465);
  context.fillStyle = "#9a988b";
  context.font = "500 19px ui-monospace, monospace";
  context.fillText(item.achievementName ? `EARNED: ${item.achievementName.toUpperCase()}`.slice(0, 58) : "THE HABITAT · VERIFIED COLLECTION", 384, 525);
  if (item.unlockedAt) context.fillText(new Date(item.unlockedAt).toLocaleDateString(), 384, 560);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function metalMaterial(THREE: ThreeModule, color: string, roughness = 0.3) {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.035, metalness: 0.82, roughness });
}

function addMesh(group: Three.Group, geometry: Three.BufferGeometry, material: Three.Material, position: [number, number, number], rotation: [number, number, number] = [0, 0, 0], scale: [number, number, number] = [1, 1, 1]) {
  const THREE = group.userData.THREE as ThreeModule;
  const object = new THREE.Mesh(geometry, material);
  object.position.set(...position);
  object.rotation.set(...rotation);
  object.scale.set(...scale);
  object.castShadow = true;
  object.receiveShadow = true;
  group.add(object);
  return object;
}

function addTube(THREE: ThreeModule, group: Three.Group, points: Array<[number, number, number]>, radius: number, material: Three.Material) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
  return addMesh(group, new THREE.TubeGeometry(curve, 28, radius, 8, false), material, [0, 0, 0]);
}

function addRelief(THREE: ThreeModule, group: Three.Group, texture: Three.Texture | null, y: number, z: number, size: number, rotationY = 0) {
  if (!texture) return;
  const material = reliefMaterial(THREE, texture);
  const mesh = addMesh(group, new THREE.PlaneGeometry(size, size), material, [0, y, z], [0, rotationY, 0]);
  mesh.renderOrder = 3;
}

function addReverse(THREE: ThreeModule, group: Three.Group, item: CollectibleIdentity, inscription: string, accent: string, y: number, z: number, size: number) {
  const texture = reverseTexture(THREE, item, inscription, accent);
  if (!texture) return;
  const material = new THREE.MeshStandardMaterial({ map: texture, metalness: 0.28, roughness: 0.56, side: THREE.FrontSide });
  addMesh(group, new THREE.CircleGeometry(size / 2, 48), material, [0, y, z], [0, Math.PI, 0]);
}

function buildBadge(THREE: ThreeModule, group: Three.Group, item: CollectibleIdentity, tile: Three.Texture | null) {
  const visual = getCollectibleVisual(item);
  const metal = metalMaterial(THREE, visual.metal, 0.28);
  const accent = metalMaterial(THREE, visual.accent, 0.2);
  const enamel = new THREE.MeshStandardMaterial({ color: visual.enamel, metalness: 0.24, roughness: 0.38 });
  const angular = ["passport", "disk", "atlas", "patch-five", "patch-ten"].includes(visual.form);
  const sides = visual.form === "compass" ? 12 : visual.form === "broken-compass" ? 7 : angular ? 8 : 48;
  addMesh(group, new THREE.CylinderGeometry(0.78, 0.78, 0.18, sides, 1, false), metal, [0, 0, 0], [Math.PI / 2, 0, 0]);
  addMesh(group, new THREE.TorusGeometry(0.65, 0.035, 10, Math.max(12, sides)), accent, [0, 0, 0.105]);
  addMesh(group, new THREE.CylinderGeometry(0.59, 0.59, 0.026, Math.max(16, sides)), enamel, [0, 0, 0.104], [Math.PI / 2, 0, 0]);
  addRelief(THREE, group, tile, 0, 0.126, 1.42);
  addReverse(THREE, group, item, visual.inscription, visual.accent, 0, -0.102, 1.32);
  // The rear pin and catches are intentionally visible in the inspector.
  addMesh(group, new THREE.CylinderGeometry(0.024, 0.024, 1.06, 10), accent, [0, 0, -0.17], [0, 0, Math.PI / 2]);
  addMesh(group, new THREE.SphereGeometry(0.08, 14, 10), metal, [-0.54, 0, -0.17]);
  addMesh(group, new THREE.ConeGeometry(0.07, 0.15, 10), metal, [0.58, 0, -0.17], [0, 0, -Math.PI / 2]);

  if (visual.form === "wing") {
    [-1, 1].forEach((side) => {
      for (let index = 0; index < 3; index += 1) addMesh(group, new THREE.ConeGeometry(0.1, 0.5 - index * 0.06, 5), accent, [side * (0.7 + index * 0.11), 0.18 - index * 0.18, 0.02], [0, 0, side * (-0.72 + index * 0.12)]);
    });
  } else if (visual.form === "compass") {
    for (let index = 0; index < 6; index += 1) addMesh(group, new THREE.ConeGeometry(0.085, 0.34, 5), accent, [Math.cos(index * Math.PI / 3) * 0.73, Math.sin(index * Math.PI / 3) * 0.73, 0.04], [0, 0, index * Math.PI / 3 - Math.PI / 2]);
  } else if (visual.form === "tankard") {
    addMesh(group, new THREE.TorusGeometry(0.19, 0.045, 8, 18, Math.PI * 1.45), accent, [0.56, 0.03, 0.05], [0, 0, -Math.PI / 2]);
  } else if (visual.form.startsWith("patch")) {
    const count = visual.form === "patch-five" ? 1 : 2;
    for (let index = 0; index < count; index += 1) addMesh(group, new THREE.BoxGeometry(0.07, 0.44, 0.05), accent, [(index - (count - 1) / 2) * 0.14, -0.02, 0.15]);
  } else if (visual.form === "half-sun") {
    for (let index = 0; index < 8; index += 1) addMesh(group, new THREE.ConeGeometry(0.04, 0.2, 4), accent, [Math.cos(index * Math.PI / 4) * 0.72, Math.sin(index * Math.PI / 4) * 0.72, 0.05], [0, 0, index * Math.PI / 4 - Math.PI / 2]);
  } else if (visual.form === "summit") {
    addMesh(group, new THREE.ConeGeometry(0.16, 0.48, 4), accent, [0, 0.7, 0.02], [0, 0, 0]);
  }
}

function buildMedal(THREE: ThreeModule, group: Three.Group, item: CollectibleIdentity, tile: Three.Texture | null) {
  const visual = getCollectibleVisual(item);
  const metal = metalMaterial(THREE, visual.metal, 0.26);
  const accent = metalMaterial(THREE, visual.accent, 0.2);
  const enamel = new THREE.MeshStandardMaterial({ color: visual.enamel, metalness: 0.18, roughness: 0.42 });
  const ribbonColors = visual.ribbon ?? ["#35453b", "#aa8752"];
  const ribbonA = new THREE.MeshStandardMaterial({ color: ribbonColors[0], metalness: 0, roughness: 0.82 });
  const ribbonB = new THREE.MeshStandardMaterial({ color: ribbonColors[1], metalness: 0.05, roughness: 0.7 });
  // Folded two-tone ribbon is modeled front and rear rather than painted onto the medal.
  addMesh(group, new THREE.BoxGeometry(0.4, 0.98, 0.055), ribbonA, [-0.2, 0.83, -0.02], [0, 0, 0.22]);
  addMesh(group, new THREE.BoxGeometry(0.4, 0.98, 0.055), ribbonB, [0.2, 0.83, -0.02], [0, 0, -0.22]);
  addMesh(group, new THREE.TorusGeometry(0.16, 0.035, 10, 24), accent, [0, 0.35, 0.01]);
  const sides = visual.form === "rune-medal" ? 10 : visual.form === "dragon-medal" ? 8 : 48;
  addMesh(group, new THREE.CylinderGeometry(0.73, 0.73, 0.2, sides), metal, [0, -0.28, 0], [Math.PI / 2, 0, 0]);
  addMesh(group, new THREE.CylinderGeometry(0.61, 0.61, 0.03, Math.max(16, sides)), enamel, [0, -0.28, 0.116], [Math.PI / 2, 0, 0]);
  addMesh(group, new THREE.TorusGeometry(0.63, 0.035, 10, Math.max(16, sides)), accent, [0, -0.28, 0.13]);
  addRelief(THREE, group, tile, -0.28, 0.151, 1.32);
  addReverse(THREE, group, item, visual.inscription, visual.accent, -0.28, -0.112, 1.24);
  if (visual.form === "moon-medal") addMesh(group, new THREE.TorusGeometry(0.7, 0.025, 7, 32), new THREE.MeshStandardMaterial({ color: "#8e211b", emissive: "#8e211b", emissiveIntensity: 0.5 }), [0, -0.28, 0]);
  if (visual.form === "breather-medal") addTube(THREE, group, [[-0.65, -0.25, 0], [-0.82, 0.05, 0], [-0.7, 0.26, 0]], 0.035, accent);
  if (visual.form === "dragon-medal") {
    [-1, 1].forEach((side) => addMesh(group, new THREE.ConeGeometry(0.08, 0.34, 5), accent, [side * 0.64, 0.04, 0.02], [0, 0, side * -0.55]));
  }
}

function trophyBase(THREE: ThreeModule, group: Three.Group, metal: Three.Material, accent: Three.Material, enamel: Three.Material) {
  addMesh(group, new THREE.BoxGeometry(1.48, 0.22, 0.84), enamel, [0, -1.04, 0]);
  addMesh(group, new THREE.BoxGeometry(1.24, 0.18, 0.72), metal, [0, -0.84, 0]);
  addMesh(group, new THREE.BoxGeometry(0.94, 0.14, 0.58), accent, [0, -0.68, 0]);
}

function buildTrophy(THREE: ThreeModule, group: Three.Group, item: CollectibleIdentity, tile: Three.Texture | null) {
  const visual = getCollectibleVisual(item);
  const metal = metalMaterial(THREE, visual.metal, 0.27);
  const accent = metalMaterial(THREE, visual.accent, 0.2);
  const enamel = new THREE.MeshStandardMaterial({ color: visual.enamel, metalness: 0.18, roughness: 0.48 });
  const dark = metalMaterial(THREE, "#242621", 0.38);
  trophyBase(THREE, group, metal, accent, enamel);

  if (visual.form === "antler") {
    addMesh(group, new THREE.CylinderGeometry(0.12, 0.16, 0.62, 12), dark, [0, -0.34, 0]);
    [-1, 1].forEach((side) => {
      addTube(THREE, group, [[0, -0.2, 0], [side * 0.28, 0.14, 0], [side * 0.48, 0.62, 0], [side * 0.67, 0.98, 0]], 0.055, accent);
      for (let index = 0; index < 3; index += 1) addTube(THREE, group, [[side * (0.3 + index * 0.11), 0.2 + index * 0.23, 0], [side * (0.62 + index * 0.08), 0.35 + index * 0.27, 0]], 0.04, accent);
    });
  } else if (visual.form === "crown") {
    addMesh(group, new THREE.CylinderGeometry(0.62, 0.68, 0.38, 32, 1, true), metal, [0, -0.25, 0]);
    addMesh(group, new THREE.TorusGeometry(0.64, 0.07, 10, 32), accent, [0, -0.05, 0], [Math.PI / 2, 0, 0]);
    for (let index = 0; index < 6; index += 1) {
      const angle = index / 6 * Math.PI * 2;
      addMesh(group, new THREE.ConeGeometry(0.1, 0.68, 7), metal, [Math.cos(angle) * 0.5, 0.28, Math.sin(angle) * 0.5], [0, 0, -Math.cos(angle) * 0.24]);
      addMesh(group, new THREE.SphereGeometry(0.1, 16, 10), accent, [Math.cos(angle) * 0.5, 0.65, Math.sin(angle) * 0.5]);
    }
  } else if (visual.form === "concern") {
    addMesh(group, new THREE.BoxGeometry(0.88, 1.28, 0.22), dark, [0, -0.02, 0]);
    [-0.12, 0, 0.12].forEach((offset, index) => addMesh(group, new THREE.BoxGeometry(0.72, 0.8, 0.025), new THREE.MeshStandardMaterial({ color: index === 1 ? "#b9a77f" : "#8f8166", roughness: 0.85 }), [offset, -0.12 + index * 0.04, 0.16 + index * 0.012], [0, 0, offset]));
    addMesh(group, new THREE.TorusGeometry(0.31, 0.08, 12, 32), accent, [0, 0.26, 0.3], [Math.PI / 2, 0, 0], [1.35, 0.65, 1]);
    addMesh(group, new THREE.SphereGeometry(0.13, 24, 14), metal, [0, 0.26, 0.31], [0, 0, 0], [1.3, 0.7, 0.45]);
  } else if (visual.form === "armchair") {
    const leather = new THREE.MeshStandardMaterial({ color: "#4a2c20", metalness: 0.02, roughness: 0.68 });
    addMesh(group, new THREE.BoxGeometry(0.86, 1.05, 0.25), leather, [0, 0.13, -0.18], [-0.12, 0, 0]);
    addMesh(group, new THREE.BoxGeometry(0.82, 0.24, 0.72), leather, [0, -0.38, 0.08]);
    [-1, 1].forEach((side) => addMesh(group, new THREE.CapsuleGeometry(0.13, 0.62, 6, 12), leather, [side * 0.52, -0.2, 0.12], [0, 0, Math.PI / 2]));
    addMesh(group, new THREE.TorusGeometry(0.21, 0.035, 8, 24, Math.PI), dark, [0, -0.25, 0.46], [Math.PI / 2, 0, 0]);
  } else if (visual.form === "deed") {
    const paper = new THREE.MeshStandardMaterial({ color: "#c4ae82", roughness: 0.9 });
    addMesh(group, new THREE.BoxGeometry(1.0, 1.28, 0.12), dark, [0, -0.02, 0]);
    addMesh(group, new THREE.PlaneGeometry(0.84, 1.1), paper, [0, -0.02, 0.071]);
    addMesh(group, new THREE.CylinderGeometry(0.045, 0.045, 0.98, 12), accent, [0, 0, 0.17], [0, 0, -0.76]);
    addMesh(group, new THREE.TorusGeometry(0.17, 0.045, 10, 24), accent, [-0.32, 0.32, 0.17]);
    addMesh(group, new THREE.SphereGeometry(0.12, 18, 12), new THREE.MeshStandardMaterial({ color: "#7d231f", roughness: 0.55 }), [0.28, -0.38, 0.12]);
  } else if (visual.form === "ledger") {
    const page = new THREE.MeshStandardMaterial({ color: "#a78f66", roughness: 0.9 });
    [-1, 1].forEach((side) => addMesh(group, new THREE.BoxGeometry(0.58, 1.18, 0.16), page, [side * 0.31, -0.03, 0], [0, side * -0.12, side * 0.05]));
    addTube(THREE, group, [[-0.62, 0.38, 0.15], [0, 0.1, 0.27], [0.62, 0.38, 0.15]], 0.045, dark);
    for (let index = 0; index < 10; index += 1) addMesh(group, new THREE.BoxGeometry(0.12, 0.055, 0.04), metal, [0.69, 0.48 - index * 0.09, 0.04]);
  } else if (visual.form === "boss-reliquary") {
    const relic = new THREE.MeshStandardMaterial({ color: "#8e2f24", emissive: "#d24a31", emissiveIntensity: 1.25, metalness: 0.32, roughness: 0.16 });
    addMesh(group, new THREE.CylinderGeometry(0.24, 0.38, 0.64, 12), dark, [0, -0.35, 0]);
    addMesh(group, new THREE.OctahedronGeometry(0.34, 1), relic, [0, 0.28, 0.02], [0.12, 0, Math.PI / 4]);
    addMesh(group, new THREE.TorusGeometry(0.54, 0.045, 10, 48), accent, [0, 0.28, 0], [Math.PI / 2, 0, 0]);
    addMesh(group, new THREE.TorusGeometry(0.54, 0.035, 10, 48), metal, [0, 0.28, 0], [Math.PI / 2, Math.PI / 2, 0]);
    [-1, 1].forEach((side) => {
      addTube(THREE, group, [[side * 0.17, -0.15, 0], [side * 0.45, 0.22, 0], [side * 0.62, 0.68, 0]], 0.055, metal);
      addTube(THREE, group, [[side * 0.39, 0.17, 0], [side * 0.72, 0.35, 0]], 0.035, accent);
      addMesh(group, new THREE.ConeGeometry(0.09, 0.42, 7), accent, [side * 0.57, 0.79, 0], [0, 0, side * -0.22]);
    });
    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 2;
      addMesh(group, new THREE.SphereGeometry(0.045, 12, 8), accent, [Math.cos(angle) * 0.51, 0.28 + Math.sin(angle) * 0.51, 0.08]);
    }
  } else if (visual.form === "centurion") {
    addMesh(group, new THREE.SphereGeometry(0.55, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.62), metal, [0, 0.15, 0], [0, 0, Math.PI]);
    addMesh(group, new THREE.BoxGeometry(0.14, 0.7, 0.54), accent, [0, -0.05, 0.32]);
    for (let index = -5; index <= 5; index += 1) addMesh(group, new THREE.BoxGeometry(0.07, 0.66 - Math.abs(index) * 0.035, 0.09), new THREE.MeshStandardMaterial({ color: "#8d3029", roughness: 0.72 }), [index * 0.075, 0.68, -0.02], [0, 0, index * -0.035]);
  } else if (visual.form === "bear") {
    addMesh(group, new THREE.BoxGeometry(1.34, 0.08, 0.18), dark, [0, 0.76, 0.04]);
    addMesh(group, new THREE.BoxGeometry(1.34, 0.08, 0.18), dark, [0, -0.5, 0.04]);
    [-1, 1].forEach((side) => addMesh(group, new THREE.BoxGeometry(0.08, 1.34, 0.18), dark, [side * 0.64, 0.13, 0.04]));
    [[-0.54, 0.48, -0.7], [0.54, 0.42, 0.72], [-0.48, -0.23, -0.92], [0.5, -0.28, 0.96]].forEach(([x, y, angle]) => addMesh(group, new THREE.ConeGeometry(0.055, 0.38, 3), accent, [x, y, 0.18], [0, 0, angle]));
  }
  // Keep authored detail as a small maker's plaque on the plinth. The prior
  // full-size relief covered the modeled volume and made trophies read as badges.
  addRelief(THREE, group, tile, -1.03, 0.431, 0.52);
  addReverse(THREE, group, item, visual.inscription, visual.accent, 0.14, -0.19, 1.38);
}

export function createCollectibleModel(THREE: ThreeModule, item: CollectibleIdentity, atlases: Partial<CollectibleAtlases>) {
  const visual = getCollectibleVisual(item);
  const group = new THREE.Group();
  group.userData.THREE = THREE;
  const atlas = atlases[visual.atlas];
  if (!atlas) throw new Error(`Collectible atlas unavailable: ${visual.atlas}`);
  const tile = atlasTile(THREE, atlas, visual.atlas, visual.tile);
  if (item.kind === "BADGE") buildBadge(THREE, group, item, tile);
  else if (item.kind === "MEDAL") buildMedal(THREE, group, item, tile);
  else buildTrophy(THREE, group, item, tile);
  group.userData.item = item;
  const bounds = new THREE.Box3().setFromObject(group);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  group.position.sub(center);
  group.scale.setScalar(2 / Math.max(size.x, size.y, size.z));
  const root = new THREE.Group();
  root.add(group);
  root.userData.item = item;
  return root;
}

export function disposeCollectibleModel(group: Three.Object3D) {
  group.traverse((object) => {
    if (!(object as Three.Mesh).isMesh) return;
    const mesh = object as Three.Mesh;
    mesh.geometry.dispose();
    const values = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    values.forEach((material) => {
      const withMaps = material as Three.Material & { map?: Three.Texture | null; uniforms?: Record<string, { value?: unknown }> };
      withMaps.map?.dispose();
      const uniformMap = withMaps.uniforms?.map?.value;
      if (uniformMap && typeof uniformMap === "object" && "dispose" in uniformMap) (uniformMap as Three.Texture).dispose();
      material.dispose();
    });
  });
}
