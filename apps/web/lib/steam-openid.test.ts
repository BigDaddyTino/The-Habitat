import assert from "node:assert/strict";
import test from "node:test";
import { steamOpenIdEndpoint, verifySteamOpenId } from "./steam-openid";

test("accepts a SteamID64 only after Steam validates the signed OpenID response", async () => {
  const parameters = new URLSearchParams({
    "openid.mode": "id_res",
    "openid.op_endpoint": steamOpenIdEndpoint,
    "openid.claimed_id": "https://steamcommunity.com/openid/id/76561198000000000",
    "openid.identity": "https://steamcommunity.com/openid/id/76561198000000000",
    "openid.signed": "op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle",
    "openid.sig": "signed-by-steam",
  });
  const steamId = await verifySteamOpenId(parameters, async (_input, init) => {
    assert.match(String(init?.body), /openid.mode=check_authentication/);
    return new Response("ns:http://specs.openid.net/auth/2.0\nis_valid:true\n");
  });
  assert.equal(steamId, "76561198000000000");
});

test("rejects an invalid or mismatched Steam identity", async () => {
  const parameters = new URLSearchParams({ "openid.mode": "id_res", "openid.op_endpoint": steamOpenIdEndpoint, "openid.claimed_id": "https://steamcommunity.com/openid/id/76561198000000000", "openid.identity": "https://steamcommunity.com/openid/id/76561198000000001" });
  assert.equal(await verifySteamOpenId(parameters, async () => new Response("is_valid:true\n")), null);
});
