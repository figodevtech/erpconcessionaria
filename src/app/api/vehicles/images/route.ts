import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { getVerifiedUser } from "@/utils/permissions";
import { publishSiteChanges } from "@/lib/site-revalidation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');

    if (!vehicleId) {
      return NextResponse.json({ error: "Vehicle ID is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vehicle_images")
      .select("*")
      .eq("vehicle_id", Number(vehicleId))
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching vehicle images:", error);
      return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("Unexpected error in /api/vehicles/images GET:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
 
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user for security
    const user = await getVerifiedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { vehicle_id, image_url, url, sort_order, active } = body;

    if (!vehicle_id || (!image_url && !url)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("vehicle_images")
      .insert({
        vehicle_id: Number(vehicle_id),
        image_url: image_url || url,
        sort_order: sort_order || 0,
        active: active !== undefined ? active : true
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting vehicle image:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const siteSync = await publishSiteChanges({ topics: ["vehicles"], vehicleIds: [data.vehicle_id] });
    return NextResponse.json({ ...data, siteSync });
  } catch (err) {
    console.error("Unexpected error in /api/vehicles/images POST:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
 
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user for security
    const user = await getVerifiedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Image ID is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("vehicle_images")
      .delete()
      .eq("id", id)
      .select("vehicle_id");

    if (error) {
      console.error("Error deleting vehicle image:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const siteSync = data?.length
      ? await publishSiteChanges({ topics: ["vehicles"], vehicleIds: data.map((image) => image.vehicle_id) })
      : undefined;
    return NextResponse.json({ success: true, siteSync });
  } catch (err) {
    console.error("Unexpected error in /api/vehicles/images DELETE:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const changedVehicleIds = new Set<number>();
  try {
    const supabase = await createClient();
    
    // Get current user for security
    const user = await getVerifiedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { images } = await request.json();

    if (!Array.isArray(images) || images.length > 200 || images.some((image) => !image || typeof image.id !== "string" || !Number.isSafeInteger(image.sort_order) || image.sort_order < 0)) {
      return NextResponse.json({ error: "Invalid images data" }, { status: 400 });
    }

    // Perform bulk update
    for (const img of images) {
      const { data, error } = await supabase
        .from("vehicle_images")
        .update({ sort_order: img.sort_order })
        .eq("id", img.id)
        .select("vehicle_id");
      
      if (error || !data?.length) {
        console.error(`Error updating image ${img.id}:`, error);
        throw error ?? new Error("Imagem não encontrada ou sem permissão para ordenar.");
      }
      data?.forEach((image) => changedVehicleIds.add(Number(image.vehicle_id)));
    }

    const siteSync = changedVehicleIds.size
      ? await publishSiteChanges({ topics: ["vehicles"], vehicleIds: [...changedVehicleIds] })
      : undefined;
    return NextResponse.json({ success: true, siteSync });
  } catch (err) {
    console.error("Unexpected error in /api/vehicles/images PATCH:", err);
    const siteSync = changedVehicleIds.size
      ? await publishSiteChanges({ topics: ["vehicles"], vehicleIds: [...changedVehicleIds] })
      : undefined;
    return NextResponse.json({ error: "Não foi possível concluir a ordenação das imagens.", siteSync, partial: changedVehicleIds.size > 0 }, { status: 500 });
  }
}
