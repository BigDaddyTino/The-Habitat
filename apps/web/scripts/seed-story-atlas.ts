import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { bloomfallReachCanon } from "@habitat/shared";
import { regionMetaSchema } from "../lib/story-meta-schemas";
import { bloomfallMainRegion } from "../lib/bloomfall-reach-content";

const db = getPrismaClient();
const apply = process.argv.includes("--apply");

const blankPlace = {
  settlementTier: null,
  control: [],
  population: null,
  veilAnchorTier: null,
  soulForge: null,
  gameTag: null,
};

const macroRegions = [
  {
    slug: "riverlands",
    title: "The Riverlands",
    summary: "Martino's central watershed: broad buildable floodplains whose branching river corridors reach deep into every surrounding region.",
    body: "The Riverlands are the central watershed, not a round territory. Their navigable branches reach into every neighboring biome, carrying roads, trade, contested crossings, and strips of buildable ground far into higher-risk country. The broad central floodplains are the world's premier player-building territory. Each river arm should remain geographically readable on the atlas because those corridors are a deliberate progression and settlement system, not decorative water.",
    meta: { ...blankPlace, type: "region", parent: null, biome: "river floodplain, wetlands, and fertile lowland", connections: ["high-cliffs", "grand-rift", "the-desert", "magic-torn-wasteland", "the-peninsula"].map((to) => ({ to, by: "river corridor", notes: "A Riverlands branch carries buildable ground into the neighboring biome." })), status: "Established macro region; major city still unnamed.", openQuestions: ["What is the Riverlands' major city called, and which faction holds it?"] },
  },
  {
    slug: "high-cliffs",
    title: "The High Cliffs",
    summary: "Monumental northern heights enclosing the Grand Lake, feeding the lowlands through enormous waterfalls.",
    body: "The High Cliffs form Martino's northern crown: monumental vertical terrain around the elevated Grand Lake. Water leaves the heights in immense waterfalls and becomes the Riverlands below. The Floating City occupies the sky above or immediately beside the lake, while cliff roads, mining settlements, military lifts, and river-cut approaches make the region visibly inhabited rather than untouched wilderness.",
    meta: { ...blankPlace, type: "region", parent: null, biome: "alpine cliffs, elevated lake, and waterfall valleys", connections: [{ to: "riverlands", by: "waterfalls and river valleys", notes: "The Grand Lake feeds the central watershed." }], status: "Established macro region; the Floating City is its major city.", openQuestions: ["What is the Floating City's final proper name?"] },
  },
  {
    slug: "grand-lake",
    title: "The Grand Lake",
    summary: "The elevated northern lake whose outflow becomes Martino's central watershed.",
    body: "The Grand Lake sits inside the High Cliffs. Its water crosses the cliff edge in enormous falls and feeds the Riverlands. It is a strategic reservoir, transport surface, source of power, and supernatural landmark rather than empty scenic water.",
    meta: { ...blankPlace, type: "landmark", parent: "high-cliffs", biome: "elevated freshwater lake", connections: [{ to: "riverlands", by: "great waterfalls", notes: "Source of the central rivers." }], status: "Established landmark.", openQuestions: [] },
  },
  {
    slug: "the-floating-city",
    title: "The Floating City",
    summary: "One of Martino's four major cities, suspended above or beside the Grand Lake and governed by the Floating City Council.",
    body: "The Floating City is a near-future magic-tech capital in the northern sky: a genuine city of infrastructure, transit, defenses, industry, habitation, and government, not a single fantasy castle. Its final proper name remains open, but its location and status as a major city are established.",
    meta: { ...blankPlace, type: "settlement", settlementTier: "major-city", parent: "high-cliffs", biome: "aerial city above alpine lake", control: [{ faction: "floating-city-council", kind: "holds" }], connections: [{ to: "grand-lake", by: "skybridge and aerial transit", notes: null }], status: "Established major city; proper name unresolved.", openQuestions: ["What is the city's proper name?"] },
  },
  {
    slug: "grand-rift",
    title: "The Grand Rift",
    summary: "A colossal crack in the northwest where red forest gives way to broken canyon country and poisonous depths.",
    body: "The Grand Rift is a gigantic crack in the world. Its southern approach passes through an enormous thick red forest before the land breaks into canyon walls and deadly depths. Riverlands branches penetrate the safer shelves, creating valuable settlement corridors inside otherwise end-game terrain. A major city exists in the region, but its name and controlling faction remain deliberately unresolved.",
    meta: { ...blankPlace, type: "region", parent: null, biome: "red forest, shattered canyon, and toxic rift depths", connections: [{ to: "riverlands", by: "rift river corridor", notes: "A buildable river arm reaches into the broken country." }], status: "Established macro region; major city still unnamed.", openQuestions: ["What is the Grand Rift's major city called, and who built it?"] },
  },
  {
    slug: "the-red-forest",
    title: "The Red Forest",
    summary: "A vast, dense red woodland whose growth pushes deep into the Grand Rift and Death Canyon transition.",
    body: "The Red Forest does not stop at a neat canyon border. Its dense red canopy advances into broken shelves and ravines, thinning only as the Grand Rift becomes too fractured and toxic to hold it. The atlas should always show this long, irregular transition rather than two biomes meeting at a hard line.",
    meta: { ...blankPlace, type: "region", parent: null, biome: "dense crimson forest over broken canyon shelves", connections: [{ to: "death-canyon", by: "fractured forest shelves", notes: "The red canopy dies back gradually inside the canyon." }], status: "Established biome transition.", openQuestions: [] },
  },
  {
    slug: "death-canyon",
    title: "Death Canyon",
    summary: "The Grand Rift's poisonous depths, lit by luminescent green fissures beneath rolling purple gas.",
    body: "Death Canyon is the lethal interior of the Grand Rift. Its depths glow with unnatural green luminescence while dense purple gas coils through the fractures. The atmosphere is a gameplay hazard and a defining visual signal; the region must never read as an ordinary dry canyon.",
    meta: { ...blankPlace, type: "zone", parent: "grand-rift", biome: "luminescent toxic canyon and purple gas", connections: [{ to: "the-red-forest", by: "broken canyon shelves", notes: null }], status: "Established high-level hazard zone.", openQuestions: ["What produces the green light and purple gas?"] },
  },
  {
    slug: "the-desert",
    title: "The Desert",
    summary: "The southwestern arid region, crossed by Riverlands tributaries that form fertile routes and oasis corridors.",
    body: "The southwestern desert combines badlands, dunes, rock formations, industrial routes, and inhabited river corridors. Riverlands tributaries penetrate it far enough to support agriculture and player construction deep inside the biome. A major city is established visually, but its name and exact faction control remain open.",
    meta: { ...blankPlace, type: "region", parent: null, biome: "desert, badlands, and river oases", connections: [{ to: "riverlands", by: "oasis river corridor", notes: "Fertile, buildable ground follows the water into the desert." }], status: "Established macro region; major city still unnamed.", openQuestions: ["What is the desert's major city called?", "How much authority does the Desert Nomad Compact exercise there?"] },
  },
  {
    slug: "magic-torn-wasteland",
    title: "The Magic-Torn Wasteland",
    summary: "A spectacular northeastern end-game region where weather, gravity, terrain, and physical law visibly fail.",
    body: "The Magic-Torn Wasteland is charged earth under violent shifting weather: luminous faults, lightning, unstable ground, floating fragments, gravity anomalies, and zones where normal physical law visibly fails. It still belongs to Martino's near-future civilization—a fortified major city and engineered infrastructure stand against the impossible—but the city's name and ruler are not yet canon.",
    meta: { ...blankPlace, type: "region", parent: null, biome: "reality-torn magical wasteland", connections: [{ to: "riverlands", by: "stabilized river corridor", notes: "A Riverlands branch provides one buildable approach into the end-game zone." }], status: "Established end-game macro region; major city still unnamed.", openQuestions: ["What is the shielded city's name?", "Which faction can keep the city's reality defenses running?"] },
  },
  {
    slug: bloomfallReachCanon.slug,
    title: bloomfallReachCanon.title,
    summary: bloomfallMainRegion.summary,
    body: bloomfallMainRegion.body,
    meta: bloomfallMainRegion.meta,
  },
] as const;

type Point = readonly [number, number];
const imageWidth = 1536;
const imageHeight = 1024;
const coordinateWidth = 100000;
const coordinateHeight = 66667;
const px = (x: number, y: number): Point => [Math.round(x / imageWidth * coordinateWidth), Math.round(y / imageHeight * coordinateHeight)];
const point = (x: number, y: number) => ({ type: "POINT", coordinates: px(x, y) } as const);
const polygon = (points: readonly Point[]) => {
  const normalized = points.map(([x, y]) => px(x, y));
  return { type: "POLYGON", coordinates: [[...normalized, normalized[0]]] } as const;
};

type PlacementSeed = {
  slug: string;
  geometry: ReturnType<typeof point> | ReturnType<typeof polygon>;
  label?: Point;
  priority: number;
  minZoom?: number;
  maxZoom?: number;
};

type NodePlacementSeed = Omit<PlacementSeed, "slug"> & { arc: string; node: string };

type MapSeed = {
  slug: string;
  title: string;
  artVersion: string;
  owner?: string;
  parent?: string;
  maxZoom: number;
  placements: readonly PlacementSeed[];
  nodePlacements?: readonly NodePlacementSeed[];
};

const maps: readonly MapSeed[] = [
  {
    slug: "martino-world",
    title: "Martino World Atlas",
    artVersion: "v1",
    maxZoom: 3.1,
    placements: [
      { slug: "high-cliffs", geometry: polygon([[390, 0], [930, 0], [955, 155], [820, 235], [505, 215], [355, 110]]), label: px(675, 45), priority: 100 },
      { slug: "grand-lake", geometry: polygon([[535, 65], [825, 55], [875, 135], [805, 205], [585, 205], [515, 130]]), label: px(690, 115), priority: 120 },
      { slug: "the-floating-city", geometry: point(690, 105), label: px(690, 105), priority: 220 },
      { slug: "grand-rift", geometry: polygon([[0, 0], [420, 0], [475, 150], [465, 365], [300, 455], [70, 390], [0, 275]]), label: px(220, 100), priority: 95 },
      { slug: "death-canyon", geometry: polygon([[285, 75], [410, 75], [470, 205], [465, 445], [385, 505], [300, 385]]), label: px(370, 270), priority: 135 },
      { slug: "the-red-forest", geometry: polygon([[245, 215], [485, 190], [605, 350], [570, 585], [360, 535], [275, 400]]), label: px(430, 385), priority: 125 },
      { slug: "the-desert", geometry: polygon([[0, 210], [285, 175], [330, 385], [600, 560], [520, 685], [0, 675]]), label: px(190, 500), priority: 90 },
      { slug: "riverlands", geometry: polygon([[455, 145], [565, 125], [650, 220], [825, 190], [970, 255], [990, 485], [875, 570], [785, 660], [650, 595], [535, 555], [465, 430]]), label: px(700, 385), priority: 105 },
      { slug: "magic-torn-wasteland", geometry: polygon([[900, 0], [1536, 0], [1536, 285], [1220, 345], [970, 275], [875, 145]]), label: px(1175, 135), priority: 100 },
      { slug: bloomfallReachCanon.slug, geometry: polygon([[985, 250], [1536, 250], [1536, 725], [1190, 725], [955, 555], [875, 430]]), label: px(1260, 470), priority: 85 },
      { slug: "the-peninsula", geometry: polygon([[520, 450], [965, 435], [1000, 610], [930, 760], [905, 1024], [660, 1024], [585, 760], [485, 590]]), label: px(730, 625), priority: 110 },
      { slug: "port-arcadia", geometry: point(780, 920), label: px(780, 920), priority: 260 },
      { slug: "the-starting-island", geometry: point(575, 900), label: px(575, 900), priority: 255 },
      { slug: "the-ocean", geometry: point(1225, 880), label: px(1225, 880), priority: 60 },
    ],
  },
  {
    slug: "martino-starting-island",
    title: "Starting Island Tactical Atlas",
    artVersion: "v1",
    owner: "the-starting-island",
    parent: "martino-world",
    maxZoom: 3.7,
    placements: [
      { slug: "glasswater-village", geometry: polygon([[70, 185], [260, 180], [330, 300], [250, 400], [75, 365]]), label: px(175, 290), priority: 180 },
      { slug: "blackreef-harbour", geometry: polygon([[285, 75], [590, 70], [630, 230], [515, 285], [330, 250]]), label: px(445, 175), priority: 190 },
      { slug: "northwatch-relay", geometry: point(760, 82), label: px(760, 82), priority: 210 },
      { slug: "fort-tempest", geometry: polygon([[1260, 30], [1490, 35], [1510, 205], [1320, 220], [1235, 135]]), label: px(1380, 115), priority: 220 },
      { slug: "forward-camp-kestrel", geometry: polygon([[300, 285], [620, 285], [680, 455], [540, 520], [300, 470]]), label: px(480, 390), priority: 230 },
      { slug: "shattermarket", geometry: polygon([[255, 470], [565, 470], [610, 675], [430, 735], [230, 650]]), label: px(410, 585), priority: 205 },
      { slug: "stormglass-landing", geometry: polygon([[70, 675], [380, 670], [435, 855], [285, 955], [70, 895]]), label: px(240, 815), priority: 225 },
      { slug: "riftwood-interior", geometry: polygon([[695, 135], [1120, 125], [1240, 330], [1130, 565], [820, 560], [700, 405]]), label: px(960, 335), priority: 215 },
      { slug: "stormglass-quarry", geometry: polygon([[650, 520], [1040, 500], [1110, 760], [965, 890], [690, 830]]), label: px(850, 695), priority: 220 },
      { slug: "pearl-beachhead", geometry: polygon([[1110, 535], [1505, 510], [1525, 865], [1260, 920], [1075, 790]]), label: px(1300, 700), priority: 225 },
    ],
    nodePlacements: [
      { arc: "the-island-is-already-lost", node: "the-operations-table", geometry: point(470, 395), priority: 310, minZoom: 2.7 },
      { arc: "the-last-days-of-kestrel", node: "dig-in", geometry: point(520, 360), priority: 305, minZoom: 2.8 },
      { arc: "the-last-days-of-kestrel", node: "the-dead-do-not-wait", geometry: point(940, 350), priority: 305, minZoom: 2.8 },
      { arc: "the-last-days-of-kestrel", node: "every-fucking-meter", geometry: point(455, 420), priority: 305, minZoom: 3.1 },
      { arc: "the-evacuation", node: "the-manifest", geometry: point(560, 405), priority: 305, minZoom: 2.8 },
      { arc: "the-evacuation", node: "who-we-carry", geometry: point(520, 260), priority: 300, minZoom: 3.0 },
      { arc: "the-evacuation", node: "the-harbour-run", geometry: point(430, 165), priority: 315, minZoom: 2.8 },
    ],
  },
  {
    slug: "martino-port-arcadia",
    title: "Port Arcadia City Atlas",
    artVersion: "v2",
    owner: "port-arcadia",
    parent: "martino-world",
    maxZoom: 3.7,
    placements: [
      { slug: "exclusion-area", geometry: polygon([[585, 35], [975, 35], [1015, 180], [550, 180]]), label: px(790, 95), priority: 180 },
      { slug: "upper-westside", geometry: polygon([[120, 95], [600, 85], [650, 360], [360, 440], [120, 330]]), label: px(360, 230), priority: 170 },
      { slug: "lower-westside", geometry: polygon([[120, 325], [430, 330], [580, 565], [260, 665], [110, 530]]), label: px(310, 475), priority: 165 },
      { slug: "the-northside", geometry: polygon([[560, 145], [1080, 135], [1125, 390], [965, 465], [565, 400]]), label: px(820, 275), priority: 170 },
      { slug: "the-southside", geometry: polygon([[350, 350], [1160, 345], [1195, 690], [960, 750], [405, 700], [250, 555]]), label: px(755, 510), priority: 175 },
      { slug: "waterfront-district", geometry: polygon([[385, 560], [1165, 555], [1260, 900], [980, 985], [470, 945], [260, 760]]), label: px(790, 760), priority: 185 },
      { slug: "east-side", geometry: polygon([[1080, 155], [1465, 120], [1535, 560], [1320, 800], [1160, 620]]), label: px(1305, 390), priority: 170 },
      { slug: "chancellory-of-arcadia", geometry: point(335, 185), label: px(335, 185), priority: 245, minZoom: 2.9 },
      { slug: "arcadian-soverign-guard", geometry: point(235, 275), label: px(235, 275), priority: 245, minZoom: 3.0 },
      { slug: "arcadian-special-intelligence-service", geometry: point(445, 315), label: px(445, 315), priority: 250, minZoom: 3.1 },
      { slug: "embassy-row", geometry: point(515, 295), label: px(515, 295), priority: 250, minZoom: 3.1 },
      { slug: "census-office", geometry: point(790, 655), label: px(790, 655), priority: 250, minZoom: 2.9 },
    ],
    nodePlacements: [
      { arc: "binding-in-arcadia", node: "storm-beach", geometry: polygon([[20, 320], [150, 300], [235, 540], [165, 650], [25, 610]]), label: px(110, 470), priority: 320, minZoom: 2.5 },
      { arc: "binding-in-arcadia", node: "military-docks", geometry: point(805, 785), label: px(805, 785), priority: 325, minZoom: 2.5 },
      { arc: "binding-in-arcadia", node: "find-the-soul-forge", geometry: polygon([[190, 140], [1190, 135], [1280, 770], [1040, 900], [350, 820], [130, 520]]), label: px(790, 470), priority: 150, minZoom: 2.4, maxZoom: 2.95 },
    ],
  },
] as const;

async function main() {
  if (apply && !process.argv.includes("--allow-activated-v2")) {
    const schema = await db.$queryRaw<Array<{ present: boolean }>>`SELECT to_regclass('public."StoryMapTopologyNode"') IS NOT NULL AS present`;
    if (schema[0]?.present) {
      const [nodes, boundaries, rings, connections] = await Promise.all([db.storyMapTopologyNode.count(), db.storyMapBoundary.count(), db.storyMapAreaRing.count(), db.storyWorldConnection.count()]);
      if (nodes + boundaries + rings + connections > 0) throw new Error("Refusing destructive Atlas seed reconciliation while activated V2 data exists. Use the dedicated Atlas activation/cleanup workflow; --allow-activated-v2 is an explicit emergency override.");
    }
  }
  const author =
    (await db.user.findFirst({ where: { OR: [{ displayName: "Tino" }, { name: "Tino" }], isActive: true }, select: { id: true, username: true } })) ??
    (await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, select: { id: true, username: true } }));

  console.log(`${apply ? "Applying" : "Previewing"} Martino atlas as ${author.username ?? author.id}`);
  for (const seed of macroRegions) {
    const existing = await db.storyEntry.findUnique({ where: { slug: seed.slug }, select: { id: true, kind: true } });
    if (existing) { console.log(`  keep entry      ${seed.slug}`); continue; }
    const meta = regionMetaSchema.parse(seed.meta);
    console.log(`  ${apply ? "create" : "would create"} entry ${seed.slug}`);
    if (!apply) continue;
    await db.$transaction(async (tx) => {
      const entry = await tx.storyEntry.create({ data: { kind: "REGION", slug: seed.slug, title: seed.title, summary: seed.summary, body: seed.body, meta: meta as unknown as Prisma.InputJsonValue, status: "CANON", createdByUserId: author.id } });
      await tx.storyRevision.create({ data: { entityType: "ENTRY", entityId: entry.id, action: "CREATED", actorUserId: author.id, summary: `Established atlas region "${seed.title}"`, after: { slug: seed.slug, title: seed.title, source: "approved-world-map-v2" } } });
    });
  }

  if (!apply) {
    console.log(`  would calibrate ${maps.length} scenes, ${maps.reduce((count, map) => count + map.placements.length, 0)} place overlays, and ${maps.reduce((count, map) => count + (map.nodePlacements?.length ?? 0), 0)} quest overlays`);
    return;
  }

  for (const seed of maps) {
    const owner = seed.owner ? await db.storyEntry.findUnique({ where: { slug: seed.owner }, select: { id: true } }) : null;
    if (seed.owner && !owner) throw new Error(`Missing owner entry ${seed.owner} for ${seed.slug}`);
    const parent = seed.parent ? await db.storyMap.findUnique({ where: { slug: seed.parent }, select: { id: true } }) : null;
    if (seed.parent && !parent) throw new Error(`Missing parent map ${seed.parent} for ${seed.slug}`);
    const existingMap = await db.storyMap.findUnique({ where: { slug: seed.slug }, select: { id: true } });
    const mapData = {
      title: seed.title,
      parentMapId: parent?.id ?? null,
      ownerEntryId: owner?.id ?? null,
      artVersion: seed.artVersion,
      imageWidth,
      imageHeight,
      coordinateWidth,
      coordinateHeight,
      initialCenterX: 50000,
      initialCenterY: 33333,
      initialZoom: 0,
      minZoom: 0,
      maxZoom: seed.maxZoom,
      version: seed.slug === "martino-world" ? 2 : 1,
      updatedByUserId: author.id,
    };
    const map = await db.storyMap.upsert({
      where: { slug: seed.slug },
      update: mapData,
      create: { slug: seed.slug, ...mapData, createdByUserId: author.id },
    });
    await db.storyRevision.create({
      data: {
        entityType: "MAP",
        entityId: map.id,
        action: existingMap ? "UPDATED" : "CREATED",
        actorUserId: author.id,
        summary: `${existingMap ? "Calibrated" : "Created"} authoritative atlas scene "${seed.title}"`,
        after: { slug: seed.slug, artVersion: seed.artVersion, parent: seed.parent ?? null, owner: seed.owner ?? null, maxZoom: seed.maxZoom },
      },
    });

    const retainedPlacementIds: string[] = [];
    for (const placementSeed of seed.placements) {
      const entry = await db.storyEntry.findUnique({ where: { slug: placementSeed.slug }, select: { id: true, title: true } });
      if (!entry) throw new Error(`Missing atlas entry ${placementSeed.slug} for ${seed.slug}`);
      const existing = await db.storyMapPlacement.findUnique({ where: { mapId_entryId: { mapId: map.id, entryId: entry.id } }, select: { id: true } });
      const placementData = {
        geometryKind: placementSeed.geometry.type,
        geometry: placementSeed.geometry as unknown as Prisma.InputJsonValue,
        labelX: placementSeed.label?.[0] ?? null,
        labelY: placementSeed.label?.[1] ?? null,
        minZoom: placementSeed.minZoom ?? 0,
        maxZoom: placementSeed.maxZoom ?? null,
        priority: placementSeed.priority,
        version: existing ? 2 : 1,
        updatedByUserId: author.id,
      };
      const placement = await db.storyMapPlacement.upsert({
        where: { mapId_entryId: { mapId: map.id, entryId: entry.id } },
        update: placementData,
        create: { mapId: map.id, entryId: entry.id, ...placementData, createdByUserId: author.id },
      });
      retainedPlacementIds.push(placement.id);
      await db.storyRevision.create({
        data: {
          entityType: "PLACEMENT",
          entityId: placement.id,
          action: existing ? "MOVED" : "CREATED",
          actorUserId: author.id,
          summary: `${existing ? "Calibrated" : "Placed"} "${entry.title}" on ${seed.title}`,
          after: { map: seed.slug, entry: placementSeed.slug, geometry: placementSeed.geometry as unknown as Prisma.InputJsonValue },
        },
      });
    }
    const stalePlacements = await db.storyMapPlacement.findMany({ where: { mapId: map.id, id: { notIn: retainedPlacementIds } }, select: { id: true, entry: { select: { slug: true, title: true } } } });
    if (stalePlacements.length) {
      await db.$transaction([
        ...stalePlacements.map((placement) => db.storyRevision.create({ data: { entityType: "PLACEMENT", entityId: placement.id, action: "DELETED", actorUserId: author.id, summary: `Removed obsolete overlay "${placement.entry.title}" from ${seed.title}`, before: { map: seed.slug, entry: placement.entry.slug } } })),
        db.storyMapPlacement.deleteMany({ where: { id: { in: stalePlacements.map((placement) => placement.id) } } }),
      ]);
    }

    const retainedNodePlacementIds: string[] = [];
    for (const placementSeed of seed.nodePlacements ?? []) {
      const node = await db.storyNode.findFirst({ where: { key: placementSeed.node, arc: { slug: placementSeed.arc } }, select: { id: true, title: true } });
      if (!node) throw new Error(`Missing quest node ${placementSeed.arc}/${placementSeed.node}`);
      const existing = await db.storyMapNodePlacement.findUnique({ where: { mapId_nodeId: { mapId: map.id, nodeId: node.id } }, select: { id: true } });
      const placementData = {
        geometryKind: placementSeed.geometry.type,
        geometry: placementSeed.geometry as unknown as Prisma.InputJsonValue,
        labelX: placementSeed.label?.[0] ?? null,
        labelY: placementSeed.label?.[1] ?? null,
        minZoom: placementSeed.minZoom ?? 0,
        maxZoom: placementSeed.maxZoom ?? null,
        priority: placementSeed.priority,
        version: existing ? 2 : 1,
        updatedByUserId: author.id,
      };
      const placement = await db.storyMapNodePlacement.upsert({
        where: { mapId_nodeId: { mapId: map.id, nodeId: node.id } },
        update: placementData,
        create: { mapId: map.id, nodeId: node.id, ...placementData, createdByUserId: author.id },
      });
      retainedNodePlacementIds.push(placement.id);
      await db.storyRevision.create({
        data: {
          entityType: "PLACEMENT",
          entityId: placement.id,
          action: existing ? "MOVED" : "CREATED",
          actorUserId: author.id,
          summary: `${existing ? "Calibrated" : "Placed"} quest marker "${node.title}" on ${seed.title}`,
          after: { map: seed.slug, arc: placementSeed.arc, node: placementSeed.node, geometry: placementSeed.geometry as unknown as Prisma.InputJsonValue },
        },
      });
    }
    const staleNodePlacements = await db.storyMapNodePlacement.findMany({ where: { mapId: map.id, id: { notIn: retainedNodePlacementIds } }, select: { id: true, node: { select: { key: true, title: true, arc: { select: { slug: true } } } } } });
    if (staleNodePlacements.length) {
      await db.$transaction([
        ...staleNodePlacements.map((placement) => db.storyRevision.create({ data: { entityType: "PLACEMENT", entityId: placement.id, action: "DELETED", actorUserId: author.id, summary: `Removed obsolete quest overlay "${placement.node.title}" from ${seed.title}`, before: { map: seed.slug, arc: placement.node.arc.slug, node: placement.node.key } } })),
        db.storyMapNodePlacement.deleteMany({ where: { id: { in: staleNodePlacements.map((placement) => placement.id) } } }),
      ]);
    }
    console.log(`  calibrated ${seed.slug}: ${seed.placements.length} places, ${seed.nodePlacements?.length ?? 0} quests`);
  }
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
