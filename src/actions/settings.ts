"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export type AppSettings = {
  id: string;
  ai_description_monthly_limit: number;
  ai_description_usage_count: number;
  ai_description_last_reset: string;
  banner_interval: number;
  banner_duration: number;
  created_at: string;
  updated_at: string;
}

export async function getAppSettingsAction() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data: data as AppSettings }
}

export async function updateAppSettingsAction(settings: Partial<AppSettings>) {
  const supabase = await createClient()
  
  // Since it's a singleton-ish table, we update the first row (or any row if it's truly singleton)
  // We'll update by id if provided, otherwise just update the first row.
  let query = supabase.from("app_settings").update(settings);
  
  if (settings.id) {
    query = query.eq("id", settings.id);
  } else {
    // Fallback: update the first one found if id is missing
    const { data: firstRow } = await supabase.from("app_settings").select("id").limit(1).single();
    if (firstRow) {
      query = query.eq("id", firstRow.id);
    }
  }

  const { data, error } = await query.select().single();

  if (error) return { success: false, error: error.message }
  
  revalidatePath("/marketing/banners")
  return { success: true, data: data as AppSettings }
}
