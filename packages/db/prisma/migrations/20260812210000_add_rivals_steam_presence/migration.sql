-- Steam presence evidence for Club Game profiles. The worker samples verified
-- Steam accounts of linked members and records when the club game was last seen
-- running, so provider refreshes concentrate on members who are actually playing.
ALTER TABLE "ClubGameProfile" ADD COLUMN "steamLastPlayingAt" TIMESTAMP(3);
ALTER TABLE "ClubGameProfile" ADD COLUMN "steamPresenceCheckedAt" TIMESTAMP(3);
