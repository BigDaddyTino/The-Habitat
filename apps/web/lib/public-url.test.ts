import assert from "node:assert/strict";
import test from "node:test";
import { isPublicOrigin, publicOrigin, publicUrl } from "./public-url";

test("configured public origin wins over an internal reverse-proxy request URL", () => {
  const environment = { AUTH_URL: "https://habitat.example", NODE_ENV: "production" };
  assert.equal(publicOrigin("http://localhost:3000/api/steam/connect", environment).toString(), "https://habitat.example/");
  assert.equal(publicUrl("/api/steam/callback?state=abc", "http://localhost:3000/api/steam/connect", environment).toString(), "https://habitat.example/api/steam/callback?state=abc");
  assert.equal(isPublicOrigin("https://habitat.example", "http://localhost:3000", environment), true);
  assert.equal(isPublicOrigin("https://localhost:3000", "http://localhost:3000", environment), false);
});

test("production refuses missing, insecure, or path-bearing public URLs", () => {
  assert.throws(() => publicOrigin("http://localhost:3000", { NODE_ENV: "production" }), /AUTH_URL must be configured/);
  assert.throws(() => publicOrigin(undefined, { AUTH_URL: "http://habitat.example", NODE_ENV: "production" }), /HTTPS/);
  assert.throws(() => publicOrigin(undefined, { AUTH_URL: "https://habitat.example/app", NODE_ENV: "production" }), /only an HTTP\(S\) origin/);
});

test("development can fall back to the current request origin", () => {
  assert.equal(publicOrigin("http://localhost:3000/profile", { NODE_ENV: "development" }).toString(), "http://localhost:3000/");
});
