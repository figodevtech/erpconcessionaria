import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { disconnectInstagramAccount } from "@/lib/instagram/oauth";
import { checkPermission } from "@/utils/permissions";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
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
