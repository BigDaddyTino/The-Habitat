-- The release-canon boundary.
--
-- The writers' room lands every save straight at CANON, which is the point of
-- it — but that made the export endpoint and Codex Sync read a moving target,
-- so anything downstream saw whatever happened to be true the moment it asked.
-- A StoryRelease is a named, frozen, hash-locked cut of canon. Downstream
-- reads a release; the room goes on moving and nothing outside it shifts until
-- somebody deliberately cuts again.
--
-- Immutability is enforced here rather than by convention. A release is what
-- an importer pins by hash, so a row that can be edited after the fact is not
-- a release at all — it is a mutable record wearing the word.

CREATE TABLE "StoryRelease" (
  "id"              UUID         NOT NULL DEFAULT gen_random_uuid(),
  -- The human identity, e.g. martino-2026.08.1. Frozen like every other
  -- export identity in this codex: a release name never moves.
  "name"            VARCHAR(80)  NOT NULL,
  "notes"           VARCHAR(500),
  -- The story export contract this payload satisfies, so an importer can
  -- refuse a release it does not understand without parsing it.
  "contractVersion" INTEGER      NOT NULL,
  -- The frozen MartinoStoryExport, exactly as the endpoint will serve it.
  "payload"         JSONB        NOT NULL,
  -- sha256 over the stable serialisation of "payload". This is the number an
  -- importer pins.
  "sha256"          VARCHAR(64)  NOT NULL,
  "bytes"           INTEGER      NOT NULL,
  -- The Atlas at cut time. Deliberately NOT part of contractVersion: the
  -- question of whether Atlas topology ships to the game is open, and a
  -- release is a complete record of canon regardless of what the wire format
  -- currently carries.
  "atlas"           JSONB        NOT NULL,
  "atlasSha256"     VARCHAR(64)  NOT NULL,
  -- What was in it, so a listing is readable without opening the payload.
  "counts"          JSONB        NOT NULL,
  -- Proof the gate ran. A cut is refused unless the release audit passes with
  -- no waivers honoured, and the summary of that run is kept with the release.
  "audit"           JSONB        NOT NULL,
  "cutAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cutByUserId"     UUID         NOT NULL,

  CONSTRAINT "StoryRelease_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoryRelease_name_key" UNIQUE ("name"),
  CONSTRAINT "StoryRelease_sha256_key" UNIQUE ("sha256"),
  CONSTRAINT "StoryRelease_name_shape" CHECK ("name" ~ '^[a-z0-9]+(-[a-z0-9.]+)*$'),
  CONSTRAINT "StoryRelease_sha256_shape" CHECK ("sha256" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "StoryRelease_atlas_sha256_shape" CHECK ("atlasSha256" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "StoryRelease_bytes_check" CHECK ("bytes" > 0),
  CONSTRAINT "StoryRelease_contract_check" CHECK ("contractVersion" >= 1),
  -- Same law the entry meta column carries: a JSON scalar in an object column
  -- is a shape nothing downstream can read.
  CONSTRAINT "StoryRelease_payload_is_object" CHECK (jsonb_typeof("payload") = 'object'),
  CONSTRAINT "StoryRelease_atlas_is_object"   CHECK (jsonb_typeof("atlas") = 'object'),
  CONSTRAINT "StoryRelease_counts_is_object"  CHECK (jsonb_typeof("counts") = 'object'),
  CONSTRAINT "StoryRelease_audit_is_object"   CHECK (jsonb_typeof("audit") = 'object'),

  CONSTRAINT "StoryRelease_cutByUserId_fkey" FOREIGN KEY ("cutByUserId")
    REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Newest first is the only ordering anything asks for.
CREATE INDEX "StoryRelease_cutAt_idx" ON "StoryRelease" ("cutAt" DESC);

-- Immutability, enforced by the database.
--
-- Nothing in the application updates or deletes a release, but "nothing does"
-- is a property of today's code and a release outlives today's code. An
-- importer that pinned martino-2026.08.1 by hash must be able to fetch it in
-- two years and get the same bytes.
--
-- A release is withdrawn by cutting a newer one, never by editing this row.
CREATE OR REPLACE FUNCTION "story_release_is_immutable"() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION
    'StoryRelease is immutable: % on release "%" refused. Cut a new release instead.',
    TG_OP, COALESCE(OLD."name", NEW."name")
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "StoryRelease_no_update"
  BEFORE UPDATE ON "StoryRelease"
  FOR EACH ROW EXECUTE FUNCTION "story_release_is_immutable"();

CREATE TRIGGER "StoryRelease_no_delete"
  BEFORE DELETE ON "StoryRelease"
  FOR EACH ROW EXECUTE FUNCTION "story_release_is_immutable"();
