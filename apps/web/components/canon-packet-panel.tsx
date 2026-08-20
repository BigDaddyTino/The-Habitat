"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Send, Undo2 } from "lucide-react";
import { storyCanonPacketTargetLabels, storyCanonPacketTargetKinds, type StoryCanonPacket, type StoryCanonPacketTargetKind } from "@habitat/shared";
import { pushCanonPacket, withdrawCanonPacket } from "@/app/codex/actions";

type Option = { slug: string; title: string };

/**
 * The road out of the development room, on a thread's own dossier.
 *
 * Three visible steps, in the order a writer thinks in: what part of this is
 * settled, where does it belong, and who or what does it touch. The closing
 * line says exactly what happens next, because "push to canon" sounds far more
 * final than it is — pushing settles nothing. It puts the material in the
 * canon inbox; a writer weaves it into a flow by hand; and only the padlock on
 * a board ever freezes anything.
 */
export function CanonPacketPanel({ entryId, version, threadTitle, packets, regions, companions, entries }: {
  entryId: string;
  version: number;
  threadTitle: string;
  packets: StoryCanonPacket[];
  regions: Option[];
  companions: Option[];
  /** Everything in the bible, for "who or what does this touch". */
  entries: Option[];
}) {
  const [targetKind, setTargetKind] = useState<StoryCanonPacketTargetKind>("campaign");
  const [targetRegion, setTargetRegion] = useState("");
  const [targetCompanion, setTargetCompanion] = useState("");

  const pending = packets.filter((packet) => packet.status === "pending");
  const woven = packets.filter((packet) => packet.status === "woven");

  const where = targetKind === "region"
    ? (regions.find((region) => region.slug === targetRegion)?.title ?? "a place you have not picked yet")
    : targetKind === "companions"
      ? (companions.find((option) => option.slug === targetCompanion)?.title ?? "the companions")
      : storyCanonPacketTargetLabels[targetKind];

  return (
    <section className="canon-packet-panel">
      <div className="section-heading"><h2><Send aria-hidden="true" size={17} /> Send a settled piece to canon</h2></div>

      {packets.length === 0 ? (
        <p className="canon-packet-intro">
          When part of this thread stops being an argument and starts being true, send that part over. It waits in the
          canon inbox until somebody builds it into a story board — nothing here goes live on its own.
        </p>
      ) : (
        <ul className="canon-packet-list">
          {pending.map((packet) => (
            <li key={packet.id}>
              <p className="eyebrow">Waiting to be woven in — {packet.targetKind === "region" ? (regions.find((r) => r.slug === packet.targetRegion)?.title ?? packet.targetRegion) : packet.targetKind === "companions" && packet.targetCompanion ? (companions.find((c) => c.slug === packet.targetCompanion)?.title ?? packet.targetCompanion) : storyCanonPacketTargetLabels[packet.targetKind]}</p>
              <strong>{packet.title}</strong>
              <span>pushed by {packet.pushedBy}</span>
              <div className="canon-packet-row">
                <Link className="canon-packet-open" href={`/codex/stories/canon?target=${encodeURIComponent(packet.targetKind === "region" ? `region:${packet.targetRegion}` : packet.targetKind === "companions" && packet.targetCompanion ? `companion:${packet.targetCompanion}` : packet.targetKind)}#canon-inbox`}>
                  See it in the inbox <ArrowRight aria-hidden="true" size={11} />
                </Link>
                <form action={withdrawCanonPacket}>
                  <input name="entryId" type="hidden" value={entryId} />
                  <input name="version" type="hidden" value={version} />
                  <input name="packetId" type="hidden" value={packet.id} />
                  <button className="icon-action reject" title="Take this back out of the inbox" type="submit"><Undo2 aria-hidden="true" size={13} /> Take it back</button>
                </form>
              </div>
            </li>
          ))}
          {woven.map((packet) => (
            <li className="is-woven" key={packet.id}>
              <p className="eyebrow"><Check aria-hidden="true" size={11} /> Woven in{packet.wovenBy ? ` by ${packet.wovenBy}` : ""}</p>
              <strong>{packet.title}</strong>
              {packet.wovenInto.length > 0 ? (
                <span>became {packet.wovenInto.map((slug) => <Link href={`/codex/arc/${slug}`} key={slug}>{slug.replaceAll("-", " ")}</Link>)}</span>
              ) : <span>no story board was named</span>}
            </li>
          ))}
        </ul>
      )}

      <form action={pushCanonPacket} className="story-form canon-packet-form">
        <input name="entryId" type="hidden" value={entryId} />
        <input name="version" type="hidden" value={version} />

        <p className="canon-packet-step">1 — What part of this is settled?</p>
        <label>Give it a short name<input maxLength={120} name="title" placeholder="What happens at the chapel" required type="text" /></label>
        <label>Write the settled part<textarea maxLength={8000} name="body" placeholder="Only the part the room has stopped arguing about. Leave the rest here in the thread." required rows={6} /></label>

        <p className="canon-packet-step">2 — Where does it belong?</p>
        <label>Pick its section<select name="targetKind" onChange={(event) => setTargetKind(event.target.value as StoryCanonPacketTargetKind)} value={targetKind}>
          {storyCanonPacketTargetKinds.map((kind) => <option key={kind} value={kind}>{storyCanonPacketTargetLabels[kind]}</option>)}
        </select></label>
        {targetKind === "region" ? (
          <label>Which place<select name="targetRegion" onChange={(event) => setTargetRegion(event.target.value)} required value={targetRegion}>
            <option value="">Pick a place</option>
            {regions.map((region) => <option key={region.slug} value={region.slug}>{region.title}</option>)}
          </select></label>
        ) : null}
        {targetKind === "companions" ? (
          <label>Which companion<select name="targetCompanion" onChange={(event) => setTargetCompanion(event.target.value)} value={targetCompanion}>
            <option value="">Companions in general</option>
            {companions.map((option) => <option key={option.slug} value={option.slug}>{option.title}</option>)}
          </select>
          <small className="sheet-hint">Leave it general if the material is not about one person in particular.</small></label>
        ) : null}

        <p className="canon-packet-step">3 — Who or what does it touch?</p>
        <label>Pick everyone and everywhere it names<select multiple name="entries" size={6}>
          {entries.map((entry) => <option key={entry.slug} value={entry.slug}>{entry.title}</option>)}
        </select>
        <small className="sheet-hint">Hold Ctrl (or ⌘) to pick more than one. Each one gets a note on their page that material about them is waiting.</small></label>

        <p className="canon-packet-preview">
          This lands in the canon inbox for <strong>{where}</strong>. Nothing goes live until somebody weaves it in,
          and only a padlock on a story board ever freezes anything.
        </p>
        <button className="save-server" type="submit"><Send aria-hidden="true" size={14} /> Send it to canon</button>
      </form>

      <p className="story-inspector-hint">It stays attached to <strong>{threadTitle}</strong> either way — pushing never removes anything from this thread.</p>
    </section>
  );
}
