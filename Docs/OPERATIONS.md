# Operations

The portal must remain useful when games are down or sleeping. Worker and agent heartbeat loss produces `UNKNOWN`, not a false outage.

Backups, updates, restarts, and shutdowns will only be introduced as predefined agent operations after monitoring has proven stable. Every action will have a lifecycle and audit log.
