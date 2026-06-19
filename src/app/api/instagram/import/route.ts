import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/utils/supabase/server";
import { downloadInstagramImage, extensionFromContentType, InstagramImageDownloadError } from "@/lib/instagram/download-instagram-image";
import { findImagesByShortcode, getInstagramAccessTokenForUser, InstagramApiError } from "@/lib/instagram/api";
import {
  extractInstagramImagesFromPublicPost,
  InstagramPublicExtractionError,
  parseInstagramPostUrl,
} from "@/lib/instagram/extract-instagram-images";
import type { InstagramImportResponse } from "@/types/instagram";

const MAX_IMPORT_IMAGES = 10;

const importImageSchema = z.object({
  id: z.string().trim().min(1).optional(),
  url: z.string().url(),
  index: z.number().int().min(0).max(100),
});

const importSchema = z.object({
  postUrl: z.string().trim().min(1),
  images: z.array(importImageSchema).min(1).max(MAX_IMPORT_IMAGES),
  vehicleId: z.union([z.string(), z.number()]).optional(),
  startSortOrder: z.number().int().min(0).optional(),
});

function normalizeVehicleId(value: string | number | undefined) {
  if (value === undefined || value === "") return null;
  const vehicleId = Number(value);
  return Number.isInteger(vehicleId) && vehicleId > 0 ? vehicleId : null;
}

async function getNextVehicleImageSortOrder(
  adminSupabase: NonNullable<Awaited<ReturnType<typeof createAdminClient>>["supabase"]>,
  vehicleId: number,
) {
  const { data, error } = await adminSupabase
    .from("vehicle_images")
    .select("sort_order")
    .eq("vehicle_id", vehicleId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return typeof data?.sort_order === "number" ? data.sort_order + 1 : 0;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Faça login para importar imagens." },
        { status: 401 },
      );
    }

    const parsedBody = importSchema.safeParse(await request.json().catch(() => null));
    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, message: "Dados inválidos para importar imagens." },
        { status: 400 },
      );
    }

    const { shortcode } = parseInstagramPostUrl(parsedBody.data.postUrl);
    const vehicleId = normalizeVehicleId(parsedBody.data.vehicleId);
    if (parsedBody.data.vehicleId !== undefined && !vehicleId) {
      return NextResponse.json(
        { success: false, message: "Veículo inválido para vincular as imagens." },
        { status: 400 },
      );
    }

    const uniqueRequestedImages = Array.from(
      new Map(
        parsedBody.data.images.map((image) => [
          image.id || `${image.index}:${image.url}`,
          image,
        ]),
      ).values(),
    );

    if (uniqueRequestedImages.length === 0) {
      return NextResponse.json(
        { success: false, message: "Selecione pelo menos uma imagem para importar." },
        { status: 400 },
      );
    }

    let allowedImages: Map<string, { id?: string; url: string; index: number }>;
    const accessToken = await getInstagramAccessTokenForUser(user.id).catch((error) => {
      if (error instanceof InstagramApiError && error.status === 409) return null;
      throw error;
    });

    if (accessToken) {
      const authorizedImages = await findImagesByShortcode(shortcode, accessToken);
      allowedImages = new Map(
        authorizedImages.map((image, index) => [
          image.id,
          {
            id: image.id,
            url: image.media_url || image.url || "",
            index,
          },
        ]),
      );
    } else {
      const extracted = await extractInstagramImagesFromPublicPost(parsedBody.data.postUrl);
      allowedImages = new Map(
        extracted.images.map((image) => [
          `${image.index}:${image.url}`,
          {
            id: image.id,
            url: image.url,
            index: image.index,
          },
        ]),
      );
    }

    const resolvedImages = uniqueRequestedImages.map((image) =>
      allowedImages.get(accessToken && image.id ? image.id : `${image.index}:${image.url}`),
    );
    const invalidImage = resolvedImages.some((image) => !image?.url);
    if (invalidImage) {
      return NextResponse.json(
        { success: false, message: "Uma ou mais imagens não foram confirmadas no post público informado." },
        { status: 403 },
      );
    }

    const { supabase: adminSupabase, error: adminError } = await createAdminClient();
    if (adminError || !adminSupabase) {
      return NextResponse.json(
        { success: false, message: "Configuração Supabase de backend ausente." },
        { status: 500 },
      );
    }

    const bucket = process.env.SUPABASE_BUCKET_IMPORTS || process.env.SUPABASE_STORAGE_BUCKET || "vehicles";
    const files: NonNullable<InstagramImportResponse["files"]> = [];
    const baseSortOrder = vehicleId
      ? parsedBody.data.startSortOrder ?? await getNextVehicleImageSortOrder(adminSupabase, vehicleId)
      : 0;

    for (const [importIndex, requestedImage] of resolvedImages.entries()) {
      if (!requestedImage?.url) continue;

      const { bytes, contentType } = await downloadInstagramImage(requestedImage.url);
      const extension = extensionFromContentType(contentType);
      if (!extension) {
        return NextResponse.json(
          { success: false, message: "Formato de imagem não suportado." },
          { status: 422 },
        );
      }

      const path = `instagram/${shortcode}/${Date.now()}-${requestedImage.index}.${extension}`;
      const { error: uploadError } = await adminSupabase.storage.from(bucket).upload(path, bytes, {
        contentType,
        upsert: false,
      });

      if (uploadError) {
        return NextResponse.json(
          { success: false, message: "Erro ao salvar imagem no Supabase Storage." },
          { status: 500 },
        );
      }

      const {
        data: { publicUrl },
      } = adminSupabase.storage.from(bucket).getPublicUrl(path);

      let vehicleImage: unknown;
      if (vehicleId) {
        const { data, error } = await adminSupabase
          .from("vehicle_images")
          .insert({
            vehicle_id: vehicleId,
            image_url: publicUrl,
            sort_order: baseSortOrder + importIndex,
            active: true,
            file_size: bytes.byteLength,
            mime_type: contentType,
          })
          .select()
          .single();

        if (error) {
          return NextResponse.json(
            {
              success: false,
              message: "Imagem salva no Storage, mas não foi possível vinculá-la ao veículo.",
            },
            { status: 500 },
          );
        }

        vehicleImage = data;
      }

      files.push({ path, publicUrl, vehicleImage });
    }

    return NextResponse.json({
      success: true,
      files,
      imported: files.map((file, index) => ({
        originalId: resolvedImages[index]?.id || `img_${(resolvedImages[index]?.index ?? index) + 1}`,
        path: file.path,
        publicUrl: file.publicUrl,
        vehicleImage: file.vehicleImage,
      })),
    });
  } catch (error) {
    if (error instanceof InstagramPublicExtractionError || error instanceof InstagramImageDownloadError) {
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
      { success: false, message: "Não foi possível importar as imagens selecionadas." },
      { status: 500 },
    );
  }
}
