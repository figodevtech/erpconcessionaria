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
      .from("vehicle_videos")
      .select("*")
      .eq("vehicle_id", Number(vehicleId));

    if (error) {
      console.error("Error fetching vehicle videos:", error);
      return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("Unexpected error in /api/vehicles/videos GET:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
 
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user for security
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { vehicle_id, url, type } = body;

    if (!vehicle_id || !url || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("vehicle_videos")
      .upsert({
        vehicle_id: Number(vehicle_id),
        url,
        type
      }, { onConflict: 'vehicle_id,type' })
      .select()
      .single();

    if (error) {
      console.error("Error upserting vehicle video:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Unexpected error in /api/vehicles/videos POST:", err);
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
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("vehicle_videos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting vehicle video:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected error in /api/vehicles/videos DELETE:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
