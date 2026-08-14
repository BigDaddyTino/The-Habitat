-- The live-event feed reads the arrival tail of ServerEvent every few seconds
-- for every open tab. Without this the planner had no ordered access path and
-- fell back to a sequential scan plus a sort on each poll, which is cheap on a
-- small table and grows with the Chronicle. Ordering on (receivedAt, id) matches
-- the feed's own cursor exactly, so the range scan also supplies the sort.
CREATE INDEX IF NOT EXISTS "ServerEvent_receivedAt_id_idx" ON "ServerEvent"("receivedAt", "id");
