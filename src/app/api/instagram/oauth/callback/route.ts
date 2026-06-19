import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { connectInstagramAccount } from "@/lib/instagram/oauth";

const STATE_COOKIE = "instagram_oauth_state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const targetUrl = new URL("/configuracoes/contas", request.url);

  const error = url.searchParams.get("error") || url.searchParams.get("error_reason");
  const errorDescription = url.searchParams.get("error_description");
  if (error) {
    targetUrl.searchParams.set(
      "instagram_error",
      errorDescription || "A autorização do Instagram foi cancelada.",
    );
    return NextResponse.redirect(targetUrl);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = request.headers
    .get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${STATE_COOKIE}=`))
    ?.split("=")[1];

  if (!code || !state || !cookieState || state !== cookieState) {
    targetUrl.searchParams.set("instagram_error", "Falha de segurança ao validar a conexão do Instagram.");
    const response = NextResponse.redirect(targetUrl);
    response.cookies.delete(STATE_COOKIE);
    return response;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    targetUrl.pathname = "/login";
    const response = NextResponse.redirect(targetUrl);
    response.cookies.delete(STATE_COOKIE);
    return response;
  }

  try {
    await connectInstagramAccount(user.id, code, url.origin);
    targetUrl.searchParams.set("instagram_connected", "1");
  } catch (connectError) {
    console.error("Instagram OAuth callback error:", connectError);
    targetUrl.searchParams.set(
      "instagram_error",
      connectError instanceof Error
        ? connectError.message
        : "Não foi possível conectar a conta Instagram.",
    );
  }

  const response = NextResponse.redirect(targetUrl);
  response.cookies.delete(STATE_COOKIE);
  return response;
}
