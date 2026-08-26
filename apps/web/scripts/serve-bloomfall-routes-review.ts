import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import dotenv from "dotenv";

const repositoryRoot = path.resolve(process.cwd(), "..", "..");
dotenv.config({ path: path.join(repositoryRoot, ".env"), quiet: true });
dotenv.config({ path: path.join(repositoryRoot, ".env.local"), override: true, quiet: true });
if (process.env.HABITAT_ENVIRONMENT !== "development") throw new Error("The Bloomfall route-review server is development-only.");
const webRoot = process.cwd();
const reviewRoot = path.join(webRoot, "private", "codex-art", "bloomfall-routes", "review");

const server = createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  const send = (file: string, type: string) => {
    response.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    createReadStream(file).on("error", () => response.destroy()).pipe(response);
  };
  if (pathname === "/" || pathname === "/index.html") return send(path.join(reviewRoot, "index.html"), "text/html; charset=utf-8");
  if (pathname === "/maps/martino-bloomfall-reach-map-v3.png") return send(path.join(webRoot, "private", "codex-art", "maps", "martino-bloomfall-reach-map-v3.png"), "image/png");
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
});

server.listen(4175, "127.0.0.1", () => console.log("Bloomfall route review: http://127.0.0.1:4175/"));
