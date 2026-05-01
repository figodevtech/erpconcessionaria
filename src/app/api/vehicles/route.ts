import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const id = searchParams.get('id');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const supabase = await createClient();

    let query = supabase
      .from("vehicles")
      .select("*, vehicle_images(*)", { count: "exact" })
      .eq("deleted", false);

    // Filter by ID if provided
    if (id) {
      query = query.eq('id', id);
    }

    // Filter by status if provided
    if (status && status !== 'Todos') {
      query = query.eq('status', status);
    }

    // Filter by search string (brand, model, plate, chassi, renavam, color)
    if (search) {
      query = query.or(`brand.ilike.%${search}%,model.ilike.%${search}%,plate.ilike.%${search}%,chassi.ilike.%${search}%,renavam.ilike.%${search}%,color.ilike.%${search}%,version.ilike.%${search}%`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching vehicles:", error);
      return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 });
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    // Enforce sort_order for vehicle images since Supabase nested relationship fetches do not guarantee order
    const formattedData = data?.map(vehicle => {
      let sortedImages = vehicle.vehicle_images;
      if (Array.isArray(sortedImages)) {
        sortedImages = [...sortedImages].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      }
      return {
        ...vehicle,
        vehicle_images: sortedImages
      };
    }) || [];

    return NextResponse.json({
      data: formattedData,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages
      }
    });

  } catch (err) {
    console.error("Unexpected error in /api/vehicles GET:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user for created_by
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from("vehicles")
      .insert([
        {
          ...body,
          created_by: user.id
        }
      ])
      .select();

    if (error) {
      console.error("Error creating vehicle:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data?.[0] || null);
  } catch (err) {
    console.error("Unexpected error in /api/vehicles POST:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user for updated_by
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Vehicle ID is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("vehicles")
      .update({
        ...updateData,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq("id", Number(id))
      .select();

    if (error) {
      console.error("Error updating vehicle:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (err) {
    console.error("Unexpected error in /api/vehicles PATCH:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Vehicle ID is required" }, { status: 400 });
    }

    // Soft delete: set deleted = true
    const { data, error } = await supabase
      .from("vehicles")
      .update({
        deleted: true,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq("id", Number(id))
      .select();

    if (error) {
      console.error("Error deleting vehicle:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Veículo excluído com sucesso" });
  } catch (err) {
    console.error("Unexpected error in /api/vehicles DELETE:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
