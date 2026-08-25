import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(process.cwd(), "..", "..");
test("Atlas author mutations are narrow, ADMIN-authorized, and development guarded", async () => {
  const actions = await readFile(path.join(root, "apps/web/app/admin/story/atlas/actions.ts"), "utf8");
  assert.match(actions, /requireRole\("ADMIN"\)/);
  assert.match(actions, /assertAtlasAuthoringEnvironment\(\)/);
  assert.match(actions, /atlasPersistence\.updateTopologyNode/);
  assert.match(actions, /atlasPersistence\.updateBoundary/);
  assert.match(actions, /atlasPersistence\.splitBoundaryAtInteriorVertex/);
  assert.match(actions, /atlasPersistence\.createPointPlacement/);
  assert.match(actions, /atlasPersistence\.updatePointPlacement/);
  assert.match(actions, /atlasPersistence\.createWorldConnection/);
  assert.match(actions, /atlasPersistence\.updateWorldConnection/);
  assert.match(actions, /atlasPersistence\.deleteWorldConnection/);
  assert.match(actions, /atlasPersistence\.(?:create|update)ConnectionPath/);
  assert.doesNotMatch(actions, /getPrismaClient|\.\$executeRaw|\.\$queryRaw/);
  assert.doesNotMatch(actions, /^export const /m, 'A "use server" module may export only async actions and erased types.');
});

test("Atlas author workbench starts safe and separates destructive modes", async () => {
  const component = await readFile(path.join(root, "apps/web/components/atlas-authoring-workbench.tsx"), "utf8");
  for (const mode of ["SELECT", "REGIONS", "POIS", "LABELS", "CONNECTIONS"]) assert.match(component, new RegExp(`\\"${mode}\\"`));
  assert.match(component, /Unsaved changes/);
  assert.match(component, /Discard unsaved Atlas preview changes/);
  assert.match(component, /Remove placement only/);
  assert.match(component, /Remove path from this map/);
  assert.match(component, /Draw Path/);
  assert.match(component, /drag handles to move/);
  assert.match(component, /Split boundary transactionally/);
  assert.match(component, /Delete selected vertex/);
  assert.match(component, /setDragBoundaryVertex/);
  assert.match(component, /DELETE WORLD CONNECTION/);
  assert.match(component, /Preview Player View/);
});

test("production admin navigation does not advertise the development Atlas editor", async () => {
  const layout = await readFile(path.join(root, "apps/web/app/admin/layout.tsx"), "utf8");
  const nav = await readFile(path.join(root, "apps/web/components/admin-suite-nav.tsx"), "utf8");
  assert.match(layout, /atlasAuthoringEnvironmentAvailable\(\)/);
  assert.match(nav, /item\.href !== "\/admin\/story\/atlas" \|\| atlasAuthoringAvailable/);
});
