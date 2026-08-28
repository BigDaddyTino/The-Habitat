import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { renderReleaseAudit, runReleaseAudit } from "./lib/release-audit";

/**
 * The one audit a release has to pass, as a command.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/audit-release.ts [--json] [--strict]
 *
 * The checks themselves live in scripts/lib/release-audit.ts, because two
 * different gates run them: deploy-web.ps1 before it builds, and
 * cut-story-release.ts before it freezes canon. A gate that exists in two
 * copies is a gate that will disagree with itself.
 *
 * `--strict` honours no waivers, which is what a release cut does. Without it
 * the waiver map applies, which is what a deploy does — see the comment on
 * `runReleaseAudit` for why those differ.
 */
const db = getPrismaClient();

async function main() {
  const strict = process.argv.includes("--strict");
  const result = await runReleaseAudit({ honourWaivers: !strict });

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ contract: "habitat-release-audit", contractVersion: 1, strict, result: result.ok ? "PASS" : "FAIL", checks: result.checks }, null, 2));
  } else {
    console.log(renderReleaseAudit(result, strict));
  }
  if (!result.ok) process.exitCode = 1;
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(2)); });
