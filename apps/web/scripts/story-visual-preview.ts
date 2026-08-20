import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";

async function main() {
  const db = getPrismaClient();
  const user = await db.user.findFirstOrThrow({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });
  const token = randomBytes(32).toString("hex");
  const session = await db.session.create({
    data: { sessionToken: token, userId: user.id, expires: new Date(Date.now() + 60 * 60 * 1000) },
    select: { id: true },
  });

  const server = createServer(async (request, response) => {
  try {
    const headers = new Headers();
    for (const [name, value] of Object.entries(request.headers)) {
      if (!value || ["connection", "content-length", "cookie", "host"].includes(name)) continue;
      headers.set(name, Array.isArray(value) ? value.join(", ") : value);
    }
    headers.set("cookie", `authjs.session-token=${token}; __Secure-authjs.session-token=${token}`);

    const upstream = await fetch(`http://127.0.0.1:3002${request.url ?? "/"}`, {
      headers,
      method: request.method,
      redirect: "manual",
    });
    const body = Buffer.from(await upstream.arrayBuffer());
    response.statusCode = upstream.status;
    upstream.headers.forEach((value, name) => {
      if (!["connection", "content-encoding", "content-length", "transfer-encoding"].includes(name.toLowerCase())) {
        response.setHeader(name, value);
      }
    });
    response.setHeader("content-length", String(body.length));
    response.end(body);
  } catch {
    response.statusCode = 502;
    response.end("Local visual preview failed.");
  }
  });

  const close = async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await db.session.deleteMany({ where: { id: session.id } });
    await db.$disconnect();
  };

  process.once("SIGINT", () => void close().finally(() => process.exit(0)));
  process.once("SIGTERM", () => void close().finally(() => process.exit(0)));
  server.listen(43018, "127.0.0.1", () => console.log("READY"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
