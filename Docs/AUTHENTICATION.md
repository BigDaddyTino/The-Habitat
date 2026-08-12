# Authentication and Identity

The Habitat is invite-only. Discord OAuth establishes portal membership; Steam OpenID establishes Steam ownership of game identities. These are separate proof mechanisms with different scopes.

## Discord portal access

Auth.js uses Discord with database sessions. An unknown Discord user is denied before using the portal unless one of the following is true:

- Their normalized email has an unexpired, unused invitation.
- Their email exactly matches the temporary `BOOTSTRAP_ADMIN_EMAIL` setting.

The bootstrap account becomes active with the `ADMIN` role on its first successful login. Remove `BOOTSTRAP_ADMIN_EMAIL` after that first login. Administrators can manage invitations through the application; there is no public registration route.

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

`AUTH_URL` is the canonical public Habitat origin. It is required in production because Cloudflare Tunnel terminates public HTTPS and forwards to a loopback origin; without it, Auth.js can derive `localhost` as the Discord redirect URI.

## Steam identity proof

Members can begin the Steam connection flow from their profile. The callback validates the signed Steam OpenID response server-side and records the SteamID64 only after validation succeeds. The browser never submits a trusted SteamID64 directly.

A verified Steam connection automatically attaches matching unclaimed Steam-backed identities. Admin claim approval remains available for identities that cannot be proved this way. Both paths enqueue idempotent reconciliation of attached verified history into playtime, XP, quests, achievements, rewards, profile totals, and leaderboards.

## Observed and unclaimed players

The system keeps server observations even when nobody owns them yet. They can appear in rosters, server details, Chronicle entries, and leaderboards with explicit provisional/unclaimed labeling. They do not receive profile benefits or XP until an approved claim or verified Steam attachment establishes ownership.

Entered Twitch, social, and gaming handles are profile metadata only. They are not evidence of account ownership, playtime, presence, or live status. Provider-authenticated live-presence integrations remain intentionally unimplemented.

## Roles

`VIEWER`, `USER`, and `ADMIN` permissions are enforced on the server. Admin-only surfaces include invitations, claims, title definitions, community/Discord configuration, registry metadata, and server operations. UI visibility is not the authorization boundary.
