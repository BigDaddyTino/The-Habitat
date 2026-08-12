import { DiscordSignInButton } from "@/components/discord-sign-in-button";
import { isDiscordConfigured } from "@/auth";
import { redeemInviteCode } from "./actions";

const authErrors: Record<string, { title: string; detail: string }> = {
  AccessDenied: {
    title: "That Discord account is not on the guest list yet.",
    detail: "Ask any active Habitat member for their current weekly code or an invitation to the exact email attached to your Discord account.",
  },
  OAuthAccountNotLinked: {
    title: "That email is already tied to another sign-in.",
    detail: "Use the same Discord account you originally used for The Habitat.",
  },
  Configuration: {
    title: "The lodge door needs attention.",
    detail: "The sign-in service is temporarily unavailable. Let the Habitat administrator know.",
  },
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string; code?: string }> }) {
  const { error, code } = await searchParams;
  const authError = error ? authErrors[error] ?? { title: "Discord sign-in did not finish.", detail: "Nothing was changed. Please try again or ask a Habitat member to confirm your invitation." } : null;
  return (
    <section className="auth-shell">
      <div className="auth-panel">
        <p className="eyebrow">Members only</p>
        <h1>Enter the Habitat.</h1>
        <p>God&apos;s Country is private. An active member sends the invitation; Discord proves it is really you.</p>
        {authError ? <div className="auth-error" role="alert"><strong>{authError.title}</strong><span>{authError.detail}</span></div> : null}
        {code === "ready" ? <div className="invite-code-ready" role="status"><strong>Weekly code accepted.</strong><span>Continue with Discord within 15 minutes to finish joining.</span></div> : <form action={redeemInviteCode} className="invite-code-entry"><label htmlFor="invite-code">Have a member&apos;s weekly code?</label><div><input autoCapitalize="characters" autoComplete="one-time-code" id="invite-code" name="inviteCode" placeholder="HAB-XXXXX-XXXXX" required /><button type="submit">Unlock</button></div>{code === "invalid" ? <p role="alert">That code is invalid or has rotated. Ask the member for their current code.</p> : null}</form>}
        <div className="auth-divider"><span>or use an email invitation</span></div>
        {isDiscordConfigured ? (
          <DiscordSignInButton />
        ) : (
          <p className="auth-pending">Discord sign-in is not configured yet.</p>
        )}
      </div>
    </section>
  );
}
