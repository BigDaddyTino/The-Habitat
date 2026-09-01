# Authentication and Identity

The Habitat is invite-only. Discord OAuth establishes portal membership; Steam OpenID establishes Steam ownership of game identities. These are separate proof mechanisms with different scopes.

## Discord portal access

Auth.js uses Discord with database sessions. An unknown Discord user is denied before using the portal unless one of the following is true:

- Their normalized email has an unexpired, unused invitation.
- Their email exactly matches the temporary `BOOTSTRAP_ADMIN_EMAIL` setting.

Every active `USER` or `ADMIN` can create a standard `USER` invitation from the Members page. `VIEWER` accounts remain read-only and cannot issue email invitations or weekly invite codes. The invited email must be the exact email returned by Discord OAuth. Invitations expire after 14 days, can be reissued by another eligible member, and are recorded atomically with the invitation write in the audit log. Members cannot grant `ADMIN` access. An administrator can revoke a still-pending invitation; revoked invitations are excluded from every sign-in admission check and can later be deliberately reissued.

Every active member also receives a distinct weekly invite code. Codes are generated from the member ID, the Monday-based `America/New_York` week, and the server-side auth secret; they rotate every Monday and are not stored as reusable plaintext secrets. A guest enters the current code before Discord OAuth. A valid code creates a signed, HTTP-only, 15-minute referral grant, but does not create an account or bypass Discord verification.

When a new Discord account is admitted, `MemberReferral` permanently records the inviter, invited member, method (`EMAIL` or `CODE`), and code week when applicable. A matching audit entry is created with the inviter as actor. Direct email invitations take precedence if a guest also stages a weekly code, preventing ambiguous attribution.

The sign-in page owns the Auth.js error route so an uninvited Discord account receives a specific guest-list explanation instead of a generic access-denied screen.

The bootstrap account becomes active with the `ADMIN` role on its first successful login. Remove `BOOTSTRAP_ADMIN_EMAIL` after that first login. There is no public registration route.

Configure Discord redirect URIs:

- `http://localhost:3000/api/auth/callback/discord` for local development
- `https://habitat.martinobear.com/api/auth/callback/discord` for production

Keep these root `.env` values untracked:

```text
AUTH_URL=https://habitat.martinobear.com
AUTH_SECRET=<long random secret>
AUTH_TRUST_HOST=true
AUTH_DISCORD_ID=<Discord OAuth client ID>
AUTH_DISCORD_SECRET=<Discord OAuth client secret>
BOOTSTRAP_ADMIN_EMAIL=<temporary owner email only>
```

`AUTH_URL` is the canonical public Habitat origin for Auth.js, Steam OpenID, and every absolute application redirect. It is required in production because Cloudflare Tunnel terminates public HTTPS and forwards to a loopback origin; request URLs inside the service can therefore contain `localhost:3000`. Production callback and redirect handling rejects a missing, non-HTTPS, or path-bearing value instead of sending a provider or member browser to that internal address.

## Steam identity proof

Members can begin the Steam connection flow from their profile. The callback validates the signed Steam OpenID response server-side and records the SteamID64 only after validation succeeds. The browser never submits a trusted SteamID64 directly.

Steam's OpenID `realm`, `return_to`, callback comparison, and final profile redirect all derive from `AUTH_URL`, never from the reverse proxy's internal request URL. This keeps the entire round trip on `https://habitat.martinobear.com`.

Disconnecting Steam removes the proof, not the history. Identities already attached stay attached and keep earning, because ownership was established while the proof was valid; only an administrator can detach them. The profile therefore lists the exact consequences — which claims stay attached, that future SteamID64 matches will stop attaching automatically, what cached enrichment data remains — and requires an explicit acknowledgement before the disconnect runs.

A verified Steam connection automatically attaches only unclaimed identities carrying that exact SteamID64. A Steam library entry or a similar character name is not ownership proof. The profile callback reports how many exact identities were attached and directs zero-match members to the reviewed character-claim flow. Admin claim approval remains available for name-only identities that cannot be proved automatically. Both ownership paths enqueue idempotent reconciliation of attached verified history into playtime, XP, quests, achievements, rewards, profile totals, and leaderboards.

## Claim and identity safety

Because an approved claim replays an identity's whole verified history into playtime, XP, levels, achievements, rewards, and record standings, ownership is never changed without a measured preview and never without a way back.

`/admin/claims` shows each pending claim with the impact it would have, computed by projecting the claimant's progression twice — with and without the candidate identity — through the same rule engine that awards the real thing. The projection writes nothing. It reports the change in tracked hours, XP-bearing session hours, imported legacy hours, sessions, joins, XP, level, achievements, achievement points, and the specific achievements and titles that would unlock, plus the parts it deliberately does not model.

Alongside the preview each claim carries a conflict list, ordered worst first. Blocking conflicts refuse approval outright: the identity is already owned, the claimant is suspended, or the identity's SteamID64 is verified on somebody else's account. Severe conflicts — a Steam account that contradicts the claim, competing claimants, a duplicate character name the member already owns, or sessions that overlap history the member already holds — allow approval only after a typed confirmation. Overlapping sessions are the strongest available merge signal, because one person cannot be in two places at once; the check sweeps both sides' session intervals and reports the total simultaneous play with examples. Conflicts are re-detected inside the write transaction, so a preview that has gone stale cannot be acted on.

Every transition of `PlayerIdentity.userId` — by claim approval, by Steam proof, by the worker's auto-link, or by administrator revocation — writes one `IdentityOwnershipTransaction` in the same transaction as the change itself. Grants store the preview that was shown; revocations store what was actually removed. Ownership predating the ledger was backfilled, so history is never blank.

Rollback is available from the identity dossier at `/admin/claims/<identityId>`, which also carries the ownership ledger, the full claim history, the audit trail, and the evidence provenance table: which collector or import file produced each record, at what confidence, over what window, with a sample source-record hash. Provider identifiers are never displayed there — only whether proof exists and whether it matches. A rollback needs a reason and a typed confirmation, shows the same measured impact first as an unlink consequence list, and in one transaction detaches the identity, trims verified playtime XP to the evidence that remains, re-evaluates identity- and level-based achievements and revokes those no longer earned along with their rewards, titles, and synthetic award events, clears record holdings established through the identity, cancels its queued reconciliation, and rejects the claim that produced it so the member can file again. Achievements are re-evaluated rather than matched by source, so one earned from several identities survives if the remaining evidence still qualifies; activity and web-interaction awards unrelated to ownership are not touched. Weekly quest XP already banked is not recalculated, including XP from the current week, and that is stated rather than hidden.

Administrators can export a member's profile, identity ownership, progression, provider links, referrals, record holdings, and associated game evidence as JSON from the members command center or the dossier. The export is audit logged, never cached, and declares both its scope and its truncation limits; OAuth tokens, session tokens, verification tokens, and link nonces are structurally excluded.

## Observed and unclaimed players

The system keeps server observations even when nobody owns them yet. They can appear in rosters, server details, Chronicle entries, and leaderboards with explicit provisional/unclaimed labeling. They do not receive profile benefits or XP until an approved claim or verified Steam attachment establishes ownership.

Entered Twitch, social, and gaming handles are profile metadata only. They are not evidence of account ownership, playtime, presence, or live status. A typed handle never places a channel on the streaming showcase; only the verified Twitch connection below can do that.

## Twitch channel proof and the streaming showcase

Members start the Twitch connection from their profile. The flow is OAuth 2.0 authorization code: `/api/twitch/connect` stores only the SHA-256 hash of a random 32-byte `state` in `TwitchLinkNonce` with a ten-minute expiry, and `/api/twitch/callback` exchanges the code, identifies the authorizing account through Helix `/helix/users`, then revokes the member token immediately. Habitat keeps no member Twitch token; all later polling uses an app access token that identifies Habitat rather than a member.

The redirect URI is derived from `AUTH_URL` by a single shared helper used by both routes, so the authorize request and the code exchange are byte-identical. Twitch requires an exact registered match, so `https://<public origin>/api/twitch/callback` must be registered on the Twitch application.

Nonce consumption happens inside the write transaction, guarded on the unconsumed and unexpired window, and the transaction aborts unless exactly one row was consumed. A replayed callback therefore writes nothing. A Twitch identity belongs to exactly one member: the callback refuses before writing if another member already holds that Twitch user id on a channel row or on a `UserSocialAccount`, or already holds that login as a handle.

Verifying ownership is deliberately separate from being featured. `TwitchChannel.showcaseEnabled` defaults to false on first connect, is never altered by re-verifying, and changes only through the member's own showcase toggle. Disconnecting deletes the channel, its observed sessions, and the Twitch social account in one audited transaction.

Live state on `/streams` comes only from the Twitch API, and only for verified, opted-in channels. A channel absent from the Helix streams response is offline; that absence is the authoritative signal. A database check constraint keeps the live columns NULL whenever a channel is not live, so an offline channel cannot display a stale audience count. When Twitch credentials are absent the showcase states that live status is unavailable rather than implying nobody is streaming.

Discord streaming presence is a separate, weaker signal and is labeled as such. It requires the privileged `GUILD_PRESENCES` intent and stays off unless `HABITAT_DISCORD_PRESENCE=on`. Discord reports that a member is broadcasting plus a URL their own client supplied; that URL is untrusted text, so it becomes a link only when it resolves over HTTPS to that member's own verified channel, and is otherwise shown as an unverified destination that is not linked. Signals are cleared on bot startup and shutdown, because presence events fire only on change and a stale flag would otherwise read as "live" forever.

## Roles

`VIEWER`, `USER`, and `ADMIN` permissions are enforced on the server. Admin-only surfaces include member management, invitation revocation, claims, title definitions, community/Discord configuration, registry metadata, and server operations. UI visibility is not the authorization boundary.

The Admin Suite member command center can change roles, suspend or reactivate an account, revoke every database session for a member, inspect referral lineage, and revoke pending email invitations. Every mutation creates an `AuditLog` entry. Suspension revokes sessions in the same database transaction. The current administrator cannot alter their own access from this screen, and a serializable last-admin check prevents the final active administrator from being demoted or suspended.

## Operator connection audit

Run `pnpm check:connections` from the repository root after changing credentials, callback registrations, proxy routing, history sources, or provider configuration. The read-only audit verifies the database, authenticated private agent, required game-specific legacy identity sources, public application origin, Auth.js provider metadata, Steam callback construction and Web API key, Discord bot/application ownership, registered Discord OAuth callback, configured Discord guild access, Twitch client credentials, and the selected Marvel Rivals provider. A missing, unavailable, or truncated required history source fails the audit. It reports configuration state and record counts without printing secrets, tokens, member identifiers, guild identifiers, or database credentials.
