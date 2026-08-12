export const ACTIVE_PRESENCE_WINDOW_MS = 3 * 60 * 1000;

export type MemberDevice = {
  deviceType: string;
  platform: string;
  browser: string;
};

export function describeUserAgent(userAgent: string): MemberDevice {
  const deviceType = /ipad|tablet|kindle|silk/i.test(userAgent)
    ? "Tablet"
    : /iphone|ipod|android.+mobile|windows phone/i.test(userAgent)
      ? "Mobile"
      : "Desktop";
  const platform = /iphone|ipad|ipod/i.test(userAgent)
    ? "iOS"
    : /android/i.test(userAgent)
      ? "Android"
      : /windows/i.test(userAgent)
        ? "Windows"
        : /macintosh|mac os x/i.test(userAgent)
          ? "macOS"
          : /linux/i.test(userAgent)
            ? "Linux"
            : "Unknown platform";
  const browser = /edg\//i.test(userAgent)
    ? "Edge"
    : /firefox\//i.test(userAgent)
      ? "Firefox"
      : /crios\//i.test(userAgent)
        ? "Chrome"
        : /chrome\//i.test(userAgent)
          ? "Chrome"
          : /safari\//i.test(userAgent)
            ? "Safari"
            : "Web browser";

  return { deviceType, platform, browser };
}

export function isPresenceActive(lastSeenAt: Date, now = new Date()) {
  return now.getTime() - lastSeenAt.getTime() <= ACTIVE_PRESENCE_WINDOW_MS;
}
