import { NextResponse } from "next/server";
import { disconnectInstagramAccount } from "@/lib/instagram/oauth";
import { getVerifiedUser, checkPermission } from "@/utils/permissions";

export async function POST() {
  const user = await getVerifiedUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para remover a conexão do Instagram." }, { status: 401 });
  }

  const canUpdateAccounts = await checkPermission("settings:accounts:update");
  if (!canUpdateAccounts) {
    return NextResponse.json({ error: "Você não tem permissão para remover contas conectadas." }, { status: 403 });
  }

  try {
    await disconnectInstagramAccount(user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível remover a conexão do Instagram.",
      },
      { status: 500 },
    );
  }
}
