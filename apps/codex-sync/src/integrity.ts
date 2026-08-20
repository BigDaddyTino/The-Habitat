import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, open, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export function sha256Bytes(value: Uint8Array | string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function sha256File(filename: string) {
  const hash = createHash("sha256");
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(filename);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return hash.digest("hex");
}

export function jsonBytes(value: unknown) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function writeFileDurably(filename: string, value: Uint8Array) {
  await mkdir(path.dirname(filename), { recursive: true });
  const handle = await open(filename, "w");
  try {
    await handle.writeFile(value);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

export async function replaceFileAtomically(filename: string, value: Uint8Array) {
  const temporary = `${filename}.${process.pid}.${Date.now()}.next`;
  await writeFileDurably(temporary, value);
  await rename(temporary, filename);
}

export function resolveBundlePath(root: string, relativePath: string) {
  if (!relativePath || path.isAbsolute(relativePath)) throw new Error(`Unsafe bundle path: ${relativePath}`);
  const normalized = relativePath.replaceAll("/", path.sep);
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, normalized);
  // `path.resolve` keeps a trailing separator on a UNC share root but not on a
  // normal directory. Normalize both forms before the containment check.
  const prefix = `${resolvedRoot.replace(/[\\/]+$/, "")}${path.sep}`.toLowerCase();
  if (!resolved.toLowerCase().startsWith(prefix)) throw new Error(`Bundle path escapes its root: ${relativePath}`);
  return resolved;
}

export async function readJson(filename: string): Promise<unknown> {
  return JSON.parse(await readFile(filename, "utf8")) as unknown;
}

export async function fileMatches(filename: string, expectedSha256: string, expectedBytes: number) {
  try {
    const info = await stat(filename);
    return info.isFile() && info.size === expectedBytes && (await sha256File(filename)) === expectedSha256;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}
