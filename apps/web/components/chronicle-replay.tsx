/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, CircleUserRound, Clapperboard, Clock3, Copy, Download, Film, Link2, Map, Pause, Play, Sparkles, Trophy, UserRound, UsersRound } from "lucide-react";
import { buildRecapCopy, chapterHighlights, chronicleKindColor, chronicleKindLabel, groupChronicleEvents, HABITAT_TIME_ZONE, isViewerMoment, viewerChronicleEvents, type ChronicleChapter, type ChronicleReplayEvent, type ChronicleReplayViewer } from "@/lib/chronicle-replay";

type ActionState = "idle" | "working" | "done" | "failed";

export function ChronicleReplay({ events, filtered = false, viewer = null }: { events: ChronicleReplayEvent[]; filtered?: boolean; viewer?: ChronicleReplayViewer | null }) {
  const personalEvents = useMemo(() => viewerChronicleEvents(events, viewer), [events, viewer]);
  const [cut, setCut] = useState<"club" | "mine">("club");
  const cutEvents = cut === "mine" ? personalEvents : events;
  const chapters = useMemo(() => groupChronicleEvents(cutEvents), [cutEvents]);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [momentIndex, setMomentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [copyState, setCopyState] = useState<ActionState>("idle");
  const [exportState, setExportState] = useState<ActionState>("idle");
  // Indices are clamped on read so a shrinking reel (new filters, a narrower cut) never
  // falls through to the empty state while retained moments are still on screen.
  const activeChapter = Math.min(chapterIndex, Math.max(0, chapters.length - 1));
  const chapter = chapters[activeChapter];
  const activeMoment = chapter ? Math.min(momentIndex, chapter.events.length - 1) : 0;
  const moment = chapter?.events[activeMoment];
  const personalSpotlights = useMemo(() => personalEvents.filter((event) => event.kind === "achievement" || event.kind === "record").length, [personalEvents]);
  const personalWorlds = useMemo(() => new Set(personalEvents.map((event) => event.world)).size, [personalEvents]);

  useEffect(() => {
    if (!playing || !chapter) return;
    // The final scene still gets its full dwell before playback releases the Play button.
    const timer = window.setTimeout(() => {
      if (activeMoment < chapter.events.length - 1) setMomentIndex(activeMoment + 1);
      else setPlaying(false);
    }, 3400);
    return () => window.clearTimeout(timer);
  }, [activeMoment, chapter, playing]);

  const pickCut = (nextCut: "club" | "mine") => {
    setCut(nextCut);
    setChapterIndex(0);
    setMomentIndex(0);
    setPlaying(false);
  };

  const director = viewer
    ? <section className="chronicle-director is-member" aria-labelledby="director-cut-title">
        <div className="director-portrait" aria-hidden="true"><div className={viewer.avatarBorderClass}><img alt="" src={viewer.avatar} /></div><i /></div>
        <div className="director-identity"><p className="eyebrow"><UserRound aria-hidden="true" size={13} /> Your Chronicle showcase</p><h2 id="director-cut-title">{viewer.displayName}&apos;s <em>Director&apos;s Cut</em></h2>{viewer.title ? <span className={`habitat-title director-title ${viewer.title.className}`}><span>{viewer.title.name}</span></span> : <span className="director-untitled">Legend in progress</span>}<p>Your cut follows only moments linked to your member profile or claimed game identities. Names alone never count as proof.</p></div>
        <dl className="director-metrics"><div><dt>Your moments</dt><dd>{personalEvents.length}</dd></div><div><dt>Your worlds</dt><dd>{personalWorlds}</dd></div><div><dt>Spotlights</dt><dd>{personalSpotlights}</dd></div></dl>
        <div className="director-cut-switch" role="group" aria-label="Choose replay cut"><button aria-pressed={cut === "club"} className={cut === "club" ? "selected" : ""} onClick={() => pickCut("club")} type="button"><UsersRound aria-hidden="true" size={15} /> Club cut</button><button aria-pressed={cut === "mine"} className={cut === "mine" ? "selected" : ""} disabled={!personalEvents.length} onClick={() => pickCut("mine")} title={personalEvents.length ? "Play only your verified moments" : "No owned moments are present in this retained reel"} type="button"><CircleUserRound aria-hidden="true" size={15} /> Your cut</button></div>
        {!personalEvents.length ? <p className="director-no-scenes">No moments in this retained reel are linked to your profile or claimed identities yet.</p> : null}
      </section>
    : <section className="chronicle-director is-guest" aria-labelledby="director-cut-title">
        <div className="director-guest-mark" aria-hidden="true"><UserRound /></div><div className="director-identity"><p className="eyebrow">Member-only picture edit</p><h2 id="director-cut-title">Put yourself in the spotlight.</h2><p>Sign in to reveal a private cut built from your claimed identities, avatar, title, achievements, records, and retained sessions.</p></div><Link className="director-sign-in" href="/sign-in">Open your Director&apos;s Cut <ChevronRight aria-hidden="true" size={15} /></Link>
      </section>;

  if (!chapter || !moment) return <>
    {director}
    <section className="replay-empty"><Film aria-hidden="true" /><p className="eyebrow">The projector is ready</p><h2>{filtered ? "No moments match this cut." : "The first reel is still blank."}</h2><p>{filtered ? "Change the world or event filter to open another evidence reel." : "The theater stays dark until a trusted source retains a Chronicle event."}</p></section>
  </>;

  const pickChapter = (index: number) => {
    setChapterIndex(index);
    setMomentIndex(0);
    setPlaying(false);
  };
  const copyRecap = async () => {
    const copied = await writeToClipboard(buildRecapCopy(chapter, cut === "mine" ? viewer?.displayName : undefined));
    setCopyState(copied ? "done" : "failed");
    window.setTimeout(() => setCopyState("idle"), 2600);
  };
  const downloadRecapCard = async () => {
    setExportState("working");
    try {
      await renderRecapCard(chapter, cut === "mine" ? viewer : null);
      setExportState("done");
    } catch {
      setExportState("failed");
    }
    window.setTimeout(() => setExportState("idle"), 2600);
  };
  const total = chapter.events.length;
  const points = routePoints(total);
  const viewerMoment = isViewerMoment(moment, viewer);

  return <>
    {director}
    <section className="replay-theater" aria-labelledby="replay-title">
      <div className="replay-theater-heading">
        <div><p className="eyebrow"><Clapperboard aria-hidden="true" size={13} /> {cut === "mine" ? "Personal evidence reel" : "Daily evidence reel"}</p><h2 id="replay-title">{cut === "mine" && viewer ? `${viewer.displayName}'s Chronicle` : "Previously in the Habitat…"}</h2><p>{chapter.label}. {cut === "mine" ? "Every scene is linked to your verified Habitat identity." : "Every scene below comes from retained evidence."}</p></div>
        <dl><div><dt>Moments</dt><dd>{total}</dd></div><div><dt>Worlds</dt><dd>{chapter.worlds.length}</dd></div><div><dt>{cut === "mine" ? "Identities" : "Players"}</dt><dd>{chapter.actors.length}</dd></div></dl>
      </div>

      <div className="replay-chapter-picker" role="group" aria-label="Choose Chronicle day">
        {chapters.map((item, index) => <button aria-pressed={index === activeChapter} className={index === activeChapter ? "selected" : ""} key={item.key} onClick={() => pickChapter(index)} title={`${item.label} · ${item.events.length} moment${item.events.length === 1 ? "" : "s"}`} type="button"><span>{shortDate(item.events[0]!.occurredAt)}</span><strong>{item.events.length}</strong></button>)}
      </div>

      <div className={`replay-screen kind-${moment.kind}${viewerMoment ? " is-viewer-moment" : ""}`}>
        <div className="replay-film-sprockets" aria-hidden="true"><i /><i /></div>
        <div className="replay-light-leak" aria-hidden="true" />
        <div className="replay-screen-dust" aria-hidden="true">{Array.from({ length: 16 }, (_, index) => <i key={index} />)}</div>
        <div className="replay-screen-topline"><span>{cut === "mine" ? "Director's cut" : "Chronicle reel"} / {String(activeChapter + 1).padStart(2, "0")}</span><span>Verified cut · {String(activeMoment + 1).padStart(2, "0")}:{String(total).padStart(2, "0")}</span></div>
        <div className="replay-scene" key={moment.id}>
          <div className="replay-scene-orbit" aria-hidden="true"><i /><i /><i />{viewerMoment && viewer ? <div className="replay-member-cameo"><img alt="" src={viewer.avatar} /><span /></div> : <b>{activeMoment + 1}</b>}</div>
          <div className="replay-scene-copy"><p className="replay-scene-kicker"><Sparkles aria-hidden="true" size={14} /> {chronicleKindLabel(moment.kind)} {viewerMoment ? <span>Your moment</span> : null}</p><h3>{moment.text}</h3><div><Link href={moment.sourceHref}>{moment.world}</Link><time dateTime={moment.occurredAt}>{sceneTime(moment.occurredAt)}</time></div><Link className="replay-receipt" href={moment.permalinkHref}>Open evidence receipt <Link2 aria-hidden="true" size={14} /></Link></div>
        </div>
        <div className="replay-controls">
          <button aria-label="Previous moment" disabled={activeMoment === 0} onClick={() => { setMomentIndex(Math.max(0, activeMoment - 1)); setPlaying(false); }} type="button"><ChevronLeft aria-hidden="true" /></button>
          <button className="replay-play" aria-label={playing ? "Pause replay" : "Play replay"} disabled={total === 1} onClick={() => { if (!playing && activeMoment === total - 1) setMomentIndex(0); setPlaying((value) => !value); }} type="button">{playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}<span>{playing ? "Pause" : "Play the day"}</span></button>
          <button aria-label="Next moment" disabled={activeMoment === total - 1} onClick={() => { setMomentIndex(Math.min(total - 1, activeMoment + 1)); setPlaying(false); }} type="button"><ChevronRight aria-hidden="true" /></button>
          <div className="replay-progress" role="group" aria-label={`Moment ${activeMoment + 1} of ${total}`}>{chapter.events.map((event, index) => <button aria-current={index === activeMoment ? "true" : undefined} aria-label={`Open moment ${index + 1}: ${event.text}`} className={index <= activeMoment ? "seen" : ""} key={event.id} onClick={() => { setMomentIndex(index); setPlaying(false); }} type="button"><i /></button>)}</div>
        </div>
      </div>

      <div className="replay-story-grid">
        <section className="journey-map"><div className="replay-panel-heading"><div><p className="eyebrow"><Map aria-hidden="true" size={13} /> Journey path</p><h3>{cut === "mine" ? "The path you left behind" : "The route they left behind"}</h3></div><span>Abstract sequence · not coordinates</span></div><svg aria-label={`Abstract event path through ${chapter.worlds.join(", ")}`} preserveAspectRatio="none" role="img" viewBox="0 0 720 180"><polyline points={points} /><g>{points.split(" ").map((point, index) => { const [cx, cy] = point.split(","); return <circle className={index === activeMoment ? "current" : index < activeMoment ? "visited" : ""} cx={cx} cy={cy} key={`${chapter.events[index]!.id}-route`} r={index === activeMoment ? 8 : 5} />; })}</g></svg><div className="journey-worlds">{chapter.worlds.map((world) => <span key={world}>{world}</span>)}</div></section>
        <aside className="replay-sidebar">
          <section><p className="eyebrow"><Trophy aria-hidden="true" size={13} /> Spotlight reel</p><strong>{chapter.spotlightCount}</strong><span>achievement and record moment{chapter.spotlightCount === 1 ? "" : "s"} in this chapter</span></section>
          <section><p className="eyebrow"><CircleUserRound aria-hidden="true" size={13} /> {cut === "mine" ? "Your identities" : "Player trails"}</p>{chapter.actors.length ? <div className="replay-actors">{chapter.actors.slice(0, 5).map((actor) => actor.href ? <Link href={actor.href} key={actor.name}>{actor.name}</Link> : <span key={actor.name}>{actor.name}</span>)}</div> : <span>No player identity was named in this chapter.</span>}</section>
          <section className="replay-media-status"><p className="eyebrow"><Film aria-hidden="true" size={13} /> Group media</p><span>No screenshot or clip evidence is attached to these retained entries.</span></section>
          <button className="replay-copy" onClick={copyRecap} type="button">{copyState === "done" ? <Check aria-hidden="true" /> : copyState === "failed" ? <AlertTriangle aria-hidden="true" /> : <Copy aria-hidden="true" />} {copyState === "done" ? "Recap copied" : copyState === "failed" ? "Copy blocked — select the text" : "Copy for Discord"}</button>
        </aside>
      </div>
      <section className="replay-card-studio" aria-labelledby="recap-card-heading">
        <div className="replay-card-preview">
          <div><p>The Habitat / {cut === "mine" ? "Director's Cut" : "Private Chronicle"}</p><h3 id="recap-card-heading">{cut === "mine" && viewer ? `${viewer.displayName}'s Chronicle` : "Previously in the Habitat…"}</h3><span>{chapter.label}</span></div>
          <dl><div><dt>Moments</dt><dd>{total}</dd></div><div><dt>Worlds</dt><dd>{chapter.worlds.length}</dd></div><div><dt>{cut === "mine" ? "Spotlights" : "Players"}</dt><dd>{cut === "mine" ? chapter.spotlightCount : chapter.actors.length}</dd></div></dl>
          <small>Verified retained evidence</small>
        </div>
        <div className="replay-card-actions"><div><p className="eyebrow">Discord recap card</p><h3>{cut === "mine" ? "Carry your story back to the crew." : "Carry the story back to the crew."}</h3><p>The exported PNG is assembled locally from this chapter. No Chronicle data is sent to a third party.</p></div><button disabled={exportState === "working"} onClick={downloadRecapCard} type="button">{exportState === "done" ? <Check aria-hidden="true" /> : exportState === "failed" ? <AlertTriangle aria-hidden="true" /> : <Download aria-hidden="true" />} {exportState === "working" ? "Assembling card…" : exportState === "done" ? "Card downloaded" : exportState === "failed" ? "Card export failed" : "Download recap card"}</button></div>
      </section>
    </section>

    <section className="chronicle-evidence-reel" aria-labelledby="evidence-reel-title">
      <div className="replay-panel-heading"><div><p className="eyebrow"><Clock3 aria-hidden="true" size={13} /> Permanent archive</p><h2 id="evidence-reel-title">{cut === "mine" ? "Your evidence reel" : "The evidence reel"}</h2></div><span>{cutEvents.length} retained entr{cutEvents.length === 1 ? "y" : "ies"}</span></div>
      <ol>{cutEvents.map((event, index) => { const owned = isViewerMoment(event, viewer); return <li className={`kind-${event.kind}${owned ? " is-viewer-event" : ""}`} id={event.id} key={event.id}><span className="evidence-index">{String(index + 1).padStart(2, "0")}</span><div><p>{chronicleKindLabel(event.kind)}{owned ? " · Your moment" : ""}</p><h3>{event.text}</h3><footer><time dateTime={event.occurredAt}>{archiveTime(event.occurredAt)}</time><Link href={event.sourceHref}>{event.world}</Link></footer></div><Link className="evidence-link" href={event.permalinkHref} aria-label={`Open evidence receipt for ${event.text}`}><Link2 aria-hidden="true" /></Link></li>; })}</ol>
    </section>
  </>;
}

/** Clipboard API needs a secure origin; a Habitat served over plain LAN http falls back to a selection copy. */
async function writeToClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path below
  }
  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
    document.body.append(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    return copied;
  } catch {
    return false;
  }
}

async function renderRecapCard(chapter: ChronicleChapter, viewer: ChronicleReplayViewer | null) {
  const personal = Boolean(viewer);
  const background = await loadImage("/images/chronicle/chronicle-recap-card.png");
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 900;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser refused a 2D canvas for the recap card.");
  context.drawImage(background, 0, 0, canvas.width, canvas.height);
  const veil = context.createLinearGradient(0, 0, 1320, 0);
  veil.addColorStop(0, "rgba(7, 10, 8, .38)");
  veil.addColorStop(.68, "rgba(7, 10, 8, .64)");
  veil.addColorStop(1, "rgba(7, 10, 8, .08)");
  context.fillStyle = veil;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#c7a968";
  context.font = "700 23px Arial";
  context.letterSpacing = "4px";
  context.fillText(personal ? "THE HABITAT  /  DIRECTOR'S CUT" : "THE HABITAT  /  PRIVATE CHRONICLE", 104, 105);
  context.fillStyle = "#f0eadc";
  context.font = "600 78px Georgia";
  context.letterSpacing = "0px";
  context.fillText(personal && viewer ? `${viewer.displayName}'s Chronicle` : "Previously in the Habitat…", 100, 205);
  context.fillStyle = "#c6bfae";
  context.font = "400 28px Arial";
  context.fillText(chapter.label, 104, 255);
  context.fillStyle = "#d7c185";
  context.font = "600 28px Georgia";
  context.fillText(`${chapter.events.length} MOMENTS`, 104, 342);
  context.fillText(`${chapter.worlds.length} WORLDS`, 365, 342);
  context.fillText(personal ? `${chapter.spotlightCount} SPOTLIGHTS` : `${chapter.actors.length} PLAYERS`, 590, 342);
  context.fillStyle = "rgba(214, 195, 151, .38)";
  context.fillRect(104, 376, 790, 2);
  context.font = "600 31px Georgia";
  let y = 438;
  for (const event of chapterHighlights(chapter)) {
    context.fillStyle = chronicleKindColor(event.kind);
    context.fillRect(104, y - 21, 8, 8);
    context.fillStyle = "#eee8da";
    y = drawWrappedText(context, event.text, 137, y, 730, 41, 2) + 25;
  }
  context.fillStyle = "#9c9d91";
  context.font = "500 19px Arial";
  context.fillText("VERIFIED RETAINED EVIDENCE  •  PRIVATE RECAP", 104, 816);
  if (personal && viewer) drawDirectorSeal(context, viewer.displayName, viewer.title?.name);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("The recap card could not be encoded as a PNG.");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `habitat-chronicle-${personal ? "directors-cut-" : ""}${chapter.key}.png`;
  // Firefox only honours a download from an anchor that is attached to the document, and revoking
  // the object URL in the same tick can cancel the transfer before it starts.
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load the Chronicle recap artwork."));
    image.src = src;
  });
}

/** Wraps to `maxLines` so a long retained headline can never run over the card footer. */
function drawWrappedText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  let cursor = 0;
  for (; cursor < words.length; cursor++) {
    const test = line ? `${line} ${words[cursor]}` : words[cursor]!;
    if (line && context.measureText(test).width > maxWidth) {
      lines.push(line);
      if (lines.length === maxLines) break;
      line = words[cursor]!;
    } else line = test;
  }
  if (lines.length < maxLines && line) lines.push(line);
  const overflowed = cursor < words.length;
  lines.forEach((entry, index) => {
    const truncate = overflowed && index === lines.length - 1;
    context.fillText(truncate ? `${ellipsize(context, entry, maxWidth)}…` : entry, x, y + index * lineHeight);
  });
  return y + Math.max(0, lines.length - 1) * lineHeight;
}

function ellipsize(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  let value = text;
  while (value.length > 1 && context.measureText(`${value}…`).width > maxWidth) value = value.slice(0, -1).trimEnd();
  return value;
}

function drawDirectorSeal(context: CanvasRenderingContext2D, displayName: string, title?: string) {
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "H";
  context.save();
  context.beginPath();
  context.arc(1332, 212, 106, 0, Math.PI * 2);
  context.fillStyle = "rgba(10, 13, 11, .78)";
  context.fill();
  context.lineWidth = 3;
  context.strokeStyle = "rgba(213, 181, 105, .72)";
  context.stroke();
  context.beginPath();
  context.arc(1332, 212, 88, 0, Math.PI * 2);
  context.setLineDash([4, 8]);
  context.strokeStyle = "rgba(213, 181, 105, .45)";
  context.stroke();
  context.setLineDash([]);
  context.fillStyle = "#ead8a9";
  context.font = "600 70px Georgia";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(initials, 1332, 205);
  context.fillStyle = "#b9ad91";
  context.font = "700 16px Arial";
  context.fillText((title ?? "HABITAT MEMBER").toUpperCase().slice(0, 30), 1332, 348);
  context.restore();
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: HABITAT_TIME_ZONE, month: "short", day: "numeric" }).format(new Date(value));
}

function sceneTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: HABITAT_TIME_ZONE, hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function archiveTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: HABITAT_TIME_ZONE, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function routePoints(count: number) {
  if (count === 1) return "360,90";
  return Array.from({ length: count }, (_, index) => {
    const x = 28 + (index / (count - 1)) * 664;
    const y = 90 + Math.sin(index * 1.73) * 40 + ((index % 3) - 1) * 12;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}
