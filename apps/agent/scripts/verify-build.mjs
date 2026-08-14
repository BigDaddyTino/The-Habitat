/**
 * Bare-Node load check for the compiled agent.
 *
 * The agent is the only workspace that runs its compiled output on plain
 * `node`: the worker runs under tsx and the web app is bundled, and both of
 * those accept module specifiers that Node's own resolver rejects. So neither
 * `pnpm test` (tsx) nor `pnpm typecheck` (tsc) exercises the resolver the
 * installed service actually uses. A value import that reaches a workspace
 * package with extensionless relative re-exports therefore typechecks cleanly,
 * passes every test, and then crash-loops the service on MartServ102 -- which
 * is what happened on 2026-08-13.
 *
 * Loading the modules is the check. Resolution alone is not enough: the failure
 * was one level below `@habitat/shared`, inside the package's own re-exports,
 * so only a real import walks far enough to see it.
 *
 * This runs as part of `pnpm --filter @habitat/agent build` so the documented
 * update procedure fails on the build machine rather than on the game host.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Importing the entrypoint would start the listener and bind the configured
// port, which on the game host is already held by the running service. Its
// static specifiers are checked instead; everything it reaches at runtime,
// including the dynamically imported server module, is a dist module that is
// imported for real below.
const entrypoint = "index.js";
const staticSpecifier = /(?:^|\n)\s*(?:import|export)\b[^"';]*?from\s*["']([^"']+)["']/g;

const distDirectory = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(import.meta.dirname, "..", "dist");
const failures = [];

const compiled = await collectCompiledModules(distDirectory).catch(() => []);
if (compiled.length === 0) {
  console.error(`Bare-Node check found no compiled output in ${distDirectory}. Run the TypeScript build first.`);
  process.exit(1);
}
if (!compiled.includes(entrypoint)) {
  console.error(`Bare-Node check found no ${entrypoint} in ${distDirectory}. The build did not emit the service entrypoint.`);
  process.exit(1);
}

const versionSource = await readFile(path.join(distDirectory, "version.js"), "utf8").catch(() => "");
if (!versionSource || /\+dev["']/.test(versionSource)) {
  console.error("Bare-Node check found an unstamped Agent version. Run the staged build rather than tsc directly.");
  process.exit(1);
}

for (const name of compiled) {
  if (name === entrypoint) continue;
  const source = await readFile(path.join(distDirectory, name), "utf8");
  if (/from\s*["']@habitat\/shared(?:\/|["'])/.test(source)) {
    failures.push(`${name}: production output still imports the shared workspace package instead of its staged JavaScript copy`);
    continue;
  }
  await load(pathToFileURL(path.join(distDirectory, name)).href, name);
}

// Relative specifiers are resolved against dist so they are checked from the
// entrypoint's own directory; bare specifiers resolve through the same
// node_modules chain from anywhere inside the package.
const entrypointSource = await readFile(path.join(distDirectory, entrypoint), "utf8");
for (const [, specifier] of entrypointSource.matchAll(staticSpecifier)) {
  const target = specifier.startsWith(".") ? pathToFileURL(path.resolve(distDirectory, specifier)).href : specifier;
  await load(target, `${entrypoint} -> ${specifier}`);
}

if (failures.length > 0) {
  console.error(`The compiled agent cannot be loaded by bare Node (${process.version}). The service would fail to start:`);
  for (const failure of failures) console.error(`  ${failure}`);
  console.error("A specifier that tsx or a bundler accepts is not necessarily one Node resolves. Point value imports at a subpath export whose target has no extensionless relative imports of its own.");
  process.exit(1);
}

console.info(`Bare-Node check passed: ${compiled.length} compiled module(s) load under ${process.version}.`);

async function load(target, label) {
  try {
    await import(target);
  } catch (error) {
    const detail = error instanceof Error ? `${error.code ? `${error.code}: ` : ""}${error.message}` : String(error);
    failures.push(`${label}: ${detail}`);
  }
}

async function collectCompiledModules(directory, relativeDirectory = "") {
  const entries = await readdir(path.join(directory, relativeDirectory), { withFileTypes: true });
  const modules = [];
  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) modules.push(...await collectCompiledModules(directory, relativePath));
    else if (entry.isFile() && entry.name.endsWith(".js")) modules.push(relativePath);
  }
  return modules.sort();
}
