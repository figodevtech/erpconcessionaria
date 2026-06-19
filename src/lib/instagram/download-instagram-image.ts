import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const ALLOWED_IMAGE_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_MEDIA_HOSTS = ["cdninstagram.com", "fbcdn.net", "fbsbx.com"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 3;

export class InstagramImageDownloadError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "InstagramImageDownloadError";
  }
}

function isAllowedMediaHost(hostname: string) {
  const host = hostname.toLowerCase();
  return ALLOWED_MEDIA_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
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
    throw new InstagramImageDownloadError("URL de imagem inválida.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new InstagramImageDownloadError("URL de imagem inválida.");
  }

  if (url.username || url.password || !isAllowedMediaHost(url.hostname)) {
    throw new InstagramImageDownloadError("A imagem não pertence a um domínio de mídia permitido.");
  }

  const directIpType = isIP(url.hostname);
  if (directIpType === 4 && isPrivateIPv4(url.hostname)) {
    throw new InstagramImageDownloadError("URL de imagem não permitida.");
  }
  if (directIpType === 6 && isPrivateIPv6(url.hostname)) {
    throw new InstagramImageDownloadError("URL de imagem não permitida.");
  }

  if (!directIpType) {
    const addresses = await lookup(url.hostname, { all: true });
    if (
      addresses.some((address) =>
        address.family === 4 ? isPrivateIPv4(address.address) : isPrivateIPv6(address.address),
      )
    ) {
      throw new InstagramImageDownloadError("URL de imagem não permitida.");
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
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; ERPConcessionaria/1.0; image import)",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      if (redirects >= MAX_REDIRECTS) {
        throw new InstagramImageDownloadError("Redirecionamentos demais ao baixar imagem.", 400);
      }

      const location = response.headers.get("location");
      if (!location) {
        throw new InstagramImageDownloadError("Redirecionamento inválido ao baixar imagem.", 400);
      }

      const nextUrl = await validateDownloadUrl(new URL(location, url).toString());
      return fetchWithValidatedRedirects(nextUrl, redirects + 1);
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export function extensionFromContentType(contentType: string) {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return null;
}

export async function downloadInstagramImage(rawUrl: string) {
  const url = await validateDownloadUrl(rawUrl);
  const response = await fetchWithValidatedRedirects(url);

  if (!response.ok) {
    throw new InstagramImageDownloadError("Erro ao baixar imagem do Instagram.", 502);
  }

  const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (!contentType || !ALLOWED_IMAGE_CONTENT_TYPES.has(contentType)) {
    throw new InstagramImageDownloadError("Formato de imagem não suportado.", 422);
  }

  const contentLength = Number(response.headers.get("content-length"));
  if (contentLength && contentLength > MAX_IMAGE_BYTES) {
    throw new InstagramImageDownloadError("Imagem maior que o limite de 10MB.", 413);
  }

  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new InstagramImageDownloadError("Imagem maior que o limite de 10MB.", 413);
  }

  return { bytes, contentType };
}
