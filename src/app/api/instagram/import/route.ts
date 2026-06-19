import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/utils/supabase/server";
import {
  findAuthorizedImagesByIds,
  getInstagramAccessTokenForUser,
  InstagramApiError,
} from "@/lib/instagram/api";
import type { InstagramImportResponse, InstagramMediaImage } from "@/types/instagram";

const MAX_IMPORT_IMAGES = 10;

function extensionFromContentType(contentType: string) {
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return null;
}

function isValidImportImage(value: unknown): value is InstagramMediaImage {
  if (!value || typeof value !== "object") return false;
  const image = value as Partial<InstagramMediaImage>;
  return typeof image.id === "string" && image.id.trim().length > 0;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Faça login para importar imagens." }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      images?: unknown;
      vehicleId?: unknown;
    } | null;
    const requestedImages = Array.isArray(body?.images) ? body.images.filter(isValidImportImage) : [];
    const vehicleId =
      typeof body?.vehicleId === "string" || typeof body?.vehicleId === "number"
        ? Number(body.vehicleId)
        : null;

    if (requestedImages.length === 0) {
      return NextResponse.json({ error: "Selecione pelo menos uma imagem para importar." }, { status: 400 });
    }

    if (requestedImages.length > MAX_IMPORT_IMAGES) {
      return NextResponse.json(
        { error: `Importe no máximo ${MAX_IMPORT_IMAGES} imagens por vez.` },
        { status: 400 },
      );
    }

    if (vehicleId !== null && (!Number.isInteger(vehicleId) || vehicleId <= 0)) {
      return NextResponse.json({ error: "Veículo inválido para vincular as imagens." }, { status: 400 });
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

    const authorizedImages = await findAuthorizedImagesByIds(
      requestedImages.map((image) => image.id),
      accessToken,
    );
    const authorizedIds = new Set(authorizedImages.map((image) => image.id));

    if (authorizedImages.length !== requestedImages.length) {
      return NextResponse.json(
        { error: "Uma ou mais imagens selecionadas não pertencem à conta Instagram conectada." },
        { status: 403 },
      );
    }

    const { supabase: adminSupabase, error: adminError } = await createAdminClient();
    if (adminError || !adminSupabase) {
      return NextResponse.json({ error: "Configuração Supabase de backend ausente." }, { status: 500 });
    }

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "vehicles";
    const imported: InstagramImportResponse["imported"] = [];

    for (const image of authorizedImages) {
      if (!authorizedIds.has(image.id)) continue;

      const imageResponse = await fetch(image.media_url, { cache: "no-store" });
      if (!imageResponse.ok) {
        return NextResponse.json(
          { error: `Erro ao baixar imagem ${image.id} do Instagram.` },
          { status: 502 },
        );
      }

      const contentType = imageResponse.headers.get("content-type");
      if (!contentType) {
        return NextResponse.json(
          { error: `Imagem ${image.id} sem content-type válido.` },
          { status: 422 },
        );
      }

      const extension = extensionFromContentType(contentType);
      if (!extension || !contentType.startsWith("image/")) {
        return NextResponse.json(
          { error: `Imagem ${image.id} possui formato não suportado.` },
          { status: 422 },
        );
      }

      const bytes = await imageResponse.arrayBuffer();
      const timestamp = Date.now();
      const path = `instagram/${user.id}/${image.id}-${timestamp}.${extension}`;
      const { error: uploadError } = await adminSupabase.storage.from(bucket).upload(path, bytes, {
        contentType,
        upsert: false,
      });

      if (uploadError) {
        console.error("Error uploading Instagram image:", uploadError);
        return NextResponse.json(
          { error: `Erro ao salvar imagem ${image.id} no Supabase Storage.` },
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
            sort_order: 0,
            active: true,
            file_size: bytes.byteLength,
            mime_type: contentType.slice(0, 50),
          })
          .select()
          .single();

        if (error) {
          console.error("Error saving imported image in vehicle_images:", error);
          return NextResponse.json(
            { error: `Imagem salva no Storage, mas não foi possível vinculá-la ao veículo.` },
            { status: 500 },
          );
        }

        vehicleImage = data;
      }

      // TODO: se houver uma tabela genérica de anexos/mídia no futuro,
      // salvar também a referência da imagem importada aqui.
      imported.push({
        originalId: image.id,
        path,
        publicUrl,
        vehicleImage,
      });
    }

    return NextResponse.json({ success: true, imported });
  } catch (error) {
    console.error("Unexpected error in /api/instagram/import:", error);

    if (error instanceof InstagramApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Não foi possível importar as imagens do Instagram." },
      { status: 500 },
    );
  }
}
