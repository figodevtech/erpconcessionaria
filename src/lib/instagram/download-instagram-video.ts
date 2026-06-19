import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const ALLOWED_VIDEO_CONTENT_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/octet-stream",
]);
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_REDIRECTS = 3;

export class InstagramVideoDownloadError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "InstagramVideoDownloadError";
  }
}

function isAllowedMediaHost(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === "cdninstagram.com" ||
    host.endsWith(".cdninstagram.com") ||
    host === "fbcdn.net" ||
    host.endsWith(".fbcdn.net") ||
    host === "fbsbx.com" ||
    host.endsWith(".fbsbx.com") ||
    (host.startsWith("instagram.") && host.endsWith(".fbcdn.net")) ||
    (host.startsWith("scontent") && host.includes(".cdninstagram.com"))
  );
}

function isPrivateIPv4(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
}

function isPrivateIPv6(ip: string) {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:") ||
    normalized === "::"
  );
}

async function validateDownloadUrl(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new InstagramVideoDownloadError("URL de vídeo inválida.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new InstagramVideoDownloadError("URL de vídeo inválida.");
  }

  if (url.username || url.password || !isAllowedMediaHost(url.hostname)) {
    throw new InstagramVideoDownloadError("O vídeo não pertence a um domínio de mídia permitido.");
  }

  const directIpType = isIP(url.hostname);
  if (directIpType === 4 && isPrivateIPv4(url.hostname)) {
    throw new InstagramVideoDownloadError("URL de vídeo não permitida.");
  }
  if (directIpType === 6 && isPrivateIPv6(url.hostname)) {
    throw new InstagramVideoDownloadError("URL de vídeo não permitida.");
  }

  if (!directIpType) {
    const addresses = await lookup(url.hostname, { all: true });
    if (
      addresses.some((address) =>
        address.family === 4 ? isPrivateIPv4(address.address) : isPrivateIPv6(address.address),
      )
    ) {
      throw new InstagramVideoDownloadError("URL de vídeo não permitida.");
    }
  }

  return url;
}

async function fetchWithValidatedRedirects(url: URL, redirects = 0): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "manual",
      cache: "no-store",
      headers: {
        Accept: "video/mp4,video/webm,video/quicktime,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; ERPConcessionaria/1.0; video import)",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      if (redirects >= MAX_REDIRECTS) {
        throw new InstagramVideoDownloadError("Redirecionamentos demais ao baixar vídeo.", 400);
      }

      const location = response.headers.get("location");
      if (!location) {
        throw new InstagramVideoDownloadError("Redirecionamento inválido ao baixar vídeo.", 400);
      }

      const nextUrl = await validateDownloadUrl(new URL(location, url).toString());
      return fetchWithValidatedRedirects(nextUrl, redirects + 1);
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export function extensionFromVideoContentType(contentType: string) {
  if (contentType === "video/mp4" || contentType === "application/octet-stream") return "mp4";
  if (contentType === "video/webm") return "webm";
  if (contentType === "video/quicktime") return "mov";
  return null;
}

export async function downloadInstagramVideo(rawUrl: string) {
  const url = await validateDownloadUrl(rawUrl);
  const response = await fetchWithValidatedRedirects(url);

  if (!response.ok) {
    throw new InstagramVideoDownloadError("Erro ao baixar vídeo do Instagram.", 502);
  }

  const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (!contentType || !ALLOWED_VIDEO_CONTENT_TYPES.has(contentType)) {
    throw new InstagramVideoDownloadError("Formato de vídeo não suportado.", 422);
  }

  const contentLength = Number(response.headers.get("content-length"));
  if (contentLength && contentLength > MAX_VIDEO_BYTES) {
    throw new InstagramVideoDownloadError("Vídeo maior que o limite de 100MB.", 413);
  }

  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_VIDEO_BYTES) {
    throw new InstagramVideoDownloadError("Vídeo maior que o limite de 100MB.", 413);
  }

  return { bytes, contentType };
}
