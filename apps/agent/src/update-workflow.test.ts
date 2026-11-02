import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const exec = promisify(execFile);
const scripts = path.resolve(import.meta.dirname, "../scripts");
const cases = [
  { scenario: "online", events: ["stop", "steamcmd", "start"], phase: "SUCCEEDED", code: null },
  { scenario: "sleeping", events: ["steamcmd", "start"], phase: "SUCCEEDED", code: null },
  { scenario: "palworld", events: ["shutdown-api", "stop", "steamcmd", "start"], phase: "SUCCEEDED", code: null },
  { scenario: "zomboid", events: ["graceful-stop", "stop", "steamcmd", "start"], phase: "SUCCEEDED", code: null },
  { scenario: "zomboid-bad-launcher", events: ["graceful-stop", "stop", "steamcmd"], phase: "FAILED", code: "startup_configuration_failed" },
  { scenario: "zomboid-shutdown-failure", events: ["graceful-stop"], phase: "FAILED", code: "server_stop_failed" },
  { scenario: "steam-failure", events: ["stop", "steamcmd"], phase: "FAILED", code: "steamcmd_failed" },
  { scenario: "missing-success", events: ["stop", "steamcmd"], phase: "FAILED", code: "steamcmd_failed" },
  { scenario: "stop-failure", events: ["stop"], phase: "FAILED", code: "server_stop_failed" },
  { scenario: "start-failure", events: ["stop", "steamcmd", "start"], phase: "FAILED", code: "server_start_failed" },
  { scenario: "busy", events: [], phase: "FAILED", code: "updater_busy" },
  { scenario: "stale", events: [], phase: "QUEUED", code: null },
] as const;

for (const item of cases) {
  test(`PowerShell update workflow: ${item.scenario}`, { skip: process.platform !== "win32" }, async () => {
    const root = await mkdtemp(path.join(tmpdir(), "habitat-update-test-"));
    try {
      const stamp = new Date(Date.now() - (item.scenario === "stale" ? 600_000 : 0)).toISOString();
      const statusPath = path.join(root, "status.json");
      const settings = path.join(root, "settings.ini");
      const palworld = item.scenario === "palworld";
      const zomboid = item.scenario.startsWith("zomboid");
      if (zomboid) {
        await mkdir(path.join(root, "java"));
        await writeFile(path.join(root, "java/projectzomboid.jar"), "fixture");
        await writeFile(path.join(root, "StartServer64.bat"), `SET PZ_CLASSPATH=${item.scenario === "zomboid-bad-launcher" ? "../escape.jar" : "java/;java/projectzomboid.jar"}\r\njava -Djava.library.path=natives/ -cp %PZ_CLASSPATH% zombie.network.GameServer`);
        await writeFile(path.join(root, "HabitatGameProjectZomboid.xml"), '<service><id>HabitatGameProjectZomboid</id><arguments>-Xms16g -Xmx16g -Djava.library.path=old/ -cp "%PZ_CLASSPATH%" zombie.network.GameServer -cachedir="%HABITAT_PZ_DATA_DIR%"</arguments><env name="PZ_CLASSPATH" value="old.jar"/><env name="HABITAT_PZ_DATA_DIR" value="keep-the-existing-world"/></service>');
      }
      await Promise.all([
        writeFile(path.join(root, "steamcmd.exe"), "fixture, never executed"),
        writeFile(path.join(root, "game.exe"), "fixture, never executed"),
        writeFile(path.join(root, ".env"), 'HABITAT_PALWORLD_ADMIN_PASSWORD="fixture-only"'),
        writeFile(settings, "operator settings\r\n"),
        writeFile(statusPath, JSON.stringify({ operationId: randomUUID(), phase: "QUEUED", startedAt: stamp, updatedAt: stamp, errorCode: null })),
        writeFile(path.join(root, "config.json"), JSON.stringify({ gameKey: zomboid ? "project-zomboid" : palworld ? "palworld" : "valheim", appId: zomboid ? 380870 : palworld ? 2394010 : 896660, serviceName: zomboid ? "HabitatGameProjectZomboid" : palworld ? "HabitatGamePalworld" : "HabitatGameValheim", gameServiceXmlPath: path.join(root, "HabitatGameProjectZomboid.xml"), installDirectory: root, gameExecutable: path.join(root, "game.exe"), steamcmdPath: path.join(root, "steamcmd.exe"), processName: "fixture.exe", processCommandLineIncludes: "", serviceTimeoutSeconds: 5, statusPath, preserveFiles: [settings], logDirectory: "", agentEnvironmentPath: path.join(root, ".env"), palworldApiPort: 8212 })),
      ]);
      let exitCode = 0;
      let output = "";
      try {
        const result = await exec("powershell.exe", ["-NoProfile", "-NonInteractive", "-File", path.join(scripts, "test-game-update-mocks.ps1"), "-FixtureRoot", root, "-Scenario", item.scenario, "-WorkflowPath", path.join(scripts, "invoke-game-update.ps1")], { windowsHide: true, timeout: 20_000 });
        output = result.stdout;
      } catch (error) {
        const result = error as { code: number; stdout: string; stderr: string };
        exitCode = result.code;
        output = result.stdout + result.stderr;
      }
      assert.equal(exitCode, item.phase === "SUCCEEDED" ? 0 : 1, output);
      const status = JSON.parse(await readFile(statusPath, "utf8"));
      assert.equal(status.phase, item.phase, output);
      assert.equal(status.errorCode, item.code, output);
      const events = await readFile(path.join(root, "events.log"), "utf8").catch(() => "");
      assert.deepEqual(events.trim() ? events.trim().split(/\r?\n/) : [], item.events, output);
      assert.equal(await readFile(settings, "utf8"), "operator settings\r\n", "Operator configuration must survive successful and failed updates");
      if (item.scenario === "zomboid") {
        const service = await readFile(path.join(root, "HabitatGameProjectZomboid.xml"), "utf8");
        assert.ok(service.includes("java/;java/projectzomboid.jar"));
        assert.match(service, /keep-the-existing-world/);
        assert.match(service, /PZ_LIBRARY_PATH/);
      }
      if (item.phase === "SUCCEEDED") assert.match(output, /STOPPING[\s\S]*UPDATING[\s\S]*STARTING[\s\S]*SUCCEEDED/);
    } finally {
      assert.equal(path.dirname(root), tmpdir());
      assert.ok(path.basename(root).startsWith("habitat-update-test-"));
      await rm(root, { recursive: true, force: true });
    }
  });
}
