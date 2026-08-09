import { DiscordSignInButton } from "@/components/discord-sign-in-button";
import { isDiscordConfigured } from "@/auth";

export default function SignInPage() {
  return (
    <section className="auth-shell">
      <div className="auth-panel">
        <p className="eyebrow">Members only</p>
        <h1>Enter the Habitat.</h1>
        <p>God&apos;s Country is private. Access is approved by invitation.</p>
        {isDiscordConfigured ? (
          <DiscordSignInButton />
        ) : (
          <p className="auth-pending">Discord sign-in is not configured yet.</p>
        )}
      </div>
    </section>
  );
}
