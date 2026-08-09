# Authentication

The Habitat uses Discord through Auth.js. It is invite-only: an unknown Discord account is denied before it can use the portal.

## Discord application setup

Create an OAuth2 application in the Discord Developer Portal. Add these redirect URIs:

- `http://localhost:3000/api/auth/callback/discord` for local development
- `https://habitat.martinobear.com/api/auth/callback/discord` for production

Set the resulting values only in the untracked root `.env` file:

```text
AUTH_DISCORD_ID=...
AUTH_DISCORD_SECRET=...
```

Do not commit either value.

## First administrator

Before the first Discord login, set `BOOTSTRAP_ADMIN_EMAIL` in the root `.env` to the exact Discord account email of the owner. The first successful login with that email becomes an active `ADMIN` account. Remove the value after bootstrapping the owner.

## Invitation posture

The database has an `Invitation` model ready for the admin invitation workflow. Until that UI ships, new accounts should remain blocked unless they match `BOOTSTRAP_ADMIN_EMAIL`; no broad registration path exists.
