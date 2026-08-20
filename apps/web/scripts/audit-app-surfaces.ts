import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { randomBytes } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Walks the whole app as an administrator and checks two directions at once:
 *
 *  - every internal link resolves (nothing dead)
 *  - every form field is actually received by the action it posts to (nothing
 *    a member can type that the database never hears about)
 *
 * The second cannot be seen by clicking around: a renamed field, or one added
 * to a form and forgotten in the parser, saves nothing and reports success.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/audit-app-surfaces.ts
 *
 * Read-only apart from the throwaway session it signs in with, which it
 * deletes on the way out. Point it at a running build with AUDIT_BASE.
 */
const db = getPrismaClient();
const BASE = process.env.AUDIT_BASE ?? "http://127.0.0.1:3000";

const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")) as { node: Record<string, { exportedName: string }> };
const actionName = new Map(Object.entries(manifest.node).map(([id, v]) => [id, v.exportedName]));

const escapeRe = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, (ch) => `\\${ch}`);

/** Every server-action body, with its whole module beside it. */
function actionSources() {
  const sources = new Map<string, { body: string; module: string }>();
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) { if (name !== "node_modules" && name !== ".next") walk(path); continue; }
      if (!name.endsWith(".ts") && !name.endsWith(".tsx")) continue;
      const text = readFileSync(path, "utf8");
      if (!text.startsWith('"use server"') && !text.startsWith("'use server'")) continue;
      const pattern = /^export async function (\w+)\(/gm;
      const starts: Array<{ name: string; at: number }> = [];
      for (let m = pattern.exec(text); m; m = pattern.exec(text)) starts.push({ name: m[1], at: m.index });
      starts.forEach((start, i) => sources.set(start.name, { body: text.slice(start.at, starts[i + 1]?.at ?? text.length), module: text }));
    }
  };
  walk("app");
  walk("lib");
  return sources;
}

type Finding = { severity: "BROKEN" | "UNREAD"; where: string; what: string };
const findings: Finding[] = [];
const note = (severity: Finding["severity"], where: string, what: string) => findings.push({ severity, where, what });

async function main() {
  const bodies = actionSources();
  const admin = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
  const token = randomBytes(32).toString("hex");
  await db.session.create({ data: { sessionToken: token, userId: admin.id, expires: new Date(Date.now() + 3600_000) } });
  const cookie = `__Secure-authjs.session-token=${token}`;

  const [entries, arcs, members, worlds, chronicled, events, activities, identities] = await Promise.all([
    db.storyEntry.findMany({ where: { status: { in: ["DRAFT", "PROPOSED", "CANON"] } }, select: { slug: true } }),
    db.storyArc.findMany({ select: { slug: true } }),
    db.user.findMany({ where: { username: { not: null } }, select: { username: true }, take: 5 }),
    db.gameServer.findMany({ select: { slug: true }, take: 5 }),
    // Only seasons whose chronicle is actually written: the archive links a
    // completed season the moment it exists, and the chronicle page answers
    // 404 until the snapshot is taken. That gap is a state, not a dead link,
    // and the seasons page renders it as an inert card rather than a door.
    db.season.findMany({ where: { chronicle: { isNot: null } }, select: { slug: true }, take: 5 }),
    db.serverEvent.findMany({ select: { id: true }, take: 3 }),
    db.gameActivity.findMany({ select: { id: true }, take: 3 }),
    db.playerIdentity.findMany({ select: { id: true }, take: 3 }),
  ]);

  const allSeasons = await db.season.findMany({ select: { slug: true }, take: 5 });
  const collections = ["characters", "factions", "regions", "races", "items", "events", "themes", "rules", "systems", "companion-missions"];
  const routes = [
    "/", "/achievements", "/chronicle", "/club-games", "/club-games/marvel-rivals", "/departure-board", "/games",
    "/hall-of-legends", "/hall-of-shame", "/halls", "/leaderboards", "/leaderboards/season", "/members", "/polls",
    "/privacy", "/profile", "/profile/identities", "/quests", "/records", "/seasons", "/streams", "/worlds",
    "/dev/season-trophies",
    "/admin", "/admin/claims", "/admin/community", "/admin/discord", "/admin/members", "/admin/operations", "/admin/pulse",
    "/admin/seasons", "/admin/servers", "/admin/story", "/admin/titles",
    "/codex", "/codex/bible", "/codex/timeline", "/codex/threads", "/codex/promises", "/codex/review",
    "/codex/stories", "/codex/stories/canon", "/codex/stories/campaign",
    ...collections.map((c) => `/codex/library/${c}`),
    ...arcs.map((a) => `/codex/arc/${a.slug}`),
    ...entries.map((e) => `/codex/bible/${e.slug}`),
    ...members.map((m) => `/members/${m.username}`),
    ...worlds.map((w) => `/worlds/${w.slug}`),
    ...chronicled.map((s) => `/seasons/${s.slug}/chronicle`),
    ...allSeasons.map((s) => `/admin/seasons/${s.slug}`),
    ...events.map((e) => `/chronicle/${e.id}`),
    ...activities.map((a) => `/chronicle/activity/${a.id}`),
    ...identities.map((i) => `/chronicle/identity/${i.id}`),
    ...identities.map((i) => `/admin/claims/${i.id}`),
  ];

  const html = new Map<string, string>();
  const load = async (path: string) => {
    if (html.has(path)) return html.get(path) as string;
    const res = await fetch(`${BASE}${path}`, { headers: { cookie }, redirect: "follow" });
    if (new URL(res.url).pathname.startsWith("/sign-in")) { note("BROKEN", path, "bounces to sign-in as an administrator"); html.set(path, ""); return ""; }
    if (res.status !== 200) { note("BROKEN", path, `returned ${res.status}`); html.set(path, ""); return ""; }
    const body = await res.text();
    html.set(path, body);
    return body;
  };

  for (const route of routes) await load(route);

  const links = new Set<string>();
  for (const body of html.values()) for (const m of body.matchAll(/href="(\/[^"#?]*)/g)) links.add(m[1]);
  let checked = 0;
  for (const href of links) {
    if (html.has(href)) continue;
    if (/\.(png|jpg|jpeg|webp|svg|ico|gif|mp4|json|txt|xml|avif)$/i.test(href)) continue;
    checked += 1;
    const res = await fetch(`${BASE}${href}`, { headers: { cookie }, redirect: "follow" });
    if (new URL(res.url).pathname.startsWith("/sign-in")) note("BROKEN", href, "linked from a page but bounces to sign-in");
    else if (res.status !== 200) note("BROKEN", href, `linked from a page but returned ${res.status}`);
  }

  let forms = 0;
  const seenActions = new Set<string>();
  for (const [path, body] of html) {
    for (const form of body.matchAll(/<form[^>]*>([\s\S]*?)<\/form>/g)) {
      const inner = form[1];
      const ids = [...inner.matchAll(/name="\$ACTION_ID_([a-f0-9]+)"/g)].map((m) => m[1]);
      if (ids.length === 0) continue;
      forms += 1;
      for (const id of ids) {
        const name = actionName.get(id);
        if (!name) { note("BROKEN", path, `form posts to unknown action id ${id}`); continue; }
        seenActions.add(name);
        const source = bodies.get(name);
        if (!source) { note("BROKEN", path, `form posts to ${name}, which is not an exported server action`); continue; }
        const fields = new Set([...inner.matchAll(/\sname="([^"$][^"]*)"/g)].map((m) => m[1]));
        for (const field of fields) {
          const safe = escapeRe(field);
          // Three legitimate ways an action receives a field: it asks for it by
          // name, it hands the whole FormData to a schema that names it, or it
          // reaches the name through a helper. Only a field the code never
          // mentions at all is one the database never hears about.
          const asks = new RegExp("formData\\.(get|getAll)\\(\\s*[\"'`]" + safe + "[\"'`]").test(source.body);
          const viaSchema = /Object\.fromEntries\(\s*formData/.test(source.body) && new RegExp("(^|[^\\w.])" + safe + "\\s*:", "m").test(source.module);
          const mentioned = new RegExp("[\"'`]" + safe + "[\"'`]").test(source.body);
          // An action that hands its FormData to a helper in the same module
          // is reading the field through that helper, which is how memberId()
          // and readArcForm() work. Follow the delegation into the module.
          const delegates = source.body.includes("(formData");
          const viaHelper = delegates && new RegExp("[\"'`]" + safe + "[\"'`]").test(source.module);
          if (!asks && !viaSchema && !mentioned && !viaHelper) note("UNREAD", path, `${name}() never receives the field "${field}" its own form submits`);
        }
      }
    }
  }

  const unreached = [...bodies.keys()].filter((name) => !seenActions.has(name));

  console.log(`pages loaded: ${html.size}   links checked: ${checked}   progressive-enhancement forms: ${forms}`);
  console.log(`server actions: ${bodies.size}   reached by a rendered form: ${seenActions.size}`);
  for (const label of ["BROKEN", "UNREAD"] as const) {
    const rows = findings.filter((f) => f.severity === label);
    console.log(`\n${label}: ${rows.length}`);
    const seen = new Set<string>();
    for (const row of rows) {
      if (seen.has(row.what)) continue;
      seen.add(row.what);
      console.log(`  ${row.where} — ${row.what}`);
    }
  }
  console.log(`\nactions no rendered form posts to (${unreached.length}):\n  ${unreached.join(", ")}`);
  console.log(`\n${findings.length === 0 ? "PASS" : "FAIL"} — ${findings.length} finding(s)`);

  await db.session.deleteMany({ where: { sessionToken: token } });
}

main().then(() => db.$disconnect(), (e) => { console.error(e); return db.$disconnect().then(() => process.exit(1)); });
