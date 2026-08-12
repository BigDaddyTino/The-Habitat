import "@/lib/environment";

type PublicUrlEnvironment = {
  AUTH_URL?: string;
  NODE_ENV?: string;
};

export function publicOrigin(requestUrl?: string, environment: PublicUrlEnvironment = process.env): URL {
  const configuredUrl = environment.AUTH_URL?.trim();
  if (!configuredUrl) {
    if (environment.NODE_ENV === "production") {
      throw new Error("AUTH_URL must be configured with the public HTTPS origin in production.");
    }
    if (!requestUrl) throw new Error("AUTH_URL or a request URL is required to resolve the application origin.");
    try {
      return validatedOrigin(new URL(requestUrl).origin, false, "request URL");
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("request URL")) throw error;
      throw new Error("request URL must be an absolute HTTP(S) URL.");
    }
  }

  return validatedOrigin(configuredUrl, environment.NODE_ENV === "production", "AUTH_URL");
}

export function publicUrl(path: string, requestUrl?: string, environment: PublicUrlEnvironment = process.env): URL {
  return new URL(path, publicOrigin(requestUrl, environment));
}

export function isPublicOrigin(value: string, requestUrl?: string, environment: PublicUrlEnvironment = process.env): boolean {
  try {
    return new URL(value).origin === publicOrigin(requestUrl, environment).origin;
  } catch {
    return false;
  }
}

function validatedOrigin(value: string, requireHttps: boolean, source: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${source} must be an absolute HTTP(S) URL.`);
  }

  if (!(["http:", "https:"] as string[]).includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error(`${source} must contain only an HTTP(S) origin without credentials, a path, a query, or a fragment.`);
  }
  if (requireHttps && url.protocol !== "https:") throw new Error("AUTH_URL must use HTTPS in production.");
  return new URL(url.origin);
}
