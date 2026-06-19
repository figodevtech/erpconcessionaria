import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  getInstagramAccessTokenForUser,
  InstagramApiError,
  listAuthorizedReels,
} from "@/lib/instagram/api";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Faça login para listar shorts." }, { status: 401 });
    }

    const accessToken = await getInstagramAccessTokenForUser(user.id);
    if (!accessToken) {
      return NextResponse.json({ error: "Conta Instagram não conectada." }, { status: 409 });
    }

    const reels = await listAuthorizedReels(accessToken);
    return NextResponse.json({ reels });
  } catch (error) {
    if (error instanceof InstagramApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Não foi possível listar os shorts do Instagram." },
      { status: 500 },
    );
  }
}
