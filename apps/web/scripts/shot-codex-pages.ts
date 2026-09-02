import "../lib/environment";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { getPrismaClient } from "@habitat/db/client";

/**
 * Screenshots authenticated codex pages on the live site through Chrome's
 * DevTools protocol: mint a short-lived admin session, set it as a secure
 * cookie on the public https host, navigate, capture full-page at desktop
 * and mobile widths. The session is deleted on exit.
 *
 *   SHOT_DIR=<dir> [SHOT_PATHS=/codex/kingdom,/codex/talents] [SHOT_SITE=http://localhost:3111] pnpm exec tsx scripts/shot-codex-pages.ts
 */

const db = getPrismaClient();
const OUT = process.env.SHOT_DIR!;
const SITE = process.env.SHOT_SITE ?? "https://habitat.martinobear.com";
const PATHS = (process.env.SHOT_PATHS ?? "/codex/kingdom,/codex/talents").split(",");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type CdpSend = (method: string, params?: Record<string, unknown>) => Promise<unknown>;

function cdp(ws: WebSocket): CdpSend {
  let id = 0;
  const pending = new Map<number, (value: unknown) => void>();
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(String(event.data)) as { id?: number; result?: unknown; error?: unknown };
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)!(msg.result ?? msg.error); pending.delete(msg.id); }
  });
  return (method, params = {}) => new Promise<unknown>((resolve) => {
    id += 1; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params }));
  });
}

async function main() {
  const admin = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
  const token = randomUUID();
  await db.session.create({ data: { sessionToken: token, userId: admin.id, expires: new Date(Date.now() + 900_000) } });
  const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=9333", "--window-size=1440,1000", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
  try {
    await sleep(2500);
    const targets = await (await fetch("http://127.0.0.1:9333/json")).json() as Array<{ webSocketDebuggerUrl: string; type: string }>;
    const page = targets.find((t) => t.type === "page")!;
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener("open", r));
    const send = cdp(ws);
    await send("Network.enable");
    await send("Page.enable");
    const host = new URL(SITE).hostname;
    // Auth.js only prefixes the cookie on https; a local http dev server
    // (SHOT_SITE=http://localhost:3111) reads the bare name, insecure.
    // Chrome treats localhost as a secure context, so the prefixed cookie is
    // sent there too; setting both covers whichever name Auth.js derives
    // from AUTH_URL.
    const secure = new URL(SITE).protocol === "https:";
    const set = await send("Network.setCookie", { name: "__Secure-authjs.session-token", value: token, domain: host, path: "/", secure: true, httpOnly: true, sameSite: "Lax" });
    if (!secure) await send("Network.setCookie", { name: "authjs.session-token", value: token, domain: host, path: "/", secure: false, httpOnly: true, sameSite: "Lax" });
    console.log("cookie set:", JSON.stringify(set));
    for (const path of PATHS) {
      for (const [label, width, height] of [["desktop", 1440, 1000], ["mobile", 390, 844]] as const) {
        await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: label === "mobile" });
        await send("Page.navigate", { url: `${SITE}/${path.replace(/^\/+/, "")}` });
        await sleep(4500);
        const metrics = (await send("Page.getLayoutMetrics")) as { cssContentSize?: { height?: number } };
        const fullHeight = Math.min(Math.ceil(metrics.cssContentSize?.height ?? height), 6000);
        await send("Emulation.setDeviceMetricsOverride", { width, height: fullHeight, deviceScaleFactor: 1, mobile: label === "mobile" });
        await sleep(600);
        const shot = (await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true })) as { data: string };
        const file = `${OUT}/${path.replace(/\W+/g, "_")}_${label}.png`;
        writeFileSync(file, Buffer.from(shot.data, "base64"));
        console.log("wrote", file, `${width}x${fullHeight}`);
      }
    }
    ws.close();
  } finally {
    chrome.kill();
    await db.session.delete({ where: { sessionToken: token } }).catch(() => {});
    await db.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
