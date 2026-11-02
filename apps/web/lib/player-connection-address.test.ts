import assert from "node:assert/strict";
import test from "node:test";
import { isPlayerGameSlug, playerGameConnections, playerGameSlugs } from "@habitat/shared";
import { addressConfiguration, createPlayerAddressResolver, isPublicPlayerIPv4, playerConnectionDetails } from "./player-connection-address";

test("player addresses require explicit enablement and a fixed supported source", () => {
  assert.equal(addressConfiguration({}), null);
  assert.equal(addressConfiguration({ HABITAT_PLAYER_CONNECTIONS_ENABLED: "false", HABITAT_PLAYER_ADDRESS_SOURCE: "public-ip" }), null);
  assert.deepEqual(addressConfiguration({ HABITAT_PLAYER_CONNECTIONS_ENABLED: "true", HABITAT_PLAYER_ADDRESS_SOURCE: "public-ip" }), { source: "public-ip" });
  for (const hostname of ["https://play.example.com", "play.example.com/path", "play.example.com:7777", "127.0.0.1", "localhost", "bad..example.com", "-bad.example.com"]) {
    assert.throws(() => addressConfiguration({ HABITAT_PLAYER_CONNECTIONS_ENABLED: "true", HABITAT_PLAYER_ADDRESS_SOURCE: "dns", HABITAT_PLAYER_HOSTNAME: hostname }));
  }
  assert.throws(() => addressConfiguration({ HABITAT_PLAYER_CONNECTIONS_ENABLED: "true", HABITAT_PLAYER_ADDRESS_SOURCE: "https://attacker.example" }));
  assert.deepEqual(addressConfiguration({ HABITAT_PLAYER_CONNECTIONS_ENABLED: "true", HABITAT_PLAYER_ADDRESS_SOURCE: "dns", HABITAT_PLAYER_HOSTNAME: "PLAY.EXAMPLE.COM" }), { source: "dns", hostname: "play.example.com" });
});

test("player addresses reject private, reserved, malformed, and URI-injection values", () => {
  for (const ip of ["127.0.0.1", "192.168.1.1", "10.1.1.1", "172.16.0.1", "100.64.0.1", "169.254.1.1", "0.0.0.0", "224.0.0.1", "255.255.255.255", "192.0.2.1", "198.51.100.1", "203.0.113.1", "::1", "8.8.8.8/secret", "8.8.8.8:7777", "8.8.8.8\n"]) assert.equal(isPublicPlayerIPv4(ip), false, ip);
  assert.equal(isPublicPlayerIPv4("8.8.8.8"), true);
});

test("concurrent requests share a bounded cache, and a changed IP replaces it after expiry", async () => {
  let clock = 100000;
  let lookups = 0;
  const resolver = createPlayerAddressResolver(async () => ({ address: ++lookups === 1 ? "8.8.8.8" : "1.1.1.1", ttl: 300 }), () => clock);
  const configuration = { source: "public-ip" } as const;
  const observations = await Promise.all([resolver(configuration), resolver(configuration)]);
  assert.equal(lookups, 1);
  assert.deepEqual(observations[0], observations[1]);
  assert.equal(Date.parse(observations[0].expiresAt) - clock, 30000);
  clock += 30001;
  assert.equal((await resolver(configuration)).address, "1.1.1.1");
  assert.equal(lookups, 2);
});

test("failed refreshes never return an expired address and recover on a later request", async () => {
  let clock = 100000;
  let failing = false;
  const resolver = createPlayerAddressResolver(async () => { if (failing) throw new Error("offline"); return { address: "8.8.8.8", ttl: 2 }; }, () => clock);
  const configuration = { source: "dns", hostname: "play.example.com" } as const;
  await resolver(configuration);
  clock += 2001;
  failing = true;
  await assert.rejects(resolver(configuration), /offline/);
  failing = false;
  assert.equal((await resolver(configuration)).address, "8.8.8.8");
});

test("configuration changes do not reuse another origin's cached address", async () => {
  let lookups = 0;
  const resolver = createPlayerAddressResolver(async () => ({ address: ++lookups === 1 ? "8.8.8.8" : "1.1.1.1", ttl: 30 }));
  await resolver({ source: "dns", hostname: "one.example.com" });
  assert.equal((await resolver({ source: "dns", hostname: "two.example.com" })).address, "1.1.1.1");
  await assert.rejects(createPlayerAddressResolver(async () => ({ address: "127.0.0.1", ttl: 30 }))({ source: "public-ip" }));
});

test("all six games expose player ports, four Steam query links, and the correct player app IDs", () => {
  const snapshot = { address: "8.8.8.8", resolvedAt: new Date(0).toISOString(), expiresAt: new Date(30000).toISOString() };
  const links = playerGameSlugs.map((slug) => playerConnectionDetails(slug, snapshot, {}));
  assert.equal(links.filter((value) => value.steamUri !== null).length, 4);
  assert.equal(playerConnectionDetails("valheim", snapshot, {}).endpoint, "8.8.8.8:2456");
  assert.equal(playerConnectionDetails("valheim", snapshot, {}).steamUri, "steam://connect/8.8.8.8:2457");
  assert.equal(playerConnectionDetails("enshrouded", snapshot, {}).steamUri, "steam://connect/8.8.8.8:15637");
  assert.equal(playerConnectionDetails("palworld", snapshot, {}).port, 8211);
  assert.equal(playerConnectionDetails("dragonwilds", snapshot, {}).steamUri, null);
  assert.equal(playerGameConnections.dragonwilds.appId, 1374490);
  assert.equal(isPlayerGameSlug("__proto__"), false);
  assert.equal(isPlayerGameSlug("constructor"), false);
});

test("external port overrides cannot introduce a URI or silently use an invalid port", () => {
  const snapshot = { address: "8.8.8.8", resolvedAt: new Date(0).toISOString(), expiresAt: new Date(30000).toISOString() };
  for (const value of ["0", "65536", "-1", "7777/password", "1.2", " 7777"]) assert.throws(() => playerConnectionDetails("dragonwilds", snapshot, { HABITAT_PLAYER_DRAGONWILDS_PORT: value }));
  const result = playerConnectionDetails("valheim", snapshot, { HABITAT_PLAYER_VALHEIM_PORT: "3000", HABITAT_PLAYER_VALHEIM_STEAM_PORT: "3001" });
  assert.equal(result.endpoint, "8.8.8.8:3000");
  assert.equal(result.steamUri, "steam://connect/8.8.8.8:3001");
});

test("DNS mode keeps every game's copy address stable while refreshing numeric fallbacks and Steam targets", () => {
  const env = { HABITAT_PLAYER_CONNECTIONS_ENABLED: "true", HABITAT_PLAYER_ADDRESS_SOURCE: "dns", HABITAT_PLAYER_HOSTNAME: "play.example.com" };
  const snapshot = { address: "8.8.8.8", resolvedAt: new Date(0).toISOString(), expiresAt: new Date(30000).toISOString() };
  for (const slug of playerGameSlugs) {
    const first = playerConnectionDetails(slug, snapshot, env);
    const changed = playerConnectionDetails(slug, { ...snapshot, address: "1.1.1.1" }, env);
    assert.equal(first.hostname, "play.example.com");
    assert.equal(first.endpoint, `play.example.com:${first.port}`);
    assert.equal(changed.endpoint, first.endpoint);
    assert.equal(first.ipEndpoint, `8.8.8.8:${first.port}`);
    assert.equal(changed.ipEndpoint, `1.1.1.1:${first.port}`);
    if (first.steamUri !== null) {
      assert.match(first.steamUri, /^steam:\/\/connect\/8\.8\.8\.8:/);
      assert.match(changed.steamUri!, /^steam:\/\/connect\/1\.1\.1\.1:/);
    }
  }
  const overridden = playerConnectionDetails("dragonwilds", snapshot, { ...env, HABITAT_PLAYER_DRAGONWILDS_PORT: "3000" });
  assert.equal(overridden.endpoint, "play.example.com:3000");
  assert.equal(overridden.ipEndpoint, "8.8.8.8:3000");
});

test("public-IP mode remains usable without a hostname", () => {
  const result = playerConnectionDetails("dragonwilds", { address: "8.8.8.8", resolvedAt: new Date(0).toISOString(), expiresAt: new Date(30000).toISOString() }, { HABITAT_PLAYER_CONNECTIONS_ENABLED: "true", HABITAT_PLAYER_ADDRESS_SOURCE: "public-ip" });
  assert.equal(result.hostname, null);
  assert.equal(result.endpoint, "8.8.8.8:7777");
  assert.equal(result.ipEndpoint, result.endpoint);
});
