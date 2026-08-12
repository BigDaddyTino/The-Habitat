import Link from "next/link";

export default function PrivacyPage() {
  const storageCountry = process.env.STEAM_DATA_STORAGE_COUNTRY?.trim();
  return <section className="page-shell policy-page">
    <div className="page-intro"><p className="eyebrow">Member data</p><h1>Privacy &amp; provider data</h1><p>The Habitat is a private clubhouse. External account data is collected only for members who deliberately connect a provider and enable the relevant feature.</p></div>
    <article>
      <h2>Steam identity and enrichment</h2>
      <p>Steam OpenID verification proves which SteamID64 belongs to a signed-in Habitat member. Verification can attach matching hosted-game identities without granting The Habitat a Steam password or permission to change the Steam account.</p>
      <p>Steam profile and library enrichment is a separate opt-in. When enabled, The Habitat may cache the public display name, profile and avatar URLs, Steam visibility indicators, current-game information when exposed, owned-game app IDs and names, Steam-reported playtime, recent playtime, and last-played timestamps. Private, unavailable, or unsupported data is not inferred.</p>
      <p>Cached Steam data is used only for the member&apos;s Habitat gamer profile and member-controlled public card. It does not create Habitat XP. Steam data is presented as-is and is not represented as endorsed by Valve.</p>
      <p>{storageCountry ? <>Steam data is stored on The Habitat&apos;s private infrastructure in <strong>{storageCountry}</strong>.</> : <>Steam enrichment is not operational until the administrator configures and publishes its data-storage country.</>}</p>
    </article>
    <article>
      <h2>Marvel Rivals Club Game data</h2>
      <p>Rivals linking is member-asserted and does not prove ownership of the entered UID. Before linking, a member must consent to retrieval and retention of the provider-reported public profile, rank and aggregate stats, match history, linked participant results, and supported hero performance. New links begin private.</p>
      <p>Members can separately make their Rivals profile and qualifying evidence visible in the Assembly Room and Chronicle. Disconnecting deletes the member&apos;s provider profile, snapshots, match participants, derived activities, activity-backed awards and record entries, and any matches left without participants. Audit entries retain only the security record of the action.</p>
    </article>
    <article>
      <h2>Control, retention, and deletion</h2>
      <p>Members can keep Steam enrichment private, stop enrichment while retaining Steam identity verification, or disconnect Steam entirely. Stopping enrichment deletes the cached Steam profile and library rows and prevents future enrichment. Disconnecting Steam also deletes those cached rows through the same account boundary.</p>
      <p>Hosted-world evidence, rewards, and audit entries have separate integrity and security purposes. They are not removed by disconnecting an external provider.</p>
    </article>
    <article>
      <h2>Providers and security</h2>
      <p>Private provider keys stay in server configuration and are never sent to browsers. The Habitat does not request Steam passwords, expose its database or management services, sell provider data, or use it for unsolicited marketing.</p>
      <p>Members can contact a Habitat administrator to inspect or correct their account data. Provider access may change or end at any time; cached data is labeled with its source and last successful sync.</p>
    </article>
    <Link className="primary-link" href="/profile">Return to your profile</Link>
  </section>;
}
