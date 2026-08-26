import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";

if (process.env.HABITAT_ENVIRONMENT !== "development") {
  throw new Error("The Bloomfall P0 visual-review server is development-only.");
}

const packageRoot = path.join(process.cwd(), "private", "codex-art", "bloomfall-adaptive-p0");
const candidates = path.join(packageRoot, "candidates");
const contactSheet = path.join(packageRoot, "review", "contact-sheets.html");

const server = createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  if (pathname === "/review/contact-sheets.html") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    createReadStream(contactSheet).pipe(response);
    return;
  }
  const match = /^\/candidates\/([a-z0-9]+(?:-[a-z0-9]+)*\.png)$/.exec(pathname);
  if (match) {
    response.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    createReadStream(path.join(candidates, match[1])).on("error", () => response.destroy()).pipe(response);
    return;
  }
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
});

server.listen(4173, "127.0.0.1", () => console.log("Bloomfall P0 visual review: http://127.0.0.1:4173/review/contact-sheets.html"));
