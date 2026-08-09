# Security

- Public access terminates at Cloudflare Tunnel and reaches only the web application.
- PostgreSQL, the Habitat Agent, game query ports, RCON, Telnet, REST management APIs, SMB, WinRM, and Docker are never publicly exposed.
- Future privileged operations require server-side role checks, allow-listed server/action pairs, input validation, audit records, and safe log redaction.
- Per-server credentials are never returned to browsers. When database storage is needed, they will use authenticated encryption with a separately managed key.
- No service mounts the Docker socket into the web application.
- Discord sign-in is invitation-gated. The single bootstrap-admin email is an untracked local setting and should be removed after the first administrator account is created.
