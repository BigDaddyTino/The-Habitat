import assert from "node:assert/strict";
import test from "node:test";
import { hasValidAgentToken, isAuthorizedRequest, normalizeRemoteAddress } from "./security.js";

const token = "a-32-character-minimum-agent-token!!";

test("normalizes IPv4-mapped remote addresses", () => {
  assert.equal(normalizeRemoteAddress("::ffff:10.0.0.1"), "10.0.0.1");
});

test("authorizes only an allowed address with the exact bearer token", () => {
  assert.equal(isAuthorizedRequest({ remoteAddress: "10.0.0.1", authorization: `Bearer ${token}` }, ["10.0.0.1"], token), true);
  assert.equal(isAuthorizedRequest({ remoteAddress: "10.0.0.2", authorization: `Bearer ${token}` }, ["10.0.0.1"], token), false);
  assert.equal(isAuthorizedRequest({ remoteAddress: "10.0.0.1", authorization: "Bearer wrong" }, ["10.0.0.1"], token), false);
  assert.equal(hasValidAgentToken(undefined, token), false);
});
