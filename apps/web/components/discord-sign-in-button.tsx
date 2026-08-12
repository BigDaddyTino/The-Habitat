"use client";

import { MessageCircle } from "lucide-react";
import { signIn } from "next-auth/react";

export function DiscordSignInButton() {
  return (
    <button className="discord-sign-in" type="button" onClick={() => signIn("discord", { callbackUrl: "/" })}>
      <MessageCircle aria-hidden="true" size={17} />
      Join or sign in with Discord
    </button>
  );
}
