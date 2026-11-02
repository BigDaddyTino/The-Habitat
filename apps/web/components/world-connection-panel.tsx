"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Copy, Gamepad2, RefreshCw } from "lucide-react";
import { playerGameConnections, type PlayerGameSlug, type PlayerConnectionResult, type ServerState } from "@habitat/shared";
import "./world-connection-panel.css";

const stateNotes: Record<ServerState, string> = {
  ONLINE: "Choose either way to connect. Your game may ask for a character or server password.",
  DEGRADED: "This world is reporting a problem. Connections may fail until it recovers.",
  UNKNOWN: "The world's current status is unknown. These details do not confirm that it is running.",
  SLEEPING: "This world is intentionally sleeping. Request a wake-up below before joining.",
  STARTING: "This world is starting. Give it a moment before joining.",
  STOPPING: "This world is stopping. Wait until it is online again.",
  UPDATING: "This world is updating. Wait until it is online again.",
  DOWN_UNEXPECTEDLY: "This world stopped unexpectedly. An administrator needs to check it before you can join.",
};

export function WorldConnectionPanel({ slug, state, canAccess }: { slug: PlayerGameSlug; state: ServerState; canAccess: boolean }) {
  const game = playerGameConnections[slug];
  const [result, setResult] = useState<PlayerConnectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [clock, setClock] = useState(0);
  const [feedback, setFeedback] = useState("");
  const request = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    try {
      const response = await fetch(`/api/worlds/${slug}/connection`, { cache: "no-store", signal: controller.signal });
      const next = await response.json() as PlayerConnectionResult;
      if (controller.signal.aborted) return;
      setResult(next);
      setClock(Date.now());
    } catch {
      if (!controller.signal.aborted) setResult({ status: "unavailable", message: "Connection details could not be refreshed. Try again in a moment." });
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!canAccess) return;
    const firstLoad = window.requestAnimationFrame(() => { void refresh(); });
    const poll = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 20000);
    const tick = window.setInterval(() => setClock(Date.now()), 1000);
    const focus = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", focus);
    return () => { window.cancelAnimationFrame(firstLoad); request.current?.abort(); window.clearInterval(poll); window.clearInterval(tick); document.removeEventListener("visibilitychange", focus); };
  }, [canAccess, refresh]);

  const details = result?.status === "ready" ? result.details : null;
  const fresh = details !== null && clock < Date.parse(details.expiresAt);
  const currentState = result?.status === "ready" ? result.state : state;
  const canJoin = currentState === "ONLINE" || currentState === "DEGRADED" || currentState === "UNKNOWN";
  const accessDenied = !canAccess || result?.status === "unauthorized";

  async function copy(value: string, label: string, input: HTMLInputElement | null) {
    if (!details || Date.now() >= Date.parse(details.expiresAt)) { setFeedback("Refresh the address before copying."); void refresh(); return; }
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(`${label} copied. Paste it into ${game.name}.`);
    } catch {
      input?.focus();
      input?.select();
      setFeedback("Automatic copying is unavailable. The value is selected; use Ctrl+C to copy it.");
    }
  }

  function field(label: string, value: string) {
    const id = `${slug}-${label.toLowerCase().replaceAll(" ", "-")}`;
    return <div className="connection-field"><label htmlFor={id}>{label}</label><div>
      <input id={id} value={fresh ? value : "Refresh required"} readOnly onFocus={(event) => event.currentTarget.select()} spellCheck={false} />
      <button type="button" disabled={!fresh} aria-label={`Copy ${label.toLowerCase()}`} onClick={() => void copy(value, label, document.getElementById(id) as HTMLInputElement | null)}><Copy aria-hidden="true" size={16} /><span>Copy</span></button>
    </div></div>;
  }

  return <section id="join-world" className={`world-connection-panel connection-state-${currentState.toLowerCase()}`} aria-labelledby="connection-heading">
    <div className="connection-heading"><div><p className="eyebrow">Steam on PC</p><h2 id="connection-heading"><Gamepad2 aria-hidden="true" />Join this world</h2><p>Launch from here or use the connection details in your game.</p></div>
      {!accessDenied ? <button className="connection-refresh" type="button" onClick={() => void refresh()} disabled={loading}><RefreshCw aria-hidden="true" size={15} />{loading ? "Checking…" : "Refresh address"}</button> : null}
    </div>
    {accessDenied ? <div className="connection-sign-in"><p>Connection details are reserved for Habitat members.</p><Link className="connection-button" href={`/sign-in?callbackUrl=${encodeURIComponent(`/worlds/${slug}#join-world`)}`}>Sign in to connect <ArrowUpRight size={16} aria-hidden="true" /></Link></div> : <>
      <p className="connection-state-note">{stateNotes[currentState]}{currentState === "SLEEPING" ? <> <a href="#wake-world">Request a wake-up</a></> : null}</p>
      <div className="connection-choices">
        <article className="connection-launch"><span className="connection-step">01 / Open in Steam</span><h3>{game.steamPort === null ? "Launch the game" : "Join through Steam"}</h3>
          <p>{game.steamPort === null ? "Open the game, then paste the connection details into its direct-connect screen." : "Let Steam pass the server details to your game. If it does not connect, use the manual steps alongside."}</p>
          <div className="connection-actions">
            {game.steamPort !== null ? fresh && canJoin && details?.steamUri ? <a className="connection-button" href={details.steamUri} onClick={(event) => { if (Date.now() >= Date.parse(details.expiresAt)) { event.preventDefault(); setFeedback("Refreshing the connection address. Try Join via Steam again."); void refresh(); } }}>Join via Steam <ArrowUpRight aria-hidden="true" size={16} /></a> : <button type="button" className="connection-button" disabled>Join via Steam</button> : null}
            <a className={`connection-button${game.steamPort !== null ? " connection-button-secondary" : ""}`} href={`steam://run/${game.appId}`}>Open {game.name} <ArrowUpRight aria-hidden="true" size={16} /></a>
          </div><small>Steam may ask permission to open. Launching the game does not start the server.</small>
        </article>
        <article className="connection-direct"><span className="connection-step">02 / Connect manually</span><h3>{slug === "enshrouded" ? "Add a Steam favorite" : "Direct connection"}</h3>
          {details ? <>
            {details.hostname ? <p className="connection-address-note">Use this server address each time you connect. It stays the same when our internet address changes.</p> : null}
            <div className="connection-fields">{field("Full address", details.endpoint)}<div className="connection-field-pair">{field("Server address", details.hostname ?? details.address)}{field("Port", String(details.port))}</div></div>
            {details.hostname ? <details className="connection-ip-fallback"><summary>Need a numeric IP? Show fallback</summary><p>If the game does not accept the server name, use these current IP details instead.</p><div className="connection-fields">{field("IP and port", details.ipEndpoint)}{field("IP address", details.address)}</div></details> : null}
            <p className="connection-freshness">{fresh ? <>Address checked at <time dateTime={details.resolvedAt}>{new Date(details.resolvedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}</time>. Updates automatically while this page is open.</> : "This address has expired. Refresh before connecting."}</p></> : <p className="connection-unavailable" role="status">{result && result.status !== "ready" ? result.message : "Checking the current connection address…"}</p>}
          <ol>{game.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol>
        </article>
      </div><p className="connection-feedback" role="status" aria-live="polite">{feedback}</p>
    </>}
  </section>;
}
