import { createAdminClient } from "@/utils/supabase/server";
import { createHmac, timingSafeEqual, randomUUID } from "crypto";

export interface InstagramAccountStatus {
  connected: boolean;
  account?: {
    instagramUserId: string;
    username: string | null;
    accountType: string | null;
    mediaCount: number | null;
    expiresAt: string | null;
    connectedAt: string;
  };
}

interface InstagramShortLivedTokenResponse {
  access_token?: string;
  user_id?: number;
  permissions?: string;
  token_type?: string;
  expires_in?: number;
  error_message?: string;
  error_type?: string;
  code?: number;
}

interface InstagramLongLivedTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
}

interface InstagramProfileResponse {
  id?: string;
  user_id?: string;
  username?: string;
  name?: string;
  account_type?: string;
  media_count?: number;
  error?: {
    message?: string;
  };
}

interface InstagramOAuthStatePayload {
  userId: string;
  returnTo: string;
  exp: number;
  nonce: string;
}

function getInstagramGraphApiVersion() {
  return process.env.INSTAGRAM_GRAPH_API_VERSION || "v25.0";
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getStateSecret() {
  return (
    process.env.INSTAGRAM_OAUTH_STATE_SECRET ||
    process.env.INSTAGRAM_CLIENT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function signStatePayload(payload: string) {
  const secret = getStateSecret();
  if (!secret) {
    throw new Error("Configure INSTAGRAM_OAUTH_STATE_SECRET para assinar o state do OAuth.");
  }

  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createInstagramOAuthState(userId: string, returnTo: string) {
  const payload: InstagramOAuthStatePayload = {
    userId,
    returnTo,
    exp: Date.now() + 10 * 60 * 1000,
    nonce: randomUUID(),
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signStatePayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyInstagramOAuthState(state: string) {
  const [encodedPayload, signature] = state.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signStatePayload(encodedPayload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as InstagramOAuthStatePayload;
  if (!payload.userId || !payload.returnTo || payload.exp < Date.now()) return null;

  try {
    const returnUrl = new URL(payload.returnTo);
    if (returnUrl.protocol !== "https:" && returnUrl.hostname !== "localhost") return null;
  } catch {
    return null;
  }

  return payload;
}

export function getInstagramOAuthConfig(origin?: string) {
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  const redirectUri =
    process.env.INSTAGRAM_REDIRECT_URI ||
    `${origin || process.env.NEXT_PUBLIC_APP_URL || ""}/api/instagram/oauth/callback`;
  const scope = process.env.INSTAGRAM_OAUTH_SCOPE || "instagram_business_basic";

  if (!clientId || !clientSecret || !redirectUri.startsWith("http")) {
    return {
      error:
        "Configure INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET e INSTAGRAM_REDIRECT_URI para conectar o Instagram.",
      clientId,
      clientSecret,
      redirectUri,
      scope,
    };
  }

  if (!redirectUri.includes("/api/instagram/oauth/callback")) {
    return {
      error:
        "INSTAGRAM_REDIRECT_URI deve apontar para /api/instagram/oauth/callback.",
      clientId,
      clientSecret,
      redirectUri,
      scope,
    };
  }

  if (!/^\d+$/.test(clientId)) {
    return {
      error:
        "INSTAGRAM_CLIENT_ID deve ser o ID numérico do app na Meta, não o nome do aplicativo.",
      clientId,
      clientSecret,
      redirectUri,
      scope,
    };
  }

  return {
    error: null,
    clientId,
    clientSecret,
    redirectUri,
    scope,
  };
}

export function buildInstagramAuthorizationUrl(state: string, origin: string) {
  const config = getInstagramOAuthConfig(origin);
  if (config.error || !config.clientId) return { error: config.error, url: null };

  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("state", state);
  url.searchParams.set("enable_fb_login", "0");
  url.searchParams.set("force_authentication", "1");

  return { error: null, url: url.toString() };
}

async function exchangeCodeForShortLivedToken(code: string, origin: string) {
  const config = getInstagramOAuthConfig(origin);
  if (config.error || !config.clientId || !config.clientSecret) {
    throw new Error(config.error || "Configuração OAuth inválida.");
  }

  const formData = new FormData();
  formData.set("client_id", config.clientId);
  formData.set("client_secret", config.clientSecret);
  formData.set("grant_type", "authorization_code");
  formData.set("redirect_uri", config.redirectUri);
  formData.set("code", code);

  const response = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body: formData,
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as InstagramShortLivedTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_message || "Não foi possível obter o token do Instagram.");
  }

  return data;
}

async function exchangeForLongLivedToken(shortLivedToken: string, origin: string) {
  const config = getInstagramOAuthConfig(origin);
  if (config.error || !config.clientSecret) {
    throw new Error(config.error || "Configuração OAuth inválida.");
  }

  const url = new URL("https://graph.instagram.com/access_token");
  url.searchParams.set("grant_type", "ig_exchange_token");
  url.searchParams.set("client_secret", config.clientSecret);
  url.searchParams.set("access_token", shortLivedToken);

  const response = await fetch(url, { cache: "no-store" });
  const data = (await response.json().catch(() => ({}))) as InstagramLongLivedTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(data.error?.message || "Não foi possível gerar o token de longa duração.");
  }

  return data;
}

async function tryExchangeForLongLivedToken(shortLivedToken: string, origin: string) {
  try {
    return await exchangeForLongLivedToken(shortLivedToken, origin);
  } catch (error) {
    console.warn("Instagram long-lived token exchange failed. Falling back to short-lived token.", error);
    return null;
  }
}

async function fetchInstagramProfile(accessToken: string) {
  const url = new URL(`https://graph.instagram.com/${getInstagramGraphApiVersion()}/me`);
  url.searchParams.set("fields", "user_id,username,name,account_type,media_count");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url, { cache: "no-store" });
  const data = (await response.json().catch(() => ({}))) as InstagramProfileResponse;
  const instagramUserId = data.user_id || data.id;

  if (!response.ok || !instagramUserId) {
    throw new Error(data.error?.message || "Não foi possível ler o perfil Instagram conectado.");
  }

  return {
    ...data,
    id: instagramUserId,
  };
}

export async function connectInstagramAccount(userId: string, code: string, origin: string) {
  const shortLived = await exchangeCodeForShortLivedToken(code, origin);
  const longLived = await tryExchangeForLongLivedToken(shortLived.access_token!, origin);
  const token = longLived?.access_token || shortLived.access_token!;
  const tokenType = longLived?.token_type || shortLived.token_type || "short_lived";
  const expiresIn =
    typeof longLived?.expires_in === "number"
      ? longLived.expires_in
      : typeof shortLived.expires_in === "number"
        ? shortLived.expires_in
        : 60 * 60;
  const profile = await fetchInstagramProfile(token);
  const config = getInstagramOAuthConfig(origin);

  const { supabase, error } = await createAdminClient();
  if (error || !supabase) {
    throw new Error("Configuração Supabase de backend ausente.");
  }

  const expiresAt =
    typeof expiresIn === "number"
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

  const { error: upsertError } = await supabase.from("instagram_accounts").upsert(
    {
      user_id: userId,
      instagram_user_id: profile.id,
      username: profile.username || null,
      account_type: profile.account_type || null,
      media_count: profile.media_count ?? null,
      access_token: token,
      token_type: tokenType,
      scope: config.scope,
      expires_at: expiresAt,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (upsertError) {
    console.error("Error saving Instagram account:", upsertError);
    throw new Error("Não foi possível salvar a conta Instagram conectada.");
  }
}

export async function getInstagramAccountStatus(userId: string): Promise<InstagramAccountStatus> {
  const { supabase, error } = await createAdminClient();
  if (error || !supabase) return { connected: false };

  const { data, error: accountError } = await supabase
    .from("instagram_accounts")
    .select("instagram_user_id, username, account_type, media_count, expires_at, connected_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (accountError || !data) return { connected: false };

  return {
    connected: true,
    account: {
      instagramUserId: data.instagram_user_id,
      username: data.username,
      accountType: data.account_type,
      mediaCount: data.media_count,
      expiresAt: data.expires_at,
      connectedAt: data.connected_at,
    },
  };
}

export async function disconnectInstagramAccount(userId: string) {
  const { supabase, error } = await createAdminClient();
  if (error || !supabase) {
    throw new Error("Configuração Supabase de backend ausente.");
  }

  const { error: deleteError } = await supabase
    .from("instagram_accounts")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    console.error("Error disconnecting Instagram account:", deleteError);
    throw new Error("Não foi possível remover a conexão do Instagram.");
  }
}
