import { createAdminClient } from "@/utils/supabase/server";

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
  };
}

interface InstagramProfileResponse {
  id?: string;
  username?: string;
  account_type?: string;
  media_count?: number;
  error?: {
    message?: string;
  };
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

async function fetchInstagramProfile(accessToken: string) {
  const url = new URL("https://graph.instagram.com/me");
  url.searchParams.set("fields", "id,username,account_type,media_count");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url, { cache: "no-store" });
  const data = (await response.json().catch(() => ({}))) as InstagramProfileResponse;

  if (!response.ok || !data.id) {
    throw new Error(data.error?.message || "Não foi possível ler o perfil Instagram conectado.");
  }

  return data;
}

export async function connectInstagramAccount(userId: string, code: string, origin: string) {
  const shortLived = await exchangeCodeForShortLivedToken(code, origin);
  const longLived = await exchangeForLongLivedToken(shortLived.access_token!, origin);
  const profile = await fetchInstagramProfile(longLived.access_token!);
  const config = getInstagramOAuthConfig(origin);

  const { supabase, error } = await createAdminClient();
  if (error || !supabase) {
    throw new Error("Configuração Supabase de backend ausente.");
  }

  const expiresAt =
    typeof longLived.expires_in === "number"
      ? new Date(Date.now() + longLived.expires_in * 1000).toISOString()
      : null;

  const { error: upsertError } = await supabase.from("instagram_accounts").upsert(
    {
      user_id: userId,
      instagram_user_id: profile.id,
      username: profile.username || null,
      account_type: profile.account_type || null,
      media_count: profile.media_count ?? null,
      access_token: longLived.access_token,
      token_type: longLived.token_type || null,
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
