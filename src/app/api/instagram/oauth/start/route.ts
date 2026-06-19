import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { buildInstagramAuthorizationUrl } from "@/lib/instagram/oauth";
import { checkPermission } from "@/utils/permissions";

const STATE_COOKIE = "instagram_oauth_state";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const canUpdateAccounts = await checkPermission("settings:accounts:update");
  if (!canUpdateAccounts) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const state = randomBytes(24).toString("hex");
  const origin = new URL(request.url).origin;
  const { url, error } = buildInstagramAuthorizationUrl(state, origin);

  if (error || !url) {
    const redirectUrl = new URL("/configuracoes/contas", request.url);
    redirectUrl.searchParams.set("instagram_error", error || "Configuração OAuth inválida.");
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.redirect(url);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    maxAge: 10 * 60,
    path: "/",
  });

  return response;
}
