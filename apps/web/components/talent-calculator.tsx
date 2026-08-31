"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, RotateCcw, Share2 } from "lucide-react";
import { corruptedEffects, describeEffects, effectsForNode } from "@/lib/talent-effects";
import { talentClasses, talentPointsAtLevel, type TalentClass, type TalentNode } from "@/lib/talent-trees";

/**
 * The talent calculator — the Eight Trees, interactive.
 *
 * A planner, not a character sheet: everything runs client-side and a build
 * is shared as a URL fragment, so nothing here writes to the database. The
 * rules it enforces are the approved ones: 1 point per level with 5 at
 * level 1 and every 10th (144 at the cap), branches open top to bottom,
 * weaves are bridges (owning either end opens the other), fork pairs lock
 * each other for good, and the corrupted branch costs nothing — it lights
 * from the corruption phase slider, because that price was paid elsewhere.
 */

type BuildState = { classSlug: string; level: number; phase: number; owned: string[] };

const defaultState: BuildState = { classSlug: "bastion", level: 100, phase: 0, owned: [] };

function encodeState(state: BuildState): string {
  return [state.classSlug, state.level, state.phase, state.owned.join(".")].join("|");
}

function decodeState(hash: string): BuildState | null {
  const [classSlug, level, phase, owned] = hash.split("|");
  const found = talentClasses.find((entry) => entry.slug === classSlug);
  if (!found) return null;
  return {
    classSlug: found.slug,
    level: Math.max(1, Math.min(100, Number(level) || 100)),
    phase: Math.max(0, Math.min(7, Number(phase) || 0)),
    owned: owned ? owned.split(".").filter(Boolean) : [],
  };
}

/** Every node of a class, with its branch position, for the rules engine. */
function indexClass(tree: TalentClass) {
  const byId = new Map<string, { node: TalentNode; branch: number; index: number }>();
  tree.branches.forEach((branch, branchIndex) => {
    branch.nodes.forEach((node, nodeIndex) => byId.set(node.id, { node, branch: branchIndex, index: nodeIndex }));
  });
  return byId;
}

export function TalentCalculator({ constellationArt = {} }: { constellationArt?: Record<string, string | null> }) {
  const [state, setState] = useState<BuildState>(defaultState);
  const [copied, setCopied] = useState(false);
  // The inspected node: clicking opens the popout with the real numbers;
  // buying happens from inside it, so nobody spends blind.
  const [inspected, setInspected] = useState<{ node: TalentNode; corrupt?: false } | { phase: number; name: string; desc: string; corrupt: true } | null>(null);

  // A shared link restores the whole build. The hash keeps the page static;
  // the restore is deferred a frame so hydration completes on the default
  // state before the build swaps in.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const fromHash = decodeState(decodeURIComponent(window.location.hash.slice(1)));
      if (fromHash) setState(fromHash);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const encoded = encodeURIComponent(encodeState(state));
    window.history.replaceState(null, "", `#${encoded}`);
  }, [state]);
  // Escape closes the popout, same as clicking outside it.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setInspected(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const gridRef = useRef<HTMLDivElement | null>(null);
  // The traced path: constellation lines drawn over the tree while a node is
  // inspected — the road from the branch mouth down to it, its weave bridge,
  // and the fork it would kill.
  const [trace, setTrace] = useState<{
    lines: Array<{ x1: number; y1: number; x2: number; y2: number; kind: "path" | "weave" | "fork" }>;
    dots: Array<{ x: number; y: number; kind: "path" | "weave" | "fork" }>;
  }>({ lines: [], dots: [] });

  const tree = talentClasses.find((entry) => entry.slug === state.classSlug) ?? talentClasses[0];
  const byId = useMemo(() => indexClass(tree), [tree]);
  const owned = useMemo(() => new Set(state.owned.filter((id) => byId.has(id))), [state.owned, byId]);

  const spent = useMemo(
    () => [...owned].reduce((sum, id) => sum + (byId.get(id)?.node.cost ?? 0), 0),
    [owned, byId],
  );
  const available = talentPointsAtLevel(state.level);
  const remaining = available - spent;
  // The lowest level whose points cover the build — "this build comes online at…".
  const levelNeeded = useMemo(() => {
    for (let level = 1; level <= 100; level++) if (talentPointsAtLevel(level) >= spent) return level;
    return 100;
  }, [spent]);

  const unlockable = useCallback((id: string, pool: Set<string>): boolean => {
    const entry = byId.get(id);
    if (!entry) return false;
    const { node, branch, index } = entry;
    if (node.requiresAny) return node.requiresAny.some((required) => pool.has(required));
    if (index === 0) return true;
    const previous = tree.branches[branch].nodes[index - 1];
    if (pool.has(previous.id)) return true;
    // A weave is a bridge: owning the far end opens this end from its branch.
    return Boolean(node.weave && pool.has(node.weave));
  }, [byId, tree]);

  const forkLocked = useCallback((node: TalentNode): boolean => Boolean(node.fork && owned.has(node.fork)), [owned]);

  // The road to a node: its branch chain from the mouth down, jumping through
  // requiresAny gates (preferring the option actually owned) and crossing a
  // weave bridge when that is the walked way in. Returned mouth-first.
  const routeTo = useCallback((nodeId: string): string[] => {
    const route: string[] = [];
    const visited = new Set<string>();
    let entry = byId.get(nodeId);
    while (entry && !visited.has(entry.node.id)) {
      visited.add(entry.node.id);
      route.unshift(entry.node.id);
      const { node, branch, index } = entry;
      if (node.requiresAny) {
        const via = node.requiresAny.find((id) => owned.has(id)) ?? node.requiresAny[0];
        entry = byId.get(via);
      } else if (index === 0) {
        break;
      } else {
        const previous = tree.branches[branch].nodes[index - 1];
        if (node.weave && owned.has(node.weave) && !owned.has(previous.id)) {
          // The walked way in was over the bridge, not up the column.
          route.unshift(node.weave);
          break;
        }
        entry = byId.get(previous.id);
      }
    }
    return route;
  }, [byId, owned, tree]);

  const inspectedNode = inspected && !inspected.corrupt ? inspected.node : null;
  const route = useMemo(() => (inspectedNode ? routeTo(inspectedNode.id) : []), [inspectedNode, routeTo]);
  const routeSet = useMemo(() => new Set(route), [route]);

  // Measure the inspected road and draw it as constellation lines — the same
  // grammar as Sol's star charts, live on the tree itself.
  useEffect(() => {
    const grid = gridRef.current;
    if (!inspectedNode || !grid) {
      const frame = requestAnimationFrame(() => setTrace({ lines: [], dots: [] }));
      return () => cancelAnimationFrame(frame);
    }
    const measure = () => {
      const rect = grid.getBoundingClientRect();
      const center = (id: string) => {
        const el = grid.querySelector<HTMLElement>(`[data-node-id="${id}"]`);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left - rect.left + r.width / 2, y: r.top - rect.top + r.height / 2 };
      };
      const lines: Array<{ x1: number; y1: number; x2: number; y2: number; kind: "path" | "weave" | "fork" }> = [];
      const dots: Array<{ x: number; y: number; kind: "path" | "weave" | "fork" }> = [];
      for (let i = 0; i < route.length; i++) {
        const here = center(route[i]);
        if (!here) continue;
        dots.push({ ...here, kind: "path" });
        const next = i + 1 < route.length ? center(route[i + 1]) : null;
        if (next) lines.push({ x1: here.x, y1: here.y, x2: next.x, y2: next.y, kind: "path" });
      }
      const self = center(inspectedNode.id);
      const weaveFar = inspectedNode.weave ? center(inspectedNode.weave) : null;
      if (self && weaveFar) {
        lines.push({ x1: self.x, y1: self.y, x2: weaveFar.x, y2: weaveFar.y, kind: "weave" });
        dots.push({ ...weaveFar, kind: "weave" });
      }
      const forkFar = inspectedNode.fork ? center(inspectedNode.fork) : null;
      if (self && forkFar) {
        lines.push({ x1: self.x, y1: self.y, x2: forkFar.x, y2: forkFar.y, kind: "fork" });
        dots.push({ ...forkFar, kind: "fork" });
      }
      setTrace({ lines, dots });
    };
    const frame = requestAnimationFrame(() => {
      grid.querySelector<HTMLElement>(`[data-node-id="${inspectedNode.id}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      measure();
    });
    window.addEventListener("resize", measure);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", measure); };
  }, [inspectedNode, route]);

  const toggle = (node: TalentNode) => {
    setState((current) => {
      const pool = new Set(current.owned);
      if (pool.has(node.id)) {
        // Refunds cascade: anything that only stood on this node comes out too,
        // repeatedly, so the build can never be left standing on air.
        pool.delete(node.id);
        let changed = true;
        while (changed) {
          changed = false;
          for (const id of [...pool]) {
            if (!unlockable(id, pool)) { pool.delete(id); changed = true; }
          }
        }
      } else {
        if (forkLocked(node) || !unlockable(node.id, pool)) return current;
        if (node.cost > available - [...pool].reduce((sum, id) => sum + (byId.get(id)?.node.cost ?? 0), 0)) return current;
        pool.add(node.id);
      }
      return { ...current, owned: [...pool] };
    });
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be denied; the URL bar still carries the build.
    }
  };

  const spells = [...owned].map((id) => byId.get(id)).filter((entry) => entry?.node.spell).map((entry) => entry?.node);
  const trainers = [...owned].map((id) => byId.get(id)).filter((entry) => entry?.node.ceiling).map((entry) => entry?.node);
  const activeCorrupted = tree.corrupted.nodes.filter((node) => node.phase <= state.phase && node.phase < 7);
  const terminal = state.phase >= 7;

  return (
    <div className="talent-calculator">
      <div className="talent-classes" role="tablist" aria-label="Class">
        {talentClasses.map((entry) => (
          <button
            aria-selected={entry.slug === tree.slug}
            className={entry.slug === tree.slug ? "is-active" : undefined}
            key={entry.slug}
            onClick={() => setState({ classSlug: entry.slug, level: state.level, phase: state.phase, owned: [] })}
            role="tab"
            type="button"
          >{entry.name}</button>
        ))}
      </div>

      <div className="talent-controls">
        <label>Level <b>{state.level}</b>
          <input max={100} min={1} onChange={(event) => setState({ ...state, level: Number(event.target.value) })} type="range" value={state.level} />
          <small>{available} points at this level · 5 at level 1 and every 10th</small>
        </label>
        <label>Corruption phase <b className={terminal ? "is-terminal-count" : undefined}>{state.phase}</b>
          <input max={7} min={0} onChange={(event) => setState({ ...state, phase: Number(event.target.value) })} type="range" value={state.phase} />
          <small>{terminal ? "Phase 7 — the ladder ends here." : "The corrupted branch lights for free — that price was paid elsewhere."}</small>
        </label>
        <div className="talent-actions">
          <button onClick={share} type="button">{copied ? <Check size={13} /> : <Share2 size={13} />} {copied ? "Link copied" : "Share build"}</button>
          <button onClick={() => setState({ ...state, owned: [] })} type="button"><RotateCcw size={13} /> Reset</button>
        </div>
      </div>

      <div className="talent-constellation-note">
        <b>{tree.constellation}</b> — {tree.constellationNote}
        {constellationArt[tree.slug]
          ? null
          : <span className="talent-artslot">constellation art slot — Sol · <code>private/codex-art/talents/{tree.slug}.png</code></span>}
      </div>
      {constellationArt[tree.slug] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={`${tree.name} constellation — ${tree.constellation}`} className="talent-constellation-art" src={constellationArt[tree.slug] ?? undefined} />
      ) : null}

      <div className={`talent-board${inspectedNode ? " is-inspecting" : ""}`}>
        <div className="talent-grid" ref={gridRef}>
          {trace.lines.length ? (
            <svg aria-hidden className="talent-pathlines">
              {trace.lines.map((line, index) => (
                <line className={`line-${line.kind}`} key={`l${index}`} x1={line.x1} x2={line.x2} y1={line.y1} y2={line.y2} />
              ))}
              {trace.dots.map((dot, index) => (
                <circle className={`dot-${dot.kind}`} cx={dot.x} cy={dot.y} key={`d${index}`} r={3} />
              ))}
            </svg>
          ) : null}
          {tree.branches.map((branch) => (
            <div className={`talent-branch${branch.core ? " is-core" : ""}`} key={branch.name}>
              <h3>{branch.core ? `⌂ ${branch.name}` : branch.name}</h3>
              <div className="talent-nodes">
                {branch.nodes.map((node) => {
                  const isOwned = owned.has(node.id);
                  const locked = forkLocked(node);
                  const openable = !locked && unlockable(node.id, owned);
                  const affordable = node.cost <= remaining;
                  const state1 = isOwned ? "is-owned" : locked ? "is-locked" : !openable ? "is-closed" : !affordable ? "is-poor" : "is-open";
                  const isTarget = inspectedNode?.id === node.id;
                  const traceClass = isTarget
                    ? " is-target"
                    : routeSet.has(node.id) ? " is-path"
                    : inspectedNode?.weave === node.id ? " is-weave-far"
                    : inspectedNode?.fork === node.id ? " is-fork-far"
                    : "";
                  return (
                    <button
                      className={`talent-node ${state1}${node.fork ? " is-fork" : ""}${traceClass}`}
                      data-node-id={node.id}
                      key={node.id}
                      onClick={() => setInspected({ node })}
                      title={locked ? `Locked — you took ${byId.get(node.fork ?? "")?.node.name ?? "the other fork"}` : node.desc}
                      type="button"
                    >
                      <span className="talent-cost">{node.cost}</span>
                      <b>{node.name}</b>
                      <small>{node.desc}</small>
                      <span className="talent-chips">
                        {node.spell ? <i className="chip-spell">{node.spell}</i> : null}
                        {node.ceiling ? <i className="chip-ceiling">Ceiling · {node.ceiling}</i> : null}
                        {node.weave ? <i className="chip-weave">Weave ↔ {byId.get(node.weave)?.node.name ?? node.weave}</i> : null}
                        {node.fork ? <i className="chip-fork">Fork — locks {byId.get(node.fork)?.node.name ?? node.fork}</i> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="talent-corrupted">
          <h3>☣ {tree.corrupted.title}</h3>
          <p>{tree.corrupted.tagline}</p>
          <div className="talent-corrupted-row">
            {tree.corrupted.nodes.map((node) => {
              const lit = node.phase <= state.phase;
              return (
                <button
                  className={`talent-node is-corrupt${lit ? " is-lit" : ""}${node.phase === 7 ? " is-terminal" : ""}`}
                  key={node.name}
                  onClick={() => setInspected({ phase: node.phase, name: node.name, desc: node.desc, corrupt: true })}
                  type="button"
                >
                  <span className="talent-cost">P{node.phase}</span>
                  <b>{node.name}</b>
                  <small>{node.desc}</small>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="talent-summary">
        <div className="talent-tally">
          <div><b>{spent}</b><span>spent</span></div>
          <div><b>{remaining}</b><span>remaining</span></div>
          <div><b>{levelNeeded}</b><span>level needed</span></div>
        </div>
        {remaining > 0 && spent > 0 ? <p className="talent-hint">Spare points rank up unlocked abilities (I–III) — the long-game sink.</p> : null}
        {trainers.length ? <div className="talent-list"><h4>Trainers to find</h4><ul>{trainers.map((node) => <li key={node?.id}><b>{node?.name}</b> — {node?.ceiling}</li>)}</ul></div> : null}
        {spells.length ? <div className="talent-list"><h4>Abilities from the pool</h4><ul>{spells.map((node) => <li key={node?.id}><b>{node?.name}</b> — {node?.spell}</li>)}</ul></div> : null}
        {activeCorrupted.length ? <div className="talent-list is-corrupt-list"><h4>Lit by the ladder</h4><ul>{activeCorrupted.map((node) => <li key={node.name}><b>{node.name}</b></li>)}</ul></div> : null}
        {terminal ? <p className="talent-terminal">Phase 7. An abomination stands where this build stood. The campaign continues with what is left.</p> : null}
        <p className="talent-plays"><b>How it plays:</b> {tree.plays}</p>
      </aside>

      {inspected ? (
        <div aria-modal="true" className={`talent-popout-backdrop${inspected.corrupt ? "" : " is-docked"}`} onClick={() => setInspected(null)} role="dialog">
          <div className="talent-popout" onClick={(event) => event.stopPropagation()}>
            {inspected.corrupt ? (() => {
              const effect = corruptedEffects[tree.slug]?.[inspected.phase];
              const lines = effect ? describeEffects(effect) : [];
              const lit = inspected.phase <= state.phase;
              return (
                <>
                  <header className="is-corrupt-head">
                    <b>{inspected.name}</b>
                    <span>{tree.corrupted.title} · phase {inspected.phase} · costs no points, ever</span>
                  </header>
                  <p className="talent-popout-desc">{inspected.desc}</p>
                  {inspected.phase === 7 ? (
                    <p className="talent-popout-terminal">The hard end. An abomination stands where you stood, and the campaign continues with what is left. Nothing here is a power — it is what the seventh phase is.</p>
                  ) : (
                    <>
                      <h4>What actually changes</h4>
                      <ul>{lines.map((line) => <li key={line}>{line}</li>)}</ul>
                      <p className="talent-popout-note">Free — this node lights when phase {inspected.phase} does, and never goes out. The price was paid on the ladder: the phase&apos;s own attribute trades still apply, the tells still show, and the doors still close.</p>
                    </>
                  )}
                  <footer>
                    <span className={lit ? "is-lit-tag" : undefined}>{lit ? `Lit — you are phase ${state.phase}` : `Dark — lights at phase ${inspected.phase}`}</span>
                    <button onClick={() => setInspected(null)} type="button">Close</button>
                  </footer>
                </>
              );
            })() : (() => {
              const node = inspected.node;
              const effect = effectsForNode(tree.slug, node.id);
              const lines = effect ? describeEffects(effect) : [];
              const isOwned = owned.has(node.id);
              const locked = forkLocked(node);
              const openable = !locked && unlockable(node.id, owned);
              const affordable = node.cost <= remaining;
              const unwalked = route.filter((id) => !owned.has(id) && id !== node.id);
              const travel = unwalked.reduce((sum, id) => sum + (byId.get(id)?.node.cost ?? 0), 0);
              return (
                <>
                  <header>
                    <b>{node.name}</b>
                    <span>{node.cost} point{node.cost === 1 ? "" : "s"}</span>
                  </header>
                  <p className="talent-popout-desc">{node.desc}</p>
                  <h4>What actually changes</h4>
                  {lines.length
                    ? <ul>{lines.map((line) => <li key={line}>{line}</li>)}</ul>
                    : <p className="talent-popout-note">A narrative node: its effect happens in scenes — a door it opens, a person it changes, a thing the world starts doing — not in combat arithmetic. The simulations carry no number for it yet.</p>}
                  {node.spell ? <p className="talent-popout-tag is-spell">Unlocks abilities from the six schools&apos; 108 — {node.spell}</p> : null}
                  {node.ceiling ? <p className="talent-popout-tag is-ceiling">Ceiling: the points aren&apos;t enough — find {node.ceiling}, and pay the favour.</p> : null}
                  {node.weave ? <p className="talent-popout-tag is-weave">Weave: bridges to {byId.get(node.weave)?.node.name ?? node.weave} — buying either end links both paths.</p> : null}
                  {node.fork ? <p className="talent-popout-tag is-fork-tag">Fork: taking this locks {byId.get(node.fork)?.node.name ?? node.fork} for good. No respec exists in the world.</p> : null}
                  {lines.length ? <p className="talent-popout-note">Numbers are the same ones the balance simulations run on — first-pass weights, tuned by the campaign.</p> : null}
                  {isOwned ? (
                    <p className="talent-popout-path"><b>On the tree:</b> yours — its road is lit behind this card.</p>
                  ) : unwalked.length ? (
                    <p className="talent-popout-path">
                      <b>The road there</b> — lit on the tree behind this card:{" "}
                      {unwalked.map((id) => byId.get(id)?.node.name ?? id).join(" → ")}.{" "}
                      {travel} pt{travel === 1 ? "" : "s"} of walking before this one&apos;s {node.cost}
                      {travel + node.cost > remaining ? ` — more than the ${remaining} you have left.` : `, and you have ${remaining} left.`}
                    </p>
                  ) : (
                    <p className="talent-popout-path"><b>On the tree:</b> you stand at its door — nothing left to walk.</p>
                  )}
                  <footer>
                    {isOwned
                      ? <button className="is-refund" onClick={() => { toggle(node); setInspected(null); }} type="button">Refund {node.cost} pt{node.cost === 1 ? "" : "s"}</button>
                      : <button disabled={locked || !openable || !affordable} onClick={() => { toggle(node); setInspected(null); }} type="button">
                          {locked ? `Locked by ${byId.get(node.fork ?? "")?.node.name ?? "the fork"}` : !openable ? "Path not reached yet" : !affordable ? `Needs ${node.cost} pts — ${remaining} left` : `Take it — ${node.cost} pt${node.cost === 1 ? "" : "s"}`}
                        </button>}
                    <button onClick={() => setInspected(null)} type="button">Close</button>
                  </footer>
                </>
              );
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
