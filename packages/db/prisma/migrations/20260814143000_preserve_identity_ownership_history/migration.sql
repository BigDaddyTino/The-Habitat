-- Ownership history is the permanent audit trail for claim rollback. Deleting
-- an identity must not silently cascade-delete that ledger. Empty identities
-- without ledger history can still be garbage-collected by the worker.

ALTER TABLE "IdentityOwnershipTransaction"
  DROP CONSTRAINT "IdentityOwnershipTransaction_playerIdentityId_fkey",
  ADD CONSTRAINT "IdentityOwnershipTransaction_playerIdentityId_fkey"
    FOREIGN KEY ("playerIdentityId") REFERENCES "PlayerIdentity"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
