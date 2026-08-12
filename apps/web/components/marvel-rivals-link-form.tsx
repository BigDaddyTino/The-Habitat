"use client";

import { useActionState, useState } from "react";
import { Gamepad2, Monitor } from "lucide-react";
import Link from "next/link";
import { linkMarvelRivalsProfile, type RivalsLinkState } from "@/app/club-games/[slug]/actions";

const initialRivalsLinkState: RivalsLinkState = { status: "idle", message: "" };

export function MarvelRivalsLinkForm({ providerReady, steamLinked = false }: { providerReady: boolean; steamLinked?: boolean }) {
  const [state, action, pending] = useActionState(linkMarvelRivalsProfile, initialRivalsLinkState);
  const [platform, setPlatform] = useState("PC");
  return <form action={action} className="rivals-link-form">
    <div className="rivals-platform-field"><span>Playing on</span><div className="rivals-platform-switch" role="radiogroup" aria-label="Rivals platform">
      {[{ id: "PC", label: "PC", icon: Monitor }, { id: "PLAYSTATION", label: "PS", icon: Gamepad2 }, { id: "XBOX", label: "Xbox", icon: Gamepad2 }].map(({ id, label, icon: Icon }) => <label className={platform === id ? "selected" : ""} key={id}><input checked={platform === id} disabled={!providerReady || pending} name="platform" onChange={() => setPlatform(id)} type="radio" value={id} /><Icon aria-hidden="true" size={13} /> {label}</label>)}
    </div></div>
    <label className="rivals-query-field"><span>Rivals callsign or UID</span><input autoComplete="off" disabled={!providerReady || pending} maxLength={32} name="query" placeholder="Enter your public profile" required /></label>
    <label className="rivals-consent"><input disabled={!providerReady || pending} name="providerConsent" required type="checkbox" /> I consent to Habitat retrieving and retaining my provider-reported profile and match history under the <Link href="/privacy">privacy notice</Link>. My profile starts private, holds no squad seat, and both stay yours to change.</label>
    <button disabled={!providerReady || pending} type="submit">{pending ? "Checking profile..." : providerReady ? "Link my Rivals profile" : "Linking offline"}</button>
    {!steamLinked ? <p className="rivals-form-message idle">Tip: <Link href="/profile">link your Steam account</Link> too. Habitat refreshes your Rivals stats hourly while Steam shows you in the game (and once more after you stop); without Steam they refresh daily.</p> : null}
    {state.message ? <p className={`rivals-form-message ${state.status}`} role="status">{state.message}</p> : null}
  </form>;
}
