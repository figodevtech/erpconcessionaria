const INSTAGRAM_POST_PATH_REGEX = /^\/(p|reel|tv)\/([^/?#]+)\/?$/;

export function extractInstagramShortcode(postUrl: string): string | null {
  if (!postUrl || typeof postUrl !== "string") return null;

  try {
    const url = new URL(postUrl.trim());
    const hostname = url.hostname.toLowerCase();

    if (hostname !== "instagram.com" && hostname !== "www.instagram.com") {
      return null;
    }

    const match = url.pathname.match(INSTAGRAM_POST_PATH_REGEX);
    return match?.[2] || null;
  } catch {
    return null;
  }
}
