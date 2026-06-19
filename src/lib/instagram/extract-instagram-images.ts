import type { InstagramExtractedImage } from "@/types/instagram";

type InstagramImage = {
  id: string;
  url: string;
  index: number;
  width?: number;
  height?: number;
};

type InstagramExtractResult = {
  success: boolean;
  shortcode?: string;
  images: InstagramImage[];
  message?: string;
};

type JsonRecord = Record<string, unknown>;

const INVALID_URL_MESSAGE = "URL do Instagram inválida.";
const NOT_ENOUGH_DATA_MESSAGE =
  "Não foi possível encontrar imagens públicas desta postagem. O Instagram pode ter limitado o acesso ao conteúdo.";
const NOT_FOUND_MESSAGE = "Nenhuma imagem da postagem foi encontrada.";
const BLOCKED_MESSAGE = "A postagem pode ser privada, removida ou bloqueada para acesso público.";
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_IMAGES = 20;

export class InstagramPublicExtractionError extends Error {
  constructor(message = NOT_ENOUGH_DATA_MESSAGE, public status = 422) {
    super(message);
    this.name = "InstagramPublicExtractionError";
  }
}

function debugLog(...args: unknown[]) {
  if (process.env.INSTAGRAM_EXTRACT_DEBUG === "true") {
    console.debug("[instagram-extract]", ...args);
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function extractShortcode(inputUrl: string) {
  return validateInstagramPostUrl(inputUrl)?.shortcode || null;
}

export function validateInstagramPostUrl(inputUrl: string) {
  try {
    const url = new URL(inputUrl.trim());
    const hostname = url.hostname.toLowerCase();
    if (hostname !== "instagram.com" && hostname !== "www.instagram.com") return null;

    const match = url.pathname.match(/^\/(p|reel|tv)\/([^/?#]+)\/?$/);
    if (!match?.[2]) return null;

    return {
      kind: match[1],
      shortcode: match[2],
    };
  } catch {
    return null;
  }
}

export function normalizeInstagramUrl(inputUrl: string) {
  const parsed = validateInstagramPostUrl(inputUrl);
  if (!parsed) return null;

  return {
    shortcode: parsed.shortcode,
    url: `https://www.instagram.com/${parsed.kind}/${parsed.shortcode}/`,
  };
}

export function parseInstagramPostUrl(postUrl: string) {
  const normalized = normalizeInstagramUrl(postUrl);
  if (!normalized) {
    throw new InstagramPublicExtractionError(INVALID_URL_MESSAGE, 400);
  }

  return { shortcode: normalized.shortcode, url: new URL(normalized.url) };
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#47;/g, "/")
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/");
}

function getMetaContent(html: string, key: string) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escapedKey}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  return html.match(regex)?.[1];
}

function normalizeImageUrl(value: unknown) {
  const raw = asString(value);
  if (!raw) return null;

  const decoded = decodeHtmlEntities(raw).trim();
  if (!decoded || decoded.startsWith("data:") || decoded.toLowerCase().includes(".svg")) return null;

  try {
    const url = new URL(decoded);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    const hostname = url.hostname.toLowerCase();
    const allowedHost =
      hostname === "cdninstagram.com" ||
      hostname.endsWith(".cdninstagram.com") ||
      hostname === "fbcdn.net" ||
      hostname.endsWith(".fbcdn.net") ||
      hostname === "fbsbx.com" ||
      hostname.endsWith(".fbsbx.com");
    if (!allowedHost) return null;

    const suspicious = `${url.pathname} ${url.search}`.toLowerCase();
    if (
      suspicious.includes("favicon") ||
      suspicious.includes("sprite") ||
      suspicious.includes("logo") ||
      suspicious.includes("profile_pic") ||
      suspicious.includes("avatar") ||
      suspicious.includes("placeholder")
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function dimensionsFromRecord(record: JsonRecord) {
  const dimensions = isRecord(record.dimensions) ? record.dimensions : undefined;
  return {
    width: asNumber(dimensions?.width) ?? asNumber(record.width) ?? asNumber(record.original_width),
    height: asNumber(dimensions?.height) ?? asNumber(record.height) ?? asNumber(record.original_height),
  };
}

function bestResourceUrl(resources: unknown) {
  if (!Array.isArray(resources)) return null;

  const candidates = resources
    .filter(isRecord)
    .map((resource) => ({
      url: normalizeImageUrl(resource.src ?? resource.url),
      width: asNumber(resource.config_width) ?? asNumber(resource.width),
      height: asNumber(resource.config_height) ?? asNumber(resource.height),
    }))
    .filter((resource) => resource.url);

  candidates.sort((a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0));
  return candidates[0] || null;
}

function imageVersionsUrl(record: JsonRecord) {
  const versions = isRecord(record.image_versions2) ? record.image_versions2 : undefined;
  const candidates = Array.isArray(versions?.candidates) ? versions.candidates : undefined;
  if (!candidates) return null;

  return bestResourceUrl(
    candidates.map((candidate) =>
      isRecord(candidate)
        ? {
            src: candidate.url,
            width: candidate.width,
            height: candidate.height,
          }
        : candidate,
    ),
  );
}

function imageFromNode(node: unknown, index: number, shortcode: string): InstagramImage | null {
  if (!isRecord(node)) return null;

  const resource = bestResourceUrl(node.display_resources) ?? imageVersionsUrl(node);
  const fallbackUrl =
    resource?.url ??
    normalizeImageUrl(node.display_url) ??
    normalizeImageUrl(node.thumbnail_src) ??
    normalizeImageUrl(node.thumbnail_url);

  if (!fallbackUrl) return null;

  const dimensions = dimensionsFromRecord(node);
  const width = resource?.width ?? dimensions.width;
  const height = resource?.height ?? dimensions.height;

  if (width && height && width < 300 && height < 300) return null;

  return {
    id: `${shortcode}-${index}`,
    url: fallbackUrl,
    index,
    width,
    height,
  };
}

function getCarouselNodes(postJson: unknown) {
  if (!isRecord(postJson)) return [];

  const sidecar = isRecord(postJson.edge_sidecar_to_children)
    ? postJson.edge_sidecar_to_children
    : undefined;
  const sidecarEdges = Array.isArray(sidecar?.edges) ? sidecar.edges : undefined;
  if (sidecarEdges) {
    return sidecarEdges
      .filter(isRecord)
      .map((edge) => edge.node)
      .filter(Boolean);
  }

  if (Array.isArray(postJson.carousel_media)) return postJson.carousel_media;
  if (Array.isArray(postJson.carousel_media_edges)) {
    return postJson.carousel_media_edges.filter(isRecord).map((edge) => edge.node ?? edge);
  }

  return [];
}

export function extractImagesFromPostJson(postJson: unknown, shortcode = "instagram") {
  const carouselNodes = getCarouselNodes(postJson);
  const rawImages =
    carouselNodes.length > 0
      ? carouselNodes.map((node, index) => imageFromNode(node, index, shortcode))
      : [imageFromNode(postJson, 0, shortcode)];

  return dedupeImages(rawImages.filter((image): image is InstagramImage => Boolean(image))).slice(0, MAX_IMAGES);
}

function objectMentionsShortcode(record: JsonRecord, shortcode: string) {
  const directCode = asString(record.shortcode) ?? asString(record.code);
  if (directCode === shortcode) return true;

  const permalink = asString(record.permalink) ?? asString(record.url) ?? asString(record.display_uri);
  return Boolean(permalink?.includes(`/${shortcode}/`) || permalink?.includes(shortcode));
}

function hasPostImageFields(record: JsonRecord) {
  return Boolean(
    record.display_url ||
      record.display_resources ||
      record.edge_sidecar_to_children ||
      record.carousel_media ||
      record.image_versions2 ||
      record.thumbnail_src ||
      record.thumbnail_url,
  );
}

function candidateScore(record: JsonRecord, shortcode: string) {
  let score = 0;
  if (objectMentionsShortcode(record, shortcode)) score += 100;
  if (record.edge_sidecar_to_children || record.carousel_media) score += 50;
  if (record.display_url) score += 25;
  if (record.display_resources || record.image_versions2) score += 20;
  if (record.dimensions) score += 10;
  if (record.owner && !hasPostImageFields(record)) score -= 20;
  return score;
}

function findPostCandidates(value: unknown, shortcode: string, candidates: JsonRecord[] = []) {
  if (Array.isArray(value)) {
    for (const item of value) findPostCandidates(item, shortcode, candidates);
    return candidates;
  }

  if (!isRecord(value)) return candidates;

  const directContainers = [
    value.xdt_shortcode_media,
    value.shortcode_media,
    isRecord(value.graphql) ? value.graphql.shortcode_media : undefined,
    isRecord(value.data) ? value.data.shortcode_media : undefined,
    isRecord(value.data) ? value.data.xdt_shortcode_media : undefined,
  ];

  for (const container of directContainers) {
    if (isRecord(container) && objectMentionsShortcode(container, shortcode) && hasPostImageFields(container)) {
      candidates.push(container);
    }
  }

  if (objectMentionsShortcode(value, shortcode) && hasPostImageFields(value)) {
    candidates.push(value);
  }

  for (const child of Object.values(value)) {
    if (typeof child === "object" && child !== null) {
      findPostCandidates(child, shortcode, candidates);
    }
  }

  return candidates;
}

function tryParseJsonLike(value: string) {
  const decoded = decodeHtmlEntities(value).trim();
  if (!decoded) return null;

  try {
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function extractBalancedJsonAround(text: string, needle: string) {
  const needleIndex = text.indexOf(needle);
  if (needleIndex < 0) return [];

  const snippets: string[] = [];
  const starts: number[] = [];
  for (let index = needleIndex; index >= 0; index -= 1) {
    if (text[index] === "{") starts.push(index);
    if (starts.length >= 8) break;
  }

  for (const start of starts) {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < text.length; index += 1) {
      const char = text[index];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') inString = true;
      if (char === "{") depth += 1;
      if (char === "}") depth -= 1;

      if (depth === 0) {
        snippets.push(text.slice(start, index + 1));
        break;
      }
    }
  }

  return snippets;
}

function extractScriptBodies(html: string) {
  const scripts: string[] = [];
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptRegex)) {
    if (match[1]?.includes("{")) scripts.push(match[1]);
  }
  return scripts;
}

export function extractPostJsonFromHtml(html: string, shortcode: string) {
  const scripts = extractScriptBodies(html).filter((script) => script.includes(shortcode));
  const roots: unknown[] = [];

  for (const script of scripts) {
    const parsed = tryParseJsonLike(script);
    if (parsed) roots.push(parsed);

    for (const snippet of extractBalancedJsonAround(script, shortcode)) {
      const parsedSnippet = tryParseJsonLike(snippet);
      if (parsedSnippet) roots.push(parsedSnippet);
    }
  }

  const candidates = roots.flatMap((root) => findPostCandidates(root, shortcode));
  candidates.sort((a, b) => candidateScore(b, shortcode) - candidateScore(a, shortcode));

  debugLog("shortcode", shortcode);
  debugLog("structured json candidates", candidates.length);

  return candidates[0] || null;
}

export function extractOgImageFallback(html: string, shortcode: string) {
  const ogImage = normalizeImageUrl(getMetaContent(html, "og:image"));
  if (!ogImage) return [];

  const width = Number(getMetaContent(html, "og:image:width")) || undefined;
  const height = Number(getMetaContent(html, "og:image:height")) || undefined;
  if (width && height && width < 300 && height < 300) return [];

  return [
    {
      id: `${shortcode}-0`,
      url: ogImage,
      index: 0,
      width,
      height,
    },
  ];
}

export function dedupeImages(images: InstagramImage[]) {
  const seen = new Set<string>();
  return images.filter((image, nextIndex) => {
    if (seen.has(image.url)) return false;
    seen.add(image.url);
    image.index = nextIndex;
    return true;
  });
}

export async function fetchInstagramHtml(normalizedUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      redirect: "follow",
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new InstagramPublicExtractionError(BLOCKED_MESSAGE, response.status);
    }

    const contentType = response.headers.get("content-type") || "";
    const html = await response.text();

    if (!contentType.includes("text/html") || html.trim().length < 100) {
      throw new InstagramPublicExtractionError(BLOCKED_MESSAGE, 422);
    }

    const blockedMarkers = [
      '"pageID":"httpErrorPage"',
      '"page_type":"EMBEDS"',
      "Page Not Found",
      "require_login",
      "login_required",
      "checkpoint_required",
      "challenge_required",
    ];

    if (blockedMarkers.some((marker) => html.includes(marker))) {
      throw new InstagramPublicExtractionError(BLOCKED_MESSAGE, 422);
    }

    return html;
  } catch (error) {
    if (error instanceof InstagramPublicExtractionError) throw error;
    throw new InstagramPublicExtractionError(BLOCKED_MESSAGE, 422);
  } finally {
    clearTimeout(timeout);
  }
}

export async function extractInstagramPostImages(inputUrl: string): Promise<InstagramExtractResult> {
  const normalized = normalizeInstagramUrl(inputUrl);
  if (!normalized) {
    return { success: false, images: [], message: INVALID_URL_MESSAGE };
  }

  try {
    const html = await fetchInstagramHtml(normalized.url);
    const postJson = extractPostJsonFromHtml(html, normalized.shortcode);
    const structuredImages = postJson ? extractImagesFromPostJson(postJson, normalized.shortcode) : [];

    if (structuredImages.length > 0) {
      debugLog("used structured json", true);
      debugLog("carousel", getCarouselNodes(postJson).length > 0);
      debugLog("images", structuredImages.length);
      return {
        success: true,
        shortcode: normalized.shortcode,
        images: structuredImages,
      };
    }

    const fallbackImages = extractOgImageFallback(html, normalized.shortcode);
    if (fallbackImages.length > 0) {
      debugLog("used og:image fallback", true);
      return {
        success: true,
        shortcode: normalized.shortcode,
        images: fallbackImages,
      };
    }

    return {
      success: false,
      shortcode: normalized.shortcode,
      images: [],
      message: NOT_FOUND_MESSAGE,
    };
  } catch (error) {
    return {
      success: false,
      shortcode: normalized.shortcode,
      images: [],
      message: error instanceof Error ? error.message : NOT_ENOUGH_DATA_MESSAGE,
    };
  }
}

export async function extractInstagramImagesFromPublicPost(postUrl: string) {
  const result = await extractInstagramPostImages(postUrl);

  if (!result.success) {
    throw new InstagramPublicExtractionError(result.message || NOT_ENOUGH_DATA_MESSAGE, 422);
  }

  return {
    postShortcode: result.shortcode!,
    images: result.images as InstagramExtractedImage[],
  };
}

export function publicExtractionErrorMessage() {
  return NOT_ENOUGH_DATA_MESSAGE;
}
