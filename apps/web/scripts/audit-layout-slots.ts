import "../lib/environment";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getPrismaClient } from "@habitat/db/client";
import { randomBytes } from "node:crypto";

/**
 * Layout audit: the class of UI bug that shipped on the factions page.
 *
 * Every faction card is a CSS grid with a **fixed leading column** for its
 * emblem — `62px minmax(0,1fr) auto` and friends. When the emblem is rendered
 * conditionally and the faction has no branding yet, the emblem is simply
 * absent, so every following child shifts one column left: the title and its
 * whole summary land in the 62px column and the arrow floats in the middle of
 * the card. Nothing errors. Nothing fails a build. It just looks broken, and
 * only for the entries nobody has drawn yet — which is always the newest work.
 *
 * Two checks, one static and one live:
 *
 *   A · SOURCE — for every grid whose first track is a fixed pixel width, the
 *       component that fills it must not render that first child behind a
 *       ternary. Reported by reading the CSS and the components together.
 *
 *   B · LIVE — walk the real surfaces as a signed-in writer and count, for
 *       every card that uses one of those grids, whether the slot is filled.
 *       This is the check that would have caught the Nation-State.
 *
 * Read-only. Needs the site running.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/audit-layout-slots.ts
 */

const db = getPrismaClient();
const BASE = process.env.AUDIT_BASE ?? "http://127.0.0.1:3000";
const root = process.cwd();

type Finding = { severity: "BROKEN" | "RISK"; where: string; what: string };
const findings: Finding[] = [];
const note = (severity: Finding["severity"], where: string, what: string) => findings.push({ severity, where, what });

/**
 * Grids with a fixed leading track, and the element expected to occupy it.
 * Kept as data so a new one is a line here rather than a bug in production.
 */
const slotted = [
  { grid: ".faction-banner-identity", slot: "faction-emblem", surface: "/codex/library/factions", card: "faction-banner-card" },
  { grid: ".faction-independent-copy", slot: "faction-emblem", surface: "/codex/library/factions", card: "faction-independent-card" },
  { grid: ".faction-wing-list li a", slot: "faction-emblem", surface: "/codex/library/factions", card: "faction-wing-list" },
  { grid: ".character-profile-affiliations>a", slot: "faction-emblem|<img", surface: null, card: "character-profile-affiliations" },
  { grid: ".region-atlas-places>ul>li>a", slot: "region-place-fallback|<img", surface: null, card: "region-atlas-places" },
  { grid: ".entity-contained-places li", slot: "region-place-fallback|<img", surface: null, card: "entity-contained-places" },
] as const;

// --------------------------------------------------------------- A · source

const components = ["components/story-entity-directory.tsx", "components/story-entity-profile.tsx"];

function auditSource() {
  const css = ["app/codex-workspace.css", "app/codex.css", "app/codex-script.css"]
    .map((file) => readFileSync(path.join(root, file), "utf8")).join("\n");
  const jsx = components.map((file) => readFileSync(path.join(root, file), "utf8")).join("\n/*----*/\n");

  for (const entry of slotted) {
    // 1. Is the leading track still a fixed width? If not, the whole hazard
    //    is gone and nothing below matters.
    const escaped = entry.grid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rule = new RegExp(`${escaped}\\s*[,{][^}]*grid-template-columns:\\s*([^;}]+)`).exec(css);
    if (!rule) { note("RISK", entry.grid, "no grid-template-columns found — the rule moved, and this audit is now blind to it"); continue; }
    const firstTrack = rule[1]!.trim().split(/\s+/)[0]!;
    if (!/^\d+px$/.test(firstTrack)) continue;

    // 2. The check that survives whatever art happens to exist today. In the
    //    JSX that opens this grid, the very first child must not be a ternary
    //    whose other branch is `null` — that is the shape that removes the
    //    element and shifts every sibling one column left. A ternary is fine
    //    when BOTH branches render something, which is how the regions atlas
    //    has always done it.
    const className = entry.grid.replace(/^\./, "").split(/[ >]/)[0]!;
    let searched = 0;
    let found = 0;
    for (;;) {
      const at = jsx.indexOf(`"${className}"`, searched);
      if (at < 0) break;
      searched = at + 1;
      found += 1;
      const window = jsx.slice(at, at + 260);
      if (window.includes(": null}")) {
        note("BROKEN", `${entry.grid} (source)`, `its first child is rendered behind a ternary that can produce null — with a fixed ${firstTrack} leading track, an absent child shifts every sibling one column left`);
      }
    }
    if (found === 0) note("RISK", `${entry.grid} (source)`, "no component renders this class — the markup moved and this audit is blind to it");
  }
}

// ----------------------------------------------------------------- B · live

async function auditLive(cookie: string) {
  const factions = await fetch(`${BASE}/codex/library/factions`, { headers: { cookie }, redirect: "follow" });
  const html = await factions.text();
  if (!factions.ok) { note("BROKEN", "/codex/library/factions", `returned ${factions.status}`); return; }

  // Every faction card on the page, and whether its emblem slot is occupied.
  for (const card of ["faction-banner-card", "faction-independent-card"]) {
    const blocks = html.split(`class="${card}"`).slice(1);
    for (const block of blocks) {
      const slice = block.slice(0, 2600);
      const slug = /href="\/codex\/bible\/([a-z0-9-]+)"/.exec(slice)?.[1] ?? "(unknown)";
      if (!slice.includes("faction-emblem")) note("BROKEN", `/codex/library/factions · ${card}`, `${slug} renders no emblem — its title and summary fall into the fixed emblem column`);
    }
  }
  const wings = html.split('class="faction-wing-list"').slice(1);
  for (const block of wings) {
    for (const item of block.slice(0, 6000).split("<li").slice(1)) {
      const slug = /href="\/codex\/bible\/([a-z0-9-]+)"/.exec(item)?.[1];
      if (slug && !item.slice(0, 1400).includes("faction-emblem")) note("BROKEN", "/codex/library/factions · faction-wing-list", `${slug} renders no emblem in a fixed 38px column`);
    }
  }

  // A character whose sheet names a faction must show that affiliation, and
  // the chip must fill its own emblem column.
  const cast = await db.storyEntry.findMany({
    where: { kind: "CHARACTER", status: { in: ["DRAFT", "PROPOSED", "CANON"] } },
    select: { slug: true, meta: true },
  });
  const withFactions = cast.filter((entry) => {
    const meta = entry.meta as Record<string, unknown> | null;
    const rows = Array.isArray(meta?.factions) ? meta.factions as Array<Record<string, unknown>> : [];
    return rows.some((row) => typeof row.faction === "string" && row.faction.trim());
  });
  for (const entry of withFactions) {
    const res = await fetch(`${BASE}/codex/bible/${entry.slug}`, { headers: { cookie }, redirect: "follow" });
    const page = await res.text();
    if (!res.ok) { note("BROKEN", `/codex/bible/${entry.slug}`, `returned ${res.status}`); continue; }
    if (!page.includes("character-profile-affiliations")) {
      note("BROKEN", `/codex/bible/${entry.slug}`, "sheet names a faction and the dossier shows no affiliation at all");
      continue;
    }
    const block = page.slice(page.indexOf("character-profile-affiliations"));
    const chips = block.split('href="/codex/bible/').length - 1;
    const filled = (block.slice(0, 400 + chips * 900).match(/faction-emblem|<img alt="" src="\/codex-art\/faction-logos/g) ?? []).length;
    if (filled < 1) note("BROKEN", `/codex/bible/${entry.slug}`, "affiliation chip renders no emblem in its fixed 52px column");
  }

  // The navigator, on every board.
  const arcs = await db.storyArc.findMany({ where: { status: { in: ["DRAFT", "PROPOSED", "CANON"] } }, select: { slug: true } });
  for (const arc of arcs) {
    const res = await fetch(`${BASE}/codex/arc/${arc.slug}`, { headers: { cookie }, redirect: "follow" });
    const page = await res.text();
    if (!res.ok) { note("BROKEN", `/codex/arc/${arc.slug}`, `returned ${res.status}`); continue; }
    if (!page.includes("canon-nav")) note("BROKEN", `/codex/arc/${arc.slug}`, "no canon navigator — a writer inside a board cannot see the story around it");
    if (!page.includes("canon-nav-mobile")) note("RISK", `/codex/arc/${arc.slug}`, "navigator has no collapsed drawer for narrow screens");
  }

  // Every dossier this pass created, walked for the obvious failures.
  const fresh = await db.storyEntry.findMany({
    where: { slug: { in: [
      "the-nation-state-of-arcadia", "the-radiant-path", "what-the-forge-rebuilds", "the-lamplighter",
      "the-platform-ledger", "the-green", "the-lamp-chapel", "the-drawn-shutter", "the-quiet-office",
      "the-accreditation-hall", "the-lower-gate", "lamplight", "the-stone-field", "the-ash-ground",
      "the-burned-wagon", "the-last-water", "the-quiet-altar", "ilse-vetch", "corrin-ade",
      "wren-salloway", "imogen-roe", "del-anwar", "ivo-crane", "the-marker", "ottoline-vasque",
      "the-asis-officer", "abraham-islay-kane", "arcadian-devil", "reclamation", "nag",
    ] } },
    select: { slug: true, kind: true, title: true },
  });
  for (const entry of fresh) {
    const res = await fetch(`${BASE}/codex/bible/${entry.slug}`, { headers: { cookie }, redirect: "follow" });
    const page = await res.text();
    if (!res.ok) { note("BROKEN", `/codex/bible/${entry.slug}`, `returned ${res.status}`); continue; }
    if (!page.includes(entry.title.replace(/&/g, "&amp;"))) note("BROKEN", `/codex/bible/${entry.slug}`, "the page does not render its own title");
    // A de-slugged placeholder on the page means a link resolved to nothing
    // that the reader can see as a real name.
    const unwritten = (page.match(/class="planned-unwritten"/g) ?? []).length;
    if (unwritten > 0) note("RISK", `/codex/bible/${entry.slug}`, `${unwritten} reference${unwritten === 1 ? "" : "s"} to something nobody has written yet (legitimate under link-now-fill-later, listed so it is a decision)`);
  }
}

async function main() {
  auditSource();
  const user = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
  const token = randomBytes(32).toString("hex");
  await db.session.create({ data: { sessionToken: token, userId: user.id, expires: new Date(Date.now() + 1000 * 60 * 30) } });
  try {
    await auditLive(`authjs.session-token=${token}; __Secure-authjs.session-token=${token}`);
  } finally {
    await db.session.deleteMany({ where: { sessionToken: token } });
  }

  const broken = findings.filter((finding) => finding.severity === "BROKEN");
  const risk = findings.filter((finding) => finding.severity === "RISK");
  console.log("Layout slot audit — read-only\n");
  for (const group of [broken, risk]) {
    if (!group.length) continue;
    console.log(`${group[0]!.severity} — ${group.length}`);
    for (const finding of group) console.log(`  ${finding.where}\n      ${finding.what}`);
    console.log("");
  }
  console.log(broken.length ? `FAIL — ${broken.length} broken slot${broken.length === 1 ? "" : "s"}.` : `PASS — every fixed-track grid is filled. ${risk.length} noted.`);
  if (broken.length) process.exitCode = 1;
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(2)); });
