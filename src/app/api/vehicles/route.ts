import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const supabase = await createClient();

    let query = supabase
      .from("vehicles")
      .select("*", { count: "exact" })
      .eq("deleted", false);

    // Filter by status if provided
    if (status && status !== 'Todos') {
      query = query.eq('status', status);
    }

    // Filter by search string (brand, model, plate, color)
    if (search) {
      query = query.or(`brand.ilike.%${search}%,model.ilike.%${search}%,plate.ilike.%${search}%,color.ilike.%${search}%,version.ilike.%${search}%`);
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

    return NextResponse.json({
      data: data || [],
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages
      }
    });

  } catch (err) {
    console.error("Unexpected error in /api/vehicles:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
