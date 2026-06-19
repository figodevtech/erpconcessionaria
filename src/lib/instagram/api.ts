import type { InstagramMediaImage } from "@/types/instagram";
import { createAdminClient } from "@/utils/supabase/server";

type InstagramMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

interface InstagramGraphMedia {
  id: string;
  media_type?: InstagramMediaType;
  media_url?: string;
  permalink?: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp?: string;
}

interface InstagramGraphListResponse {
  data?: InstagramGraphMedia[];
  paging?: {
    next?: string;
  };
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
}

export class InstagramApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "InstagramApiError";
  }
}

const MEDIA_FIELDS = "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp";
const CHILD_FIELDS = "id,media_type,media_url,permalink,thumbnail_url";
const MAX_PAGES_TO_SCAN = 10;

export async function getInstagramAccessTokenForUser(userId: string) {
  const { supabase, error } = await createAdminClient();

  if (error || !supabase) {
    throw new InstagramApiError("Configuração Supabase de backend ausente.", 500);
  }

  const { data, error: accountError } = await supabase
    .from("instagram_accounts")
    .select("access_token, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (accountError) {
    console.error("Error fetching Instagram account:", accountError);
    throw new InstagramApiError("Não foi possível consultar a conta Instagram conectada.", 500);
  }

  if (!data?.access_token) return null;

  if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) {
    throw new InstagramApiError("A conexão com o Instagram expirou. Conecte a conta novamente.", 409);
  }

  return data.access_token as string;
}

async function fetchInstagramJson(url: string): Promise<InstagramGraphListResponse> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as InstagramGraphListResponse;

  if (!response.ok || data.error) {
    const message =
      data.error?.message ||
      "Não foi possível consultar a API do Instagram. Verifique a conexão da conta.";
    throw new InstagramApiError(message, response.status || 400);
  }

  return data;
}

export async function listAuthorizedMedia(accessToken: string, maxPages = MAX_PAGES_TO_SCAN) {
  const media: InstagramGraphMedia[] = [];
  const initialUrl = new URL("https://graph.instagram.com/me/media");
  initialUrl.searchParams.set("fields", MEDIA_FIELDS);
  initialUrl.searchParams.set("limit", "25");
  initialUrl.searchParams.set("access_token", accessToken);

  let nextUrl: string | undefined = initialUrl.toString();
  let scannedPages = 0;

  while (nextUrl && scannedPages < maxPages) {
    const data = await fetchInstagramJson(nextUrl);
    media.push(...(data.data || []));
    nextUrl = data.paging?.next;
    scannedPages += 1;
  }

  return media;
}

export async function listAuthorizedPosts(accessToken: string, limit = 24) {
  const mediaList = await listAuthorizedMedia(accessToken, 3);

  return mediaList
    .filter((media) => {
      if (!media.permalink) return false;
      if (media.permalink.includes("/reel/")) return false;
      return media.media_type === "IMAGE" || media.media_type === "CAROUSEL_ALBUM";
    })
    .slice(0, limit)
    .map((media) => ({
      id: media.id,
      media_type: media.media_type,
      media_url: media.media_url || media.thumbnail_url || "",
      thumbnail_url: media.thumbnail_url,
      permalink: media.permalink || "",
      caption: media.caption,
      timestamp: media.timestamp,
    }));
}

export async function listAuthorizedReels(accessToken: string, limit = 24) {
  const mediaList = await listAuthorizedMedia(accessToken, 3);

  return mediaList
    .filter((media) => {
      if (!media.permalink) return false;
      return media.media_type === "VIDEO" && media.permalink.includes("/reel/");
    })
    .slice(0, limit)
    .map((media) => ({
      id: media.id,
      media_type: media.media_type,
      media_url: media.media_url || "",
      thumbnail_url: media.thumbnail_url,
      permalink: media.permalink || "",
      caption: media.caption,
      timestamp: media.timestamp,
    }));
}

export async function findVideoByShortcode(shortcode: string, accessToken: string) {
  const mediaList = await listAuthorizedMedia(accessToken);
  const media = mediaList.find(
    (item) => item.media_type === "VIDEO" && item.permalink?.includes(shortcode),
  );

  if (!media || !media.media_url) {
    throw new InstagramApiError(
      "Reel não encontrado nas mídias autorizadas da conta Instagram conectada.",
      404,
    );
  }

  return {
    id: media.id,
    media_url: media.media_url,
    thumbnail_url: media.thumbnail_url,
    permalink: media.permalink,
    caption: media.caption,
    timestamp: media.timestamp,
  };
}

async function listCarouselChildren(mediaId: string, accessToken: string) {
  const childrenUrl = new URL(`https://graph.instagram.com/${mediaId}/children`);
  childrenUrl.searchParams.set("fields", CHILD_FIELDS);
  childrenUrl.searchParams.set("access_token", accessToken);

  const data = await fetchInstagramJson(childrenUrl.toString());
  return data.data || [];
}

function toImage(media: InstagramGraphMedia, fallbackPermalink?: string): InstagramMediaImage | null {
  const imageUrl = media.media_type === "IMAGE" ? media.media_url : media.thumbnail_url;
  if (!imageUrl) return null;

  return {
    id: media.id,
    media_url: imageUrl,
    url: imageUrl,
    permalink: media.permalink || fallbackPermalink,
    thumbnail_url: media.thumbnail_url,
  };
}

export async function findImagesByShortcode(shortcode: string, accessToken: string) {
  const mediaList = await listAuthorizedMedia(accessToken);
  const media = mediaList.find((item) => item.permalink?.includes(shortcode));

  if (!media) {
    throw new InstagramApiError(
      "Post não encontrado nas mídias autorizadas da conta Instagram conectada.",
      404,
    );
  }

  if (media.media_type === "CAROUSEL_ALBUM") {
    const children = await listCarouselChildren(media.id, accessToken);
    return children
      .map((child) => toImage(child, media.permalink))
      .filter((image): image is InstagramMediaImage => Boolean(image))
      .map((image, index) => ({
        ...image,
        id: image.id,
        index,
      }));
  }

  const image = toImage(media);
  return image ? [{ ...image, index: 0 }] : [];
}

export async function findAuthorizedImagesByIds(ids: string[], accessToken: string) {
  const mediaList = await listAuthorizedMedia(accessToken);
  const images = new Map<string, InstagramMediaImage>();

  for (const media of mediaList) {
    const image = toImage(media);
    if (image) {
      images.set(image.id, image);
      continue;
    }

    if (media.media_type === "CAROUSEL_ALBUM") {
      const children = await listCarouselChildren(media.id, accessToken);
      for (const child of children) {
        const childImage = toImage(child, media.permalink);
        if (childImage) images.set(childImage.id, childImage);
      }
    }
  }

  return ids
    .map((id) => images.get(id))
    .filter((image): image is InstagramMediaImage => Boolean(image));
}
