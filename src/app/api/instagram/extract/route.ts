import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { findImagesByShortcode, getInstagramAccessTokenForUser, InstagramApiError } from "@/lib/instagram/api";
import {
  extractInstagramImagesFromPublicPost,
  InstagramPublicExtractionError,
  parseInstagramPostUrl,
} from "@/lib/instagram/extract-instagram-images";
import type { InstagramExtractResponse } from "@/types/instagram";

const extractSchema = z.object({
  url: z.string().trim().min(1),
});

export async function POST(request: Request) {
  try {
    const body = extractSchema.safeParse(await request.json().catch(() => null));
    if (!body.success) {
      return NextResponse.json(
        { success: false, message: "Informe um link válido do Instagram." },
        { status: 400 },
      );
    }

    const { shortcode } = parseInstagramPostUrl(body.data.url);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const accessToken = await getInstagramAccessTokenForUser(user.id).catch((error) => {
        if (error instanceof InstagramApiError && error.status === 409) return null;
        throw error;
      });

      if (accessToken) {
        const authorizedImages = await findImagesByShortcode(shortcode, accessToken);
        const response: InstagramExtractResponse = {
          success: true,
          postShortcode: shortcode,
          images: authorizedImages.map((image, index) => ({
            id: image.id,
            url: image.media_url || image.url || "",
            index,
            width: image.width,
            height: image.height,
          })).filter((image) => image.url),
        };

        if (response.images.length > 0) return NextResponse.json(response);
      }
    }

    const result = await extractInstagramImagesFromPublicPost(body.data.url);
    const response: InstagramExtractResponse = {
      success: true,
      postShortcode: result.postShortcode,
      images: result.images,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof InstagramPublicExtractionError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status },
      );
    }

    if (error instanceof InstagramApiError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Não foi possível capturar as imagens automaticamente. O Instagram pode ter limitado o acesso público a esta postagem.",
      },
      { status: 500 },
    );
  }
}
