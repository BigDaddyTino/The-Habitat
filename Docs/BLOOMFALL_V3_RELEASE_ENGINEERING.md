# Bloomfall V3 release engineering contract

Date: 2026-08-25

This document describes the release candidate tooling. It is not authorization to run a production cutover. Prompt 6B must provide the real fresh backup evidence, deployed build identity, release commit, exact read-only baseline fingerprint, and owner authorization immediately before production writes.

## Publication boundary

The 15 owner-approved files are registered in one authoritative manifest at `apps/web/lib/bloomfall-v3-art.ts`.

- Development renders registered V3 Codex art without changing StoryEntry metadata.
- Production Codex pages render V3 only when an entry carries the exact package, asset ID, version, and SHA-256 marker written by activation.
- Atlas V3 files are registered through the existing authenticated `/codex-map` architecture. Production continues selecting its current map art until activation changes the two StoryMap `artVersion` values to `v3`.
- Code deployment and file presence therefore do not publish the package.

## Commands

Read and hash the complete visual lock:

```text
pnpm --filter @habitat/web bloomfall:v3:verify
```

Run the guarded entrypoint in a disposable rehearsal or, only under Prompt 6B, production:

```text
pnpm --filter @habitat/web bloomfall:v3:activate -- --dry-run
pnpm --filter @habitat/web bloomfall:v3:activate -- --apply
```

Exactly one action is required. Dry-run performs zero writes.

## Required gates

The entrypoint never infers its write target from the application URL. It requires:

- `DATABASE_URL` as canonical read-source identity;
- `BLOOMFALL_PRODUCTION_ACTIVATION_DATABASE_URL` as the explicit target;
- `BLOOMFALL_PRODUCTION_ACTIVATION_MODE` (`rehearsal` or `production`);
- `BLOOMFALL_PRODUCTION_ACTIVATION_CONFIRM_DATABASE=habitat` in production;
- the exact high-friction production or disposable-rehearsal authorization token exported by the activation library;
- `BLOOMFALL_V3_RELEASE_HEAD` matching the checked-out 40-character commit;
- `BLOOMFALL_V3_EXPECTED_BUILD_ID` matching `apps/web/.next/BUILD_ID`;
- `BLOOMFALL_V3_PRODUCTION_BACKUP_PATH`, an exact absolute, non-empty, fresh `.dump` path;
- `BLOOMFALL_V3_BACKUP_VERIFICATION=PG_RESTORE_LIST_OK` only after independent restore-list verification;
- `BLOOMFALL_V3_EXPECTED_BASELINE_FINGERPRINT`, captured read-only from the exact target immediately before invocation.

Production requires `HABITAT_ENVIRONMENT=production`, loopback `localhost:5432/habitat`, an identical source/target identity, and the production owner token. Rehearsal requires development mode, a target matching `habitat_bloomfall_v3_rehearsal_*`, a distinct canonical `habitat` source on the same server, and the rehearsal token.

## Locked baseline and order

The only accepted initial state is the audited 175-entry production baseline: placeholder ID `a64869df-c623-49ec-9236-dd306a3fd5c7`, `Unknown Southeast` / `unknown-southeast`, the seven exact hierarchy rows, 19/26/11/43 world topology, 25 semantic connections, nine paths, and world art V1. The exact already-applied final state is also accepted for a no-op verification run. Every partial or mixed state is refused.

Mutation order is fixed in code:

```text
rename
-> hierarchy repair
-> canonical content / stories / semantic connections
-> local Atlas
-> V3 publication
-> verification
```

The development commands remain locked to `habitat_atlas_dev`. Their semantic apply functions are reused by the production orchestrator; their target guards were not weakened.

## Transaction and rollback model

Each semantic stage runs in its existing serializable, audited, idempotent transaction. Publication is a separate serializable transaction because it is the explicit application/DB visibility boundary. The sequence is staged rather than one cross-feature transaction; Prompt 6B must take and verify the fresh production backup immediately before the first write. Every stage has a deterministic already-applied path, and a partial state fails the outer baseline classifier instead of continuing silently.

No migration is part of this release package. No service restart, deployment, production configuration change, production write, or production publication occurred while preparing this contract.
