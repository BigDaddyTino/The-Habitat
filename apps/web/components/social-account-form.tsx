"use client";

import { useState } from "react";
import { Gamepad2, Github, MessageCircle, Radio, Tv, Youtube } from "lucide-react";
import { addSocialAccount } from "@/app/profile/actions";
import { socialPlatformLabels, type SocialPlatform } from "@/lib/social-platforms";

const providers: Array<{ id: Exclude<SocialPlatform, "STEAM">; icon: typeof Radio }> = [
  { id: "TWITCH", icon: Radio },
  { id: "DISCORD", icon: MessageCircle },
  { id: "YOUTUBE", icon: Youtube },
  { id: "XBOX", icon: Gamepad2 },
  { id: "PLAYSTATION", icon: Gamepad2 },
  { id: "EPIC_GAMES", icon: Gamepad2 },
  { id: "BATTLE_NET", icon: Gamepad2 },
  { id: "RIOT_GAMES", icon: Tv },
  { id: "GITHUB", icon: Github },
];

export function SocialAccountForm() {
  const [platform, setPlatform] = useState<Exclude<SocialPlatform, "STEAM">>("TWITCH");
  return <form action={addSocialAccount} className="social-link-form">
    <fieldset>
      <legend>Choose a network</legend>
      <div className="social-provider-grid">
        {providers.map(({ id, icon: Icon }) => <label className={platform === id ? "selected" : ""} key={id}>
          <input checked={platform === id} name="platform" onChange={() => setPlatform(id)} type="radio" value={id} />
          <Icon aria-hidden="true" size={14} />
          <span>{socialPlatformLabels[id]}</span>
        </label>)}
      </div>
    </fieldset>
    <div className="social-handle-row">
      <label><span>{socialPlatformLabels[platform]} handle</span><input autoComplete="off" name="handle" placeholder={`Your ${socialPlatformLabels[platform]} name`} required /></label>
      <button type="submit">Add to profile</button>
    </div>
    <small>Public profile link only. This does not report live presence or verify ownership.</small>
  </form>;
}
