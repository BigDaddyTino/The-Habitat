import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";

if (process.env.HABITAT_ENVIRONMENT !== "development") throw new Error("The Bloomfall P1/P2 visual-review server is development-only.");
const webRoot = process.cwd();
const packageRoot = path.join(webRoot, "private", "codex-art", "bloomfall-adaptive-p1p2");

const server = createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  const send = (file: string, type: string) => { response.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }); createReadStream(file).on("error", () => response.destroy()).pipe(response); };
  if (pathname === "/review/contact-sheets.html") return send(path.join(packageRoot, "review", "contact-sheets.html"), "text/html; charset=utf-8");
  const candidate = /^\/candidates\/([a-z0-9]+(?:-[a-z0-9]+)*\.png)$/.exec(pathname);
  if (candidate) return send(path.join(packageRoot, "candidates", candidate[1]), "image/png");
  const v3 = /^\/v3\/([a-z0-9]+(?:-[a-z0-9]+)*\.png)$/.exec(pathname);
  if (v3) return send(path.join(webRoot, "private", "codex-art", "bloomfall-v3", v3[1]), "image/png");
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); response.end("Not found");
});
server.listen(4174, "127.0.0.1", () => console.log("Bloomfall P1/P2 visual review: http://127.0.0.1:4174/review/contact-sheets.html"));
