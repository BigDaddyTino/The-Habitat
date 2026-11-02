import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const exec = promisify(execFile);
const script = path.resolve(import.meta.dirname, "../scripts/sync-zomboid-launch.ps1");
const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;

for (const scenario of ["defaults", "preserve", "initial-too-large", "invalid-value"] as const) {
  test(`Zomboid launcher memory: ${scenario}`, { skip: process.platform !== "win32" }, async () => {
    const root = await mkdtemp(path.join(tmpdir(), "habitat-pz-launch-"));
    try {
      await mkdir(path.join(root, "java"));
      await writeFile(path.join(root, "java/projectzomboid.jar"), "fixture");
      await writeFile(path.join(root, "StartServer64.bat"), "SET PZ_CLASSPATH=java/;java/projectzomboid.jar\r\njava -Xms16g -Xmx16g -Djava.library.path=natives/");
      const extra = scenario === "defaults" ? "" : `<env name="HABITAT_PZ_INITIAL_HEAP" value="${scenario === "initial-too-large" ? "8192m" : "2048m"}"/><env name="HABITAT_PZ_MAX_HEAP" value="${scenario === "invalid-value" ? "unsafe-value" : "6144m"}"/>`;
      const before = `<service><id>HabitatGameProjectZomboid</id><arguments>-Xms16g -Xmx16g -Djava.library.path=old/ -cp "%PZ_CLASSPATH%" zombie.network.GameServer -cachedir="%HABITAT_PZ_DATA_DIR%"</arguments><env name="PZ_CLASSPATH" value="old"/><env name="HABITAT_PZ_DATA_DIR" value="retained-world"/>${extra}</service>`;
      const xml = path.join(root, "service.xml");
      await writeFile(xml, before);
      const run = () => exec("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", `$ErrorActionPreference='Stop'; . ${quote(script)}; Sync-ZomboidLaunch ${quote(root)} ${quote(xml)}`], { windowsHide: true, timeout: 15_000 });
      if (scenario === "initial-too-large" || scenario === "invalid-value") {
        await assert.rejects(run());
        assert.equal(await readFile(xml, "utf8"), before, "Invalid memory limits must leave the installed service untouched");
      } else {
        await run();
        const once = await readFile(xml, "utf8");
        assert.ok(once.includes('-Xms%HABITAT_PZ_INITIAL_HEAP% -Xmx%HABITAT_PZ_MAX_HEAP%'));
        assert.match(once, /retained-world/);
        assert.ok(once.includes(`name="HABITAT_PZ_INITIAL_HEAP" value="${scenario === "defaults" ? 1024 : 2048}m"`));
        assert.ok(once.includes(`name="HABITAT_PZ_MAX_HEAP" value="${scenario === "defaults" ? 4096 : 6144}m"`));
        await run();
        assert.equal(await readFile(xml, "utf8"), once, "Future launcher synchronization must preserve configured limits");
      }
    } finally {
      assert.equal(path.dirname(root), tmpdir());
      assert.ok(path.basename(root).startsWith("habitat-pz-launch-"));
      await rm(root, { recursive: true, force: true });
    }
  });
}
