import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/utils/supabase/server";
import { findVideoByShortcode, getInstagramAccessTokenForUser, InstagramApiError } from "@/lib/instagram/api";
import { parseInstagramPostUrl } from "@/lib/instagram/extract-instagram-images";
import {
  downloadInstagramVideo,
  extensionFromVideoContentType,
  InstagramVideoDownloadError,
} from "@/lib/instagram/download-instagram-video";

const importVideoSchema = z.object({
  postUrl: z.string().trim().min(1),
  vehicleId: z.union([z.string(), z.number()]),
  type: z.literal("shorts"),
});

function normalizeVehicleId(value: string | number) {
  const vehicleId = Number(value);
  return Number.isInteger(vehicleId) && vehicleId > 0 ? vehicleId : null;
}

function storagePathFromPublicUrl(publicUrl: string) {
  const match = publicUrl.match(/\/storage\/v1\/object\/public\/vehicles\/(.+)$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Faça login para importar vídeos." }, { status: 401 });
    }

    const parsedBody = importVideoSchema.safeParse(await request.json().catch(() => null));
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Dados inválidos para importar vídeo." }, { status: 400 });
    }

    const vehicleId = normalizeVehicleId(parsedBody.data.vehicleId);
    if (!vehicleId) {
      return NextResponse.json({ error: "Veículo inválido para vincular o vídeo." }, { status: 400 });
    }

    const { shortcode } = parseInstagramPostUrl(parsedBody.data.postUrl);
    const accessToken = await getInstagramAccessTokenForUser(user.id);
    if (!accessToken) {
      return NextResponse.json({ error: "Conta Instagram não conectada." }, { status: 409 });
    }

    const video = await findVideoByShortcode(shortcode, accessToken);
    const { bytes, contentType } = await downloadInstagramVideo(video.media_url);
    const extension = extensionFromVideoContentType(contentType);
    if (!extension) {
      return NextResponse.json({ error: "Formato de vídeo não suportado." }, { status: 422 });
    }

    const { supabase: adminSupabase, error: adminError } = await createAdminClient();
    if (adminError || !adminSupabase) {
      return NextResponse.json({ error: "Configuração Supabase de backend ausente." }, { status: 500 });
    }

    const { data: existingVideo } = await supabase
      .from("vehicle_videos")
      .select("id,url")
      .eq("vehicle_id", vehicleId)
      .eq("type", "shorts")
      .maybeSingle();

    const path = `${vehicleId}/videos/shorts/instagram-${video.id}-${Date.now()}.${extension}`;
    const { error: uploadError } = await adminSupabase.storage.from("vehicles").upload(path, bytes, {
      contentType,
      upsert: false,
    });

    if (uploadError) {
      return NextResponse.json({ error: "Erro ao salvar vídeo no Supabase Storage." }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = adminSupabase.storage.from("vehicles").getPublicUrl(path);

    const { data: record, error: upsertError } = await supabase
      .from("vehicle_videos")
      .upsert(
        {
          vehicle_id: vehicleId,
          url: publicUrl,
          type: "shorts",
        },
        { onConflict: "vehicle_id,type" },
      )
      .select()
      .single();

    if (upsertError) {
      await adminSupabase.storage.from("vehicles").remove([path]);
      return NextResponse.json({ error: "Vídeo salvo, mas não foi possível vincular ao veículo." }, { status: 500 });
    }

    const existingPath = existingVideo?.url ? storagePathFromPublicUrl(existingVideo.url) : null;
    if (existingPath && existingPath !== path) {
      await adminSupabase.storage.from("vehicles").remove([existingPath]);
    }

    return NextResponse.json({
      success: true,
      video: {
        ...record,
        path,
      },
    });
  } catch (error) {
    if (error instanceof InstagramApiError || error instanceof InstagramVideoDownloadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Não foi possível importar o vídeo do Instagram." }, { status: 500 });
  }
}
