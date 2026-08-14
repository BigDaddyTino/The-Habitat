-- Habitat Live Layer: source-confident events remain canonical ServerEvent
-- rows. These enum values add the only new verified fact (a five-player
-- threshold crossing) and the two allow-listed community notification kinds.
ALTER TYPE "ServerEventType" ADD VALUE 'WORLD_GATHERING';
ALTER TYPE "DiscordNotificationKind" ADD VALUE 'BOSS_KILLED';
ALTER TYPE "DiscordNotificationKind" ADD VALUE 'WORLD_GATHERING';
