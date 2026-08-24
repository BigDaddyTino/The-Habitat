import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { regionMetaSchema } from "../lib/story-meta-schemas";

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
    meta: { ...blankPlace, type: "region", parent: "the-peninsula", biome: "river floodplain, wetlands, and fertile lowland", connections: ["high-cliffs", "grand-rift", "the-desert", "magic-torn-wasteland", "the-peninsula"].map((to) => ({ to, by: "river corridor", notes: "A Riverlands branch carries buildable ground into the neighboring biome." })), status: "Established macro region; major city still unnamed.", openQuestions: ["What is the Riverlands' major city called, and which faction holds it?"] },
  },
  {
    slug: "high-cliffs",
    title: "The High Cliffs",
    summary: "Monumental northern heights enclosing the Grand Lake, feeding the lowlands through enormous waterfalls.",
    body: "The High Cliffs form Martino's northern crown: monumental vertical terrain around the elevated Grand Lake. Water leaves the heights in immense waterfalls and becomes the Riverlands below. The Floating City occupies the sky above or immediately beside the lake, while cliff roads, mining settlements, military lifts, and river-cut approaches make the region visibly inhabited rather than untouched wilderness.",
    meta: { ...blankPlace, type: "region", parent: "the-peninsula", biome: "alpine cliffs, elevated lake, and waterfall valleys", connections: [{ to: "riverlands", by: "waterfalls and river valleys", notes: "The Grand Lake feeds the central watershed." }], status: "Established macro region; the Floating City is its major city.", openQuestions: ["What is the Floating City's final proper name?"] },
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
    meta: { ...blankPlace, type: "region", parent: "the-peninsula", biome: "red forest, shattered canyon, and toxic rift depths", connections: [{ to: "riverlands", by: "rift river corridor", notes: "A buildable river arm reaches into the broken country." }], status: "Established macro region; major city still unnamed.", openQuestions: ["What is the Grand Rift's major city called, and who built it?"] },
  },
  {
    slug: "the-red-forest",
    title: "The Red Forest",
    summary: "A vast, dense red woodland whose growth pushes deep into the Grand Rift and Death Canyon transition.",
    body: "The Red Forest does not stop at a neat canyon border. Its dense red canopy advances into broken shelves and ravines, thinning only as the Grand Rift becomes too fractured and toxic to hold it. The atlas should always show this long, irregular transition rather than two biomes meeting at a hard line.",
    meta: { ...blankPlace, type: "zone", parent: "grand-rift", biome: "dense crimson forest over broken canyon shelves", connections: [{ to: "death-canyon", by: "fractured forest shelves", notes: "The red canopy dies back gradually inside the canyon." }], status: "Established biome transition.", openQuestions: [] },
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
    meta: { ...blankPlace, type: "region", parent: "the-peninsula", biome: "desert, badlands, and river oases", connections: [{ to: "riverlands", by: "oasis river corridor", notes: "Fertile, buildable ground follows the water into the desert." }], status: "Established macro region; major city still unnamed.", openQuestions: ["What is the desert's major city called?", "How much authority does the Desert Nomad Compact exercise there?"] },
  },
  {
    slug: "magic-torn-wasteland",
    title: "The Magic-Torn Wasteland",
    summary: "A spectacular northeastern end-game region where weather, gravity, terrain, and physical law visibly fail.",
    body: "The Magic-Torn Wasteland is charged earth under violent shifting weather: luminous faults, lightning, unstable ground, floating fragments, gravity anomalies, and zones where normal physical law visibly fails. It still belongs to Martino's near-future civilization—a fortified major city and engineered infrastructure stand against the impossible—but the city's name and ruler are not yet canon.",
    meta: { ...blankPlace, type: "region", parent: "the-peninsula", biome: "reality-torn magical wasteland", connections: [{ to: "riverlands", by: "stabilized river corridor", notes: "A Riverlands branch provides one buildable approach into the end-game zone." }], status: "Established end-game macro region; major city still unnamed.", openQuestions: ["What is the shielded city's name?", "Which faction can keep the city's reality defenses running?"] },
  },
  {
    slug: "unknown-southeast",
    title: "Unknown Southeast",
    summary: "A deliberately unresolved southeastern macro region reserved for future world needs.",
    body: "This southeastern territory is intentionally unknown. Its gray presentation is a design lock, not missing work: do not invent ecology, cities, factions, hazards, or lore until the world needs them and an author explicitly establishes them.",
    meta: { ...blankPlace, type: "region", parent: "the-peninsula", biome: null, connections: [], status: "Unknown by design; no city or faction may be inferred.", openQuestions: ["What does the wider game eventually need this region to become?"] },
  },
] as const;

type Point = readonly [number, number];
const point = (x: number, y: number) => ({ type: "POINT", coordinates: [x, y] as Point } as const);
const polygon = (points: readonly Point[]) => ({ type: "POLYGON", coordinates: [[...points, points[0]]] } as const);
type PlacementSeed = {
  slug: string;
  geometry: ReturnType<typeof point> | ReturnType<typeof polygon>;
  label?: Point;
  priority: number;
  minZoom?: number;
};

const placements: readonly PlacementSeed[] = [
  { slug: "high-cliffs", geometry: polygon([[25000, 1500], [67000, 1000], [71000, 13000], [61500, 19000], [35000, 18500], [22000, 10000]]), label: [49000, 5400], priority: 100 },
  { slug: "grand-lake", geometry: polygon([[38500, 5000], [58500, 4200], [64000, 9000], [58000, 12500], [40000, 12000], [35000, 8300]]), label: [49500, 8000], priority: 110 },
  { slug: "the-floating-city", geometry: point(50000, 8500), label: [50000, 8500], priority: 180, minZoom: 0.5 },
  { slug: "grand-rift", geometry: polygon([[0, 2500], [27000, 3000], [35500, 17000], [32000, 34500], [8000, 39000], [0, 30000]]), label: [14500, 12500], priority: 100 },
  { slug: "the-red-forest", geometry: polygon([[12000, 18000], [36000, 16000], [43000, 28500], [33000, 38500], [11000, 33000], [5000, 24500]]), label: [23500, 24500], priority: 115 },
  { slug: "death-canyon", geometry: polygon([[0, 18500], [17500, 14500], [31000, 22500], [30000, 35000], [9000, 39000], [0, 31000]]), label: [13500, 29000], priority: 125 },
  { slug: "the-desert", geometry: polygon([[0, 32500], [23000, 31000], [37000, 41500], [33000, 53500], [0, 54500]]), label: [17000, 44000], priority: 100 },
  { slug: "riverlands", geometry: polygon([[35000, 13500], [43000, 9000], [47500, 21000], [65000, 16000], [57500, 28500], [78000, 35000], [56500, 38500], [49000, 52000], [40500, 39000], [27000, 43500], [34000, 31500], [20500, 24500], [39500, 26500]]), label: [47000, 28500], priority: 105 },
  { slug: "magic-torn-wasteland", geometry: polygon([[65000, 0], [100000, 0], [100000, 24000], [80500, 28000], [62000, 16000]]), label: [82000, 12500], priority: 100 },
  { slug: "unknown-southeast", geometry: polygon([[72000, 24500], [100000, 23000], [100000, 52000], [78000, 50500], [65000, 37500]]), label: [84000, 37500], priority: 90 },
  { slug: "the-peninsula", geometry: polygon([[37000, 34000], [65000, 32500], [66500, 43000], [60000, 52000], [57500, 63500], [47000, 65000], [40500, 55500], [33000, 47000]]), label: [50500, 47500], priority: 105 },
  { slug: "port-arcadia", geometry: point(52500, 59600), label: [52500, 59600], priority: 220, minZoom: 0 },
  { slug: "the-starting-island", geometry: point(33500, 60100), label: [33500, 60100], priority: 215, minZoom: 0 },
  { slug: "the-ocean", geometry: point(78500, 58000), label: [78500, 58000], priority: 70, minZoom: 0 },
  { slug: "stormglass-landing", geometry: point(32100, 60800), priority: 160, minZoom: 2.8 },
  { slug: "shattermarket", geometry: point(32900, 60200), priority: 165, minZoom: 3.2 },
  { slug: "forward-camp-kestrel", geometry: point(33700, 59800), priority: 175, minZoom: 3.2 },
  { slug: "glasswater-village", geometry: point(32800, 59100), priority: 160, minZoom: 3.2 },
  { slug: "blackreef-harbour", geometry: point(33500, 58700), priority: 155, minZoom: 3.2 },
  { slug: "northwatch-relay", geometry: point(34200, 59000), priority: 150, minZoom: 3.5 },
  { slug: "fort-tempest", geometry: point(34800, 59400), priority: 170, minZoom: 3.2 },
  { slug: "stormglass-quarry", geometry: point(34600, 60100), priority: 160, minZoom: 3.2 },
  { slug: "riftwood-interior", geometry: point(34000, 60300), priority: 160, minZoom: 3.5 },
  { slug: "pearl-beachhead", geometry: point(34600, 61000), priority: 170, minZoom: 3.2 },
] as const;

async function main() {
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

  if (!apply) { console.log(`  would create/retain atlas scene and ${placements.length} placements`); return; }
  const map = await db.storyMap.upsert({
    where: { slug: "martino-world" },
    update: {},
    create: { slug: "martino-world", title: "Martino World Atlas", artVersion: "v1", imageWidth: 1536, imageHeight: 1024, coordinateWidth: 100000, coordinateHeight: 66667, initialCenterX: 50000, initialCenterY: 33333, initialZoom: 0, minZoom: 0, maxZoom: 8, createdByUserId: author.id },
  });
  const mapRevision = await db.storyRevision.findFirst({ where: { entityType: "MAP", entityId: map.id, action: "CREATED" }, select: { id: true } });
  if (!mapRevision) await db.storyRevision.create({ data: { entityType: "MAP", entityId: map.id, action: "CREATED", actorUserId: author.id, summary: "Locked the approved V2 geography as the Martino world atlas", after: { slug: map.slug, artVersion: map.artVersion, coordinateWidth: map.coordinateWidth, coordinateHeight: map.coordinateHeight } } });

  for (const seed of placements) {
    const entry = await db.storyEntry.findUnique({ where: { slug: seed.slug }, select: { id: true, title: true } });
    if (!entry) { console.log(`  unplaced missing ${seed.slug}`); continue; }
    const existing = await db.storyMapPlacement.findUnique({ where: { mapId_entryId: { mapId: map.id, entryId: entry.id } }, select: { id: true } });
    if (existing) { console.log(`  keep placement  ${seed.slug}`); continue; }
    await db.$transaction(async (tx) => {
      const placement = await tx.storyMapPlacement.create({ data: { mapId: map.id, entryId: entry.id, geometryKind: seed.geometry.type, geometry: seed.geometry as unknown as Prisma.InputJsonValue, ...(seed.label ? { labelX: seed.label[0], labelY: seed.label[1] } : {}), minZoom: seed.minZoom ?? 0, priority: seed.priority, createdByUserId: author.id } });
      await tx.storyRevision.create({ data: { entityType: "PLACEMENT", entityId: placement.id, action: "CREATED", actorUserId: author.id, summary: `Placed "${entry.title}" on the Martino world atlas`, after: { map: map.slug, entry: seed.slug, geometry: seed.geometry as unknown as Prisma.InputJsonValue } } });
    });
  }
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
