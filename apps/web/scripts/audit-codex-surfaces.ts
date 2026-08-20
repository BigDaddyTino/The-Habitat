import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

/**
 * Walks every codex surface as a signed-in writer and checks that the things
 * you can click are actually there and actually wired:
 *
 *  - every internal link resolves (no dead ends, no 404s)
 *  - every form posts to a server action that exists in the build manifest
 *  - the affordances each page is supposed to offer are present (add, edit,
 *    archive, the pickers a new entry needs to connect itself to the world)
 *  - no page is missing the controls its siblings have
 *
 *   pnpm --filter @habitat/web exec tsx scripts/audit-codex-surfaces.ts
 *
 * Read-only: it never submits a form.
 */
const db = getPrismaClient();
const BASE = process.env.AUDIT_BASE ?? "http://127.0.0.1:3000";

const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")) as {
  node: Record<string, { filename: string; exportedName: string }>;
};
const actionById = new Map(Object.entries(manifest.node).map(([id, v]) => [id, v.exportedName]));

type Finding = { severity: "BROKEN" | "MISSING"; where: string; what: string };
const findings: Finding[] = [];
const note = (severity: Finding["severity"], where: string, what: string) => findings.push({ severity, where, what });

async function main() {
  const user = await db.user.findFirstOrThrow({ where: { role: "USER", isActive: true }, select: { id: true, username: true } });
  const admin = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, select: { id: true, username: true } });
  const tokens: Record<string, string> = {};
  for (const [label, u] of [["writer", user], ["admin", admin]] as const) {
    const t = randomBytes(32).toString("hex");
    await db.session.create({ data: { sessionToken: t, userId: u.id, expires: new Date(Date.now() + 3600_000) } });
    tokens[label] = t;
  }
  const cookieFor = (who: "writer" | "admin") => `__Secure-authjs.session-token=${tokens[who]}`;

  const status = new Map<string, number>();
  const html = new Map<string, string>();
  /**
   * Follows redirects deliberately: legacy routes such as /codex/arc/x/flow
   * answer 308 into the surface that replaced them, and a permanent redirect
   * that lands somewhere real is a working link, not a dead one. What must
   * never happen is a redirect into sign-in — that means the page lost its
   * session gate, which this reports as broken.
   */
  async function load(path: string, who: "writer" | "admin" = "writer") {
    const key = `${who}:${path}`;
    if (html.has(key)) return html.get(key) ?? "";
    const res = await fetch(`${BASE}${path}`, { headers: { cookie: cookieFor(who) }, redirect: "follow" });
    const landedOnSignIn = new URL(res.url).pathname.startsWith("/sign-in");
    status.set(key, landedOnSignIn ? 401 : res.status);
    const body = res.status === 200 && !landedOnSignIn ? await res.text() : "";
    html.set(key, body);
    return body;
  }

  const [entries, arcs] = await Promise.all([
    db.storyEntry.findMany({ where: { status: { in: ["DRAFT", "PROPOSED", "CANON"] } }, select: { slug: true, kind: true, title: true } }),
    db.storyArc.findMany({ where: { status: { in: ["DRAFT", "PROPOSED", "CANON"] } }, select: { slug: true } }),
  ]);

  const collections = ["characters", "factions", "regions", "races", "items", "events", "themes", "rules", "systems", "companion-missions"];
  const surfaces = [
    "/codex", "/codex/bible", "/codex/timeline", "/codex/threads", "/codex/promises",
    ...collections.map((c) => `/codex/library/${c}`),
    ...arcs.map((a) => `/codex/arc/${a.slug}`),
    ...arcs.map((a) => `/codex/arc/${a.slug}/flow`),
    ...entries.map((e) => `/codex/bible/${e.slug}`),
  ];

  // --- every surface loads, and every link on it resolves --------------------
  const links = new Set<string>();
  for (const path of surfaces) {
    const body = await load(path);
    if ((status.get(`writer:${path}`) ?? 0) !== 200) { note("BROKEN", path, `page returned ${status.get(`writer:${path}`)}`); continue; }
    for (const m of body.matchAll(/href="(\/(?:codex|codex-art)[^"#?]*)/g)) links.add(m[1]);
  }
  for (const href of links) {
    if (html.has(`writer:${href}`)) continue;
    const res = await fetch(`${BASE}${href}`, { headers: { cookie: cookieFor("writer") }, redirect: "follow" });
    if (new URL(res.url).pathname.startsWith("/sign-in")) note("BROKEN", href, "linked from a codex page but bounces to sign-in");
    else if (res.status !== 200) note("BROKEN", href, `linked from a codex page but returned ${res.status}`);
  }

  // --- every form posts to an action that exists -----------------------------
  let formCount = 0;
  for (const path of surfaces) {
    const body = html.get(`writer:${path}`) ?? "";
    for (const form of body.matchAll(/<form[^>]*>([\s\S]*?)<\/form>/g)) {
      formCount += 1;
      const inner = form[1];
      const ids = [...inner.matchAll(/name="\$ACTION_ID_([a-f0-9]+)"/g)].map((m) => m[1]);
      // Client-rendered forms bind their action in JS, so only progressive
      // -enhancement forms carry the id in markup; those are the ones that
      // must resolve, and a stale id is a button that silently does nothing.
      for (const id of ids) if (!actionById.has(id)) note("BROKEN", path, `form posts to unknown action id ${id}`);
    }
  }

  // --- the affordances each surface must offer -------------------------------
  const must = (path: string, label: string, needle: string | RegExp, who: "writer" | "admin" = "writer") => {
    const body = html.get(`${who}:${path}`) ?? "";
    const ok = typeof needle === "string" ? body.includes(needle) : needle.test(body);
    if (!ok) note("MISSING", path, label);
  };

  for (const collection of collections) {
    const path = `/codex/library/${collection}`;
    must(path, "create panel", "new-entry");
    must(path, "name field on the create form", 'name="title"');
    must(path, "kind carried on the create form", 'name="kind"');
    must(path, "summary field on the create form", 'name="summary"');
    must(path, "search box", 'name="q"');
  }
  // The landing page headlines the current core system.
  must("/codex", "core system spotlight", "codex-system-spotlight");

  // Places and systems must offer the parent picker at creation, or new work
  // arrives orphaned and has to be adopted afterwards.
  must("/codex/library/regions", "parent picker on the create form", 'name="parent"');
  must("/codex/library/regions", "place-kind picker on the create form", 'name="placeKind"');
  must("/codex/library/systems", "parent picker on the create form", 'name="parent"');

  for (const entry of entries) {
    const path = `/codex/bible/${entry.slug}`;
    must(path, "edit workspace", "entry-edit-workspace");
    must(path, "title field", 'name="title"');
    must(path, "version guard on the editor", 'name="version"');
    must(path, "archive control", /archiveEntry|Archive entry|ARCHIVE ENTRY/i);
    must(path, "note box", 'name="body"');
    const sheetKinds = ["CHARACTER", "FACTION", "REGION", "CREATURE", "ITEM", "EVENT", "SYSTEM"];
    if (sheetKinds.includes(entry.kind)) must(path, `${entry.kind} sheet`, "entry-sheet");
  }

  for (const arc of arcs) {
    const path = `/codex/arc/${arc.slug}`;
    must(path, "arc settings", "Arc settings");
    must(path, "lock control", "flow-lock");
  }

  // --- locks: none held, and the control reads as unlocked -------------------
  const lockedArcs = await db.storyArc.findMany({ where: { lockedAt: { not: null } }, select: { slug: true } });
  for (const arc of lockedArcs) note("BROKEN", `/codex/arc/${arc.slug}`, "arc is locked — nothing should be locked yet");
  for (const arc of arcs) must(`/codex/arc/${arc.slug}`, "flow reads as unlocked", "Lock this flow");

  // --- report ----------------------------------------------------------------
  console.log(`surfaces: ${surfaces.length} (${entries.length} entries, ${arcs.length} arcs, ${collections.length} libraries)`);
  console.log(`links followed: ${links.size} distinct`);
  console.log(`forms seen: ${formCount}`);
  console.log(`arcs locked: ${lockedArcs.length}`);
  const broken = findings.filter((f) => f.severity === "BROKEN");
  const missing = findings.filter((f) => f.severity === "MISSING");
  const report = (label: string, rows: Finding[]) => {
    console.log(`\n${label}: ${rows.length}`);
    for (const row of rows.slice(0, 60)) console.log(`  ${row.where} — ${row.what}`);
    if (rows.length > 60) console.log(`  … and ${rows.length - 60} more`);
  };
  report("BROKEN — dead links or dead actions", broken);
  report("MISSING — an affordance a surface should offer", missing);
  console.log(`\n${findings.length === 0 ? "PASS" : "FAIL"} — ${findings.length} problem(s)`);

  for (const t of Object.values(tokens)) await db.session.deleteMany({ where: { sessionToken: t } });
  if (findings.length > 0) process.exitCode = 1;
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
