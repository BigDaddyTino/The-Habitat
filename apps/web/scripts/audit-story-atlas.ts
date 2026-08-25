import "../lib/environment";
import { resolveStoryAtlasArt } from "../lib/story-atlas-art";
import { atlasAuditExitCode, buildAtlasIntegrityAudit, createFilesystemAtlasArtworkInspector, renderAtlasIntegrityReport, stableAtlasJson } from "./lib/atlas-integrity";
import { disconnectAtlasAuditDatabase, loadAtlasAuditSource } from "./lib/atlas-integrity-db";

const json = process.argv.includes("--json");
const strict = process.argv.includes("--strict");

async function main() {
  const source = await loadAtlasAuditSource();
  const audit = await buildAtlasIntegrityAudit(source, createFilesystemAtlasArtworkInspector(resolveStoryAtlasArt));
  process.stdout.write(json ? stableAtlasJson(audit) : renderAtlasIntegrityReport(audit));
  process.exitCode = atlasAuditExitCode(audit, strict);
}

main().then(disconnectAtlasAuditDatabase, async () => {
  const failure = {
    contract: "martino-atlas-integrity-audit",
    contractVersion: 1,
    findings: [{ severity: "FATAL", code: "DATABASE_UNAVAILABLE", path: "database", message: "The live Atlas audit could not read the development database. No seed or fallback data was used." }],
  };
  process.stderr.write(json ? stableAtlasJson(failure) : "FATAL DATABASE_UNAVAILABLE — The live Atlas audit could not read the development database. No seed or fallback data was used.\n");
  await disconnectAtlasAuditDatabase().catch(() => undefined);
  process.exitCode = 2;
});

