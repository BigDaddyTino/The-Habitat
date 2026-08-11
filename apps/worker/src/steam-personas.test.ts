import assert from "node:assert/strict";
import test from "node:test";
import { parseSteamPersonaXml, resolveSteamPersonaName } from "./steam-personas.js";

test("Steam persona XML preserves a safe public player name", async () => {
  const xml = "<profile><steamID><![CDATA[Big Daddy & Tino]]></steamID></profile>";
  assert.equal(parseSteamPersonaXml(xml), "Big Daddy & Tino");
  const resolved = await resolveSteamPersonaName("76561198001429856", async () => new Response(xml, { status: 200, headers: { "content-type": "application/xml" } }));
  assert.equal(resolved, "Big Daddy & Tino");
});

test("Steam persona resolution rejects invalid IDs and unsafe XML", async () => {
  let requested = false;
  const request = async () => { requested = true; return new Response("<profile><steamID>Bad&#10;Name</steamID></profile>"); };
  assert.equal(await resolveSteamPersonaName("not-a-steam-id", request), null);
  assert.equal(requested, false);
  assert.equal(parseSteamPersonaXml("<profile><steamID>Bad&#10;Name</steamID></profile>"), null);
});
