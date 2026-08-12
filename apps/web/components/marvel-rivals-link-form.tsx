"use client";

import { useActionState } from "react";
import { linkMarvelRivalsProfile, type RivalsLinkState } from "@/app/club-games/[slug]/actions";

const initialRivalsLinkState: RivalsLinkState = { status: "idle", message: "" };

export function MarvelRivalsLinkForm({ providerReady }: { providerReady: boolean }) {
  const [state, action, pending] = useActionState(linkMarvelRivalsProfile, initialRivalsLinkState);
  return <form action={action} className="rivals-link-form">
    <label>Rivals name or UID<input autoComplete="off" disabled={!providerReady || pending} maxLength={32} name="query" placeholder="Your in-game name" required /></label>
    <label>Platform<select defaultValue="PC" disabled={!providerReady || pending} name="platform"><option value="PC">PC</option><option value="PLAYSTATION">PlayStation</option><option value="XBOX">Xbox</option></select></label>
    <button disabled={!providerReady || pending} type="submit">{pending ? "Checking profile..." : providerReady ? "Link profile" : "Linking offline"}</button>
    {state.message ? <p className={`rivals-form-message ${state.status}`} role="status">{state.message}</p> : null}
  </form>;
}
