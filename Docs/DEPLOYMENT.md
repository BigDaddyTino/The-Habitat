# Deployment

Production runs on MartServ101 through Cloudflare Tunnel. The included Compose file defines PostgreSQL with an internal-only port and a persistent named volume.

Before production deployment, install Docker Engine/Compose so the `docker` CLI is available on PATH, create an untracked `.env` with `POSTGRES_PASSWORD`, and run the database validation steps from Phase 1.
