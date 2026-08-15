"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDownLeft, ArrowDownRight, Crown, Ghost, ShieldAlert, Sparkles } from "lucide-react";
import { useRef, type PointerEvent } from "react";

type HallDoorProps = {
  activeRecords: number;
  heldRecords: number;
};

export function HallsGateway({ legends, shame }: { legends: HallDoorProps; shame: HallDoorProps }) {
  const gateway = useRef<HTMLElement>(null);

  function moveLight(event: PointerEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    gateway.current?.style.setProperty("--gateway-x", x.toFixed(3));
    gateway.current?.style.setProperty("--gateway-y", y.toFixed(3));
  }

  function resetLight() {
    gateway.current?.style.setProperty("--gateway-x", "0");
    gateway.current?.style.setProperty("--gateway-y", "0");
  }

  return <section className="halls-gateway" onPointerMove={moveLight} onPointerLeave={resetLight} ref={gateway} aria-label="Choose a record hall">
    <div className="halls-gateway-stars" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</div>
    <Link className="hall-door hall-door-legends" href="/hall-of-legends">
      <Image alt="A vast ironwood and brass trophy chamber built around a gilded antler monument" fill priority sizes="(max-width: 760px) 100vw, 50vw" src="/images/halls/hall-legends-cinematic.png" />
      <span className="hall-door-shade" aria-hidden="true" />
      <span className="hall-door-sigil"><Crown aria-hidden="true" /><i /></span>
      <span className="hall-door-copy">
        <span className="eyebrow">The honored wing</span>
        <strong>Hall of<br />Legends</strong>
        <span className="hall-door-description">Verified feats. Permanent names. The records everyone came to take.</span>
        <span className="hall-door-count"><b>{legends.heldRecords}</b> held <i /> {legends.activeRecords} active records</span>
        <span className="hall-door-action">Enter the light <ArrowDownLeft aria-hidden="true" /></span>
      </span>
      <Sparkles className="hall-door-icon" aria-hidden="true" />
    </Link>

    <div className="halls-clash" aria-hidden="true">
      <span><Crown /></span>
      <i />
      <b>Choose<br />your<br />legacy</b>
      <i />
      <span><Ghost /></span>
    </div>

    <Link className="hall-door hall-door-shame" href="/hall-of-shame">
      <Image alt="A crooked, ember-lit gallery of ridiculous gaming mishaps and toppled armor" fill priority sizes="(max-width: 760px) 100vw, 50vw" src="/images/halls/hall-shame-cinematic.png" />
      <span className="hall-door-shade" aria-hidden="true" />
      <span className="hall-door-sigil"><ShieldAlert aria-hidden="true" /><i /></span>
      <span className="hall-door-copy">
        <span className="eyebrow">The regrettable wing</span>
        <strong>Hall of<br />Shame</strong>
        <span className="hall-door-description">Verified disasters. Heroic defeats. Receipts preserved with entirely appropriate respect.</span>
        <span className="hall-door-count"><b>{shame.heldRecords}</b> held <i /> {shame.activeRecords} active records</span>
        <span className="hall-door-action">Enter the smoke <ArrowDownRight aria-hidden="true" /></span>
      </span>
      <Ghost className="hall-door-icon" aria-hidden="true" />
    </Link>
  </section>;
}
