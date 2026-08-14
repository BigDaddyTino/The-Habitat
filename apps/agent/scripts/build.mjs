/**
 * Builds into an isolated directory, stamps a deployment-identifying version,
 * verifies the complete output under bare Node, and only then replaces dist.
 * A compiler or resolver failure therefore leaves the installed service's last
 * known-good artifact untouched.
 */
import { execFile } from "node:child_process";
import { copyFile, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const agentRoot = path.resolve(import.meta.dirname, "..");
const repositoryRoot = path.resolve(agentRoot, "..", "..");
const distDirectory = path.join(agentRoot, "dist");
const stagingDirectory = path.join(agentRoot, "dist.building");
const previousDirectory = path.join(agentRoot, "dist.previous");
const packageJson = JSON.parse(await readFile(path.join(agentRoot, "package.json"), "utf8"));

await removeBuildDirectory(stagingDirectory);
await exec("pnpm", ["exec", "tsc", "-p", "tsconfig.build.json", "--outDir", stagingDirectory], agentRoot);
await copyFile(path.join(repositoryRoot, "packages", "shared", "dist", "agent.js"), path.join(stagingDirectory, "shared", "agent.js"));
await copyFile(path.join(repositoryRoot, "packages", "shared", "dist", "telemetry-config.js"), path.join(stagingDirectory, "shared", "telemetry-config.js"));

const buildId = await resolveBuildId();
const version = `${packageJson.version}+${buildId}`;
const versionPath = path.join(stagingDirectory, "version.js");
const versionSource = await readFile(versionPath, "utf8");
if (!versionSource.includes(`${packageJson.version}+dev`)) {
  throw new Error(`Could not find the development version marker in ${versionPath}.`);
}
await writeFile(versionPath, versionSource.replace(`${packageJson.version}+dev`, version), "utf8");
await exec("node", ["scripts/verify-build.mjs", stagingDirectory], agentRoot);

await removeBuildDirectory(previousDirectory);
if (await exists(distDirectory)) await rename(distDirectory, previousDirectory);
try {
  await rename(stagingDirectory, distDirectory);
} catch (error) {
  if (await exists(previousDirectory) && !await exists(distDirectory)) await rename(previousDirectory, distDirectory);
  throw error;
}
console.info(`Habitat Agent ${version} built and verified. The previous artifact remains in ${previousDirectory}.`);

async function resolveBuildId() {
  const configured = process.env.HABITAT_AGENT_BUILD_ID?.trim();
  if (configured) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/.test(configured)) throw new Error("HABITAT_AGENT_BUILD_ID must be 1-40 safe version characters.");
    return configured;
  }
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "--short=12", "HEAD"], { cwd: repositoryRoot, windowsHide: true });
    const commit = stdout.trim();
    if (!/^[0-9a-f]{7,12}$/i.test(commit)) throw new Error("Git returned an invalid commit identifier.");
    const { stdout: statusOutput } = await execFileAsync("git", ["status", "--porcelain", "--untracked-files=no"], { cwd: repositoryRoot, windowsHide: true });
    return `g${commit}${statusOutput.trim() ? ".dirty" : ""}`;
  } catch {
    return `local.${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`;
  }
}

async function exec(command, args, cwd) {
  const pnpmCli = command === "pnpm" ? process.env.npm_execpath : null;
  const executable = pnpmCli ? process.execPath : command;
  const commandArguments = pnpmCli ? [pnpmCli, ...args] : args;
  const { stdout, stderr } = await execFileAsync(executable, commandArguments, { cwd, windowsHide: true, maxBuffer: 10 * 1024 * 1024 });
  if (stdout.trim()) process.stdout.write(stdout);
  if (stderr.trim()) process.stderr.write(stderr);
}

async function exists(target) {
  return stat(target).then(() => true, () => false);
}

async function removeBuildDirectory(target) {
  const relative = path.relative(agentRoot, target);
  if (relative !== "dist.building" && relative !== "dist.previous") throw new Error(`Refusing to remove unexpected build path: ${target}`);
  await rm(target, { recursive: true, force: true });
}
