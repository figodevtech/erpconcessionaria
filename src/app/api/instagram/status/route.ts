import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getInstagramAccountStatus, getInstagramOAuthConfig } from "@/lib/instagram/oauth";
import { checkPermission } from "@/utils/permissions";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Faça login para consultar a conta Instagram." }, { status: 401 });
  }

  const canViewAccounts =
    (await checkPermission("settings:accounts:view")) || (await checkPermission("settings:view"));
  if (!canViewAccounts) {
    return NextResponse.json({ error: "Você não tem permissão para consultar contas conectadas." }, { status: 403 });
  }

  const origin = new URL(request.url).origin;
  const config = getInstagramOAuthConfig(origin);
  const status = await getInstagramAccountStatus(user.id);

  return NextResponse.json({
    ...status,
    configured: !config.error,
    configError: config.error,
  });
}
