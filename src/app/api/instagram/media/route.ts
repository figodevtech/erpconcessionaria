import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { extractInstagramShortcode } from "@/lib/instagram/extract-shortcode";
import {
  findImagesByShortcode,
  getInstagramAccessTokenForUser,
  InstagramApiError,
} from "@/lib/instagram/api";
import type { InstagramMediaResponse } from "@/types/instagram";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { postUrl?: unknown } | null;
    const postUrl = typeof body?.postUrl === "string" ? body.postUrl : "";
    const shortcode = extractInstagramShortcode(postUrl);

    if (!shortcode) {
      return NextResponse.json(
        { error: "Informe um link válido de post, reel ou IGTV do Instagram." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Faça login para buscar imagens do Instagram." }, { status: 401 });
    }

    const accessToken = await getInstagramAccessTokenForUser(user.id);
    if (!accessToken) {
      return NextResponse.json(
        {
          code: "INSTAGRAM_NOT_CONNECTED",
          error: "Conta Instagram não conectada. Conecte uma conta autorizada antes de importar.",
        },
        { status: 409 },
      );
    }

    const images = await findImagesByShortcode(shortcode, accessToken);
    if (images.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma imagem foi encontrada nesse post. Vídeos são ignorados por enquanto." },
        { status: 404 },
      );
    }

    const response: InstagramMediaResponse = { images };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Unexpected error in /api/instagram/media:", error);

    if (error instanceof InstagramApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Não foi possível buscar as imagens do Instagram." },
      { status: 500 },
    );
  }
}
