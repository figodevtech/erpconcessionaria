import { NextResponse } from "next/server";
import { getInstagramAccountStatus, getInstagramOAuthConfig } from "@/lib/instagram/oauth";
import { getVerifiedUser, checkAnyPermission } from "@/utils/permissions";

export async function GET(request: Request) {
  const user = await getVerifiedUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para consultar a conta Instagram." }, { status: 401 });
  }

  const canViewAccounts = await checkAnyPermission(["settings:accounts:view", "settings:view"]);
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
