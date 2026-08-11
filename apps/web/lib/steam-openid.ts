export const steamOpenIdEndpoint = "https://steamcommunity.com/openid/login";

export function steamIdFromClaimedId(value: string | null) {
  const match = /^https?:\/\/steamcommunity\.com\/openid\/id\/(7656119\d{10})$/.exec(value ?? "");
  return match?.[1] ?? null;
}

export async function verifySteamOpenId(parameters: URLSearchParams, fetcher: typeof fetch = fetch) {
  if (parameters.get("openid.mode") !== "id_res" || parameters.get("openid.op_endpoint") !== steamOpenIdEndpoint) return null;
  const claimedSteamId = steamIdFromClaimedId(parameters.get("openid.claimed_id"));
  const identitySteamId = steamIdFromClaimedId(parameters.get("openid.identity"));
  if (!claimedSteamId || claimedSteamId !== identitySteamId) return null;

  const verification = new URLSearchParams();
  for (const [key, value] of parameters) if (key.startsWith("openid.")) verification.set(key, value);
  verification.set("openid.mode", "check_authentication");
  const response = await fetcher(steamOpenIdEndpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: verification,
    cache: "no-store",
  });
  if (!response.ok) return null;
  const fields = new Map((await response.text()).split(/\r?\n/).map((line) => line.split(":", 2) as [string, string]));
  return fields.get("is_valid") === "true" ? claimedSteamId : null;
}
