import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  getInstagramAccessTokenForUser,
  InstagramApiError,
  listAuthorizedPosts,
} from "@/lib/instagram/api";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Faça login para listar postagens." }, { status: 401 });
    }

    const accessToken = await getInstagramAccessTokenForUser(user.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Conta Instagram não conectada." },
        { status: 409 },
      );
    }

    const posts = await listAuthorizedPosts(accessToken);
    return NextResponse.json({ posts });
  } catch (error) {
    if (error instanceof InstagramApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Não foi possível listar as postagens do Instagram." },
      { status: 500 },
    );
  }
}
