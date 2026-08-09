# Deployment

Production runs on MartServ101 through Cloudflare Tunnel. The included Compose file defines PostgreSQL with a localhost-only port (`127.0.0.1:5432`) for host-side migrations and a persistent named volume; it is never reachable from the LAN or public Internet.

Before production deployment, install Docker Engine/Compose so the `docker` CLI is available on PATH, create an untracked `.env` with `POSTGRES_PASSWORD`, and run the database validation steps from Phase 1.
