import "../lib/environment";
import { analyzeStoryGraph } from "@habitat/shared";
import { getPrismaClient } from "@habitat/db/client";

/**
 * The verification recipe the authoring memory keeps having to re-derive, as a
 * script. For each arc named on the command line (default: the four mainline
 * chapters rebuilt 2026-09-05):
 *
 *  1. the board's own graph analysis (the same rules the release audit runs);
 *  2. every [[link]] in every body resolves to an entry or an arc;
 *  3. every `set flag:` names a FLAG entry;
 *  4. every voiced line has a speaker who is a CANON character or a role;
 *  5. every simple path from each opening ends on an ENDING, and which cards
 *     every path must pass through;
 *  6. every FLAG touched by these arcs is both SET somewhere and CHECKED
 *     somewhere — a promise planted and never collected is reported.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/audit-chapter-graphs.ts [arc-slug ...]
 *
 * Read-only. Exits non-zero on any finding so it can gate a pass.
 */
const db = getPrismaClient();
const DEFAULT_ARCS = ["the-last-days-of-kestrel", "the-evacuation", "binding-in-arcadia", "the-captivity-arc"];
const working = ["DRAFT", "PROPOSED", "CANON"] as const;

async function main() {
  const requested = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  const ARCS = requested.length ? requested : DEFAULT_ARCS;

  const entries = await db.storyEntry.findMany({ where: { status: { in: [...working] } }, select: { slug: true, kind: true, status: true } });
  const arcs = await db.storyArc.findMany({ where: { status: { in: [...working] } }, select: { id: true, slug: true, region: { select: { slug: true } } } });
  const entrySlugs = new Set(entries.map((e) => e.slug));
  const arcSlugs = new Set(arcs.map((a) => a.slug));
  const flagSlugs = new Set(entries.filter((e) => e.kind === "FLAG").map((e) => e.slug));
  const arcById = new Map(arcs.map((a) => [a.id, a.slug]));

  const allNodes = await db.storyNode.findMany({ where: { status: { in: [...working] } }, select: { arcId: true, key: true, kind: true, title: true, body: true, effects: true, lines: { where: { retiredAt: null }, select: { speaker: { select: { slug: true, kind: true, status: true } }, speakerRole: true, text: true } } } });
  const allEdges = await db.storyEdge.findMany({ where: { status: { in: [...working] } }, select: { arcId: true, label: true, condition: true, effects: true, voiced: true, fromNode: { select: { key: true } }, toNode: { select: { key: true } } } });

  const setSites = new Map<string, string[]>();
  const checkSites = new Map<string, string[]>();
  const flagOf = (fx: string) => /^set flag:\s*([a-z0-9-]+)/.exec(fx)?.[1] ?? null;
  for (const n of allNodes) for (const fx of n.effects) { const f = flagOf(fx); if (f) setSites.set(f, [...(setSites.get(f) ?? []), `${arcById.get(n.arcId)}/${n.key}`]); }
  for (const e of allEdges) {
    const at = `${arcById.get(e.arcId)}/${e.fromNode.key}->${e.toNode.key}`;
    for (const fx of e.effects) { const f = flagOf(fx); if (f) setSites.set(f, [...(setSites.get(f) ?? []), at]); }
    if (e.condition) for (const f of flagSlugs) if (e.condition.includes(f)) checkSites.set(f, [...(checkSites.get(f) ?? []), at]);
  }

  let failures = 0;
  const touched = new Set<string>();
  for (const slug of ARCS) {
    const arc = arcs.find((a) => a.slug === slug);
    if (!arc) { failures++; console.log(`\n=== ${slug} — NO SUCH ARC`); continue; }
    const nodes = allNodes.filter((n) => n.arcId === arc.id);
    const edges = allEdges.filter((e) => e.arcId === arc.id);
    console.log(`\n=== ${slug} — region=${arc.region?.slug ?? "NONE"} nodes=${nodes.length} edges=${edges.length} lines=${nodes.reduce((s, n) => s + n.lines.length, 0)} voicedOptions=${edges.filter((e) => e.voiced).length}`);
    if (!arc.region) { failures++; console.log("  NO REGION — the arc is filed nowhere"); }

    const problems = analyzeStoryGraph(nodes.map((n) => ({ key: n.key, kind: n.kind, title: n.title })), edges.map((e) => ({ fromKey: e.fromNode.key, toKey: e.toNode.key, label: e.label, hasConsequence: e.effects.length > 0 })));
    if (problems.length) { failures += problems.length; for (const p of problems) console.log(`  PROBLEM ${p.kind} ${p.nodeKey ?? ""}: ${p.detail}`); } else console.log("  graph: clean");

    for (const n of nodes) {
      for (const m of (n.body ?? "").matchAll(/\[\[([^\]|]+)\]\]/g)) if (!entrySlugs.has(m[1]) && !arcSlugs.has(m[1])) { failures++; console.log(`  DEAD LINK ${n.key} -> [[${m[1]}]]`); }
      for (const fx of n.effects) { const f = flagOf(fx); if (f) { touched.add(f); if (!flagSlugs.has(f)) { failures++; console.log(`  NO FLAG ENTRY ${n.key} sets ${f}`); } } }
      for (const l of n.lines) {
        if (l.speaker && (l.speaker.kind !== "CHARACTER" || l.speaker.status !== "CANON")) { failures++; console.log(`  SPEAKER ${n.key}: ${l.speaker.slug} is ${l.speaker.kind}/${l.speaker.status}`); }
        if (!l.speaker && !l.speakerRole) { failures++; console.log(`  UNATTRIBUTED ${n.key}: "${l.text.slice(0, 40)}"`); }
      }
    }
    for (const e of edges) {
      for (const fx of e.effects) { const f = flagOf(fx); if (f) { touched.add(f); if (!flagSlugs.has(f)) { failures++; console.log(`  NO FLAG ENTRY edge ${e.fromNode.key}->${e.toNode.key} sets ${f}`); } } }
      if (e.condition) for (const f of flagSlugs) if (e.condition.includes(f)) touched.add(f);
    }

    const out = new Map<string, string[]>();
    for (const e of edges) out.set(e.fromNode.key, [...(out.get(e.fromNode.key) ?? []), e.toNode.key]);
    const entered = new Set(edges.map((e) => e.toNode.key));
    const openings = nodes.filter((n) => !entered.has(n.key)).map((n) => n.key);
    const paths: string[][] = [];
    const walk = (key: string, path: string[]) => {
      if (path.includes(key) || paths.length > 20000) return;
      const next = [...path, key];
      const outs = out.get(key) ?? [];
      if (outs.length === 0) { paths.push(next); return; }
      for (const o of outs) walk(o, next);
    };
    for (const o of openings) walk(o, []);
    const endings = new Set(nodes.filter((n) => n.kind === "ENDING").map((n) => n.key));
    console.log(`  openings: ${openings.join(", ")}; ${paths.length} simple paths; endings reached: ${[...new Set(paths.map((p) => p[p.length - 1]))].join(", ")}`);
    const offBoard = paths.filter((p) => !endings.has(p[p.length - 1]));
    if (offBoard.length) { failures += offBoard.length; for (const p of offBoard.slice(0, 5)) console.log(`  PATH ENDS OFF-BOARD: ${p.join(" > ")}`); }
    const mustPass = nodes.filter((n) => paths.length > 0 && paths.every((p) => p.includes(n.key))).map((n) => n.key);
    console.log(`  must-pass: ${mustPass.join(", ")}`);
  }

  console.log("\n=== FLAGS these arcs touch — set at / checked at");
  for (const f of [...touched].sort()) {
    const sets = setSites.get(f) ?? []; const checks = checkSites.get(f) ?? [];
    if (!sets.length || !checks.length) failures++;
    console.log(`  ${f.padEnd(30)} set@ ${sets.join(", ") || "NOWHERE"}  | checked@ ${checks.join(", ") || "NOWHERE"}`);
  }
  console.log(`\n${failures === 0 ? "ALL CLEAR" : `${failures} finding(s)`}`);
  if (failures > 0) process.exitCode = 1;
}
main().finally(() => db.$disconnect());
