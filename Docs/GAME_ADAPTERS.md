# Game Adapters

Every adapter exposes a capability map and normalized status shape. Unsupported metrics are absent, not approximated.

Valheim needs `-public 1` to answer GameDig queries; crossplay reports zero players, so player count is disabled for that mode unless another verified source is added. Palworld uses its official REST API only over the LAN. Dragonwilds begins with agent process telemetry and logs, then gains richer support only after a verified query method exists.
