import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

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

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user for security
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Image ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("vehicle_images")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting vehicle image:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected error in /api/vehicles/images DELETE:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user for security
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { images } = await request.json();

    if (!images || !Array.isArray(images)) {
      return NextResponse.json({ error: "Invalid images data" }, { status: 400 });
    }

    // Perform bulk update
    for (const img of images) {
      const { error } = await supabase
        .from("vehicle_images")
        .update({ sort_order: img.sort_order })
        .eq("id", img.id);
      
      if (error) {
        console.error(`Error updating image ${img.id}:`, error);
        throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected error in /api/vehicles/images PATCH:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
