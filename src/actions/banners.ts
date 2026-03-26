"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export type Banner = {
  id: string
  name: string
  link: string | null
  order: number
  image_url: string
  active: boolean
  created_at: string
}

export async function getBannersAction() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .order("order", { ascending: true })

  if (error) return { success: false, error: error.message }
  return { success: true, data: data as Banner[] }
}

export async function upsertBannerAction(banner: Partial<Banner>) {
  const supabase = await createClient()
  
  // If it's a new banner and order isn't provided, get the max order
  if (!banner.id) {
    if (banner.order === undefined) {
      const { data: maxOrderData } = await supabase
        .from("banners")
        .select("order")
        .order("order", { ascending: false })
        .limit(1)
        .maybeSingle()
      
      banner.order = (maxOrderData?.order ?? -1) + 1
    }

    const { data, error } = await supabase
      .from("banners")
      .insert(banner)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath("/marketing/banners")
    return { success: true, data: data as Banner }
  } else {
    // It's an update
    const { data, error } = await supabase
      .from("banners")
      .update(banner)
      .eq("id", banner.id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath("/marketing/banners")
    return { success: true, data: data as Banner }
  }
}

export async function deleteBannerAction(id: string, imageUrl: string) {
  const supabase = await createClient()

  // 1. Delete from DB
  const { error: dbError } = await supabase
    .from("banners")
    .delete()
    .eq("id", id)

  if (dbError) return { success: false, error: dbError.message }

  // 2. Delete from Storage
  // URL format: https://[project].supabase.co/storage/v1/object/public/website/banners/[filename]
  const pathMatch = imageUrl.match(/website\/(.+)/)
  if (pathMatch) {
    const path = decodeURIComponent(pathMatch[1])
    const { error: storageError } = await supabase.storage.from("website").remove([path])
    if (storageError) {
      console.warn("Storage delete warning:", storageError.message)
    }
  }

  revalidatePath("/marketing/banners")
  return { success: true }
}

export async function updateBannersOrderAction(banners: { id: string, order: number }[]) {
  const supabase = await createClient()

  // Use a transaction-like approach by updating each banner
  // Since we can't do bulk updates with partial data in a single call easily without upsert,
  // we loop through them. Given it's usually 5-10 banners, it's fine for a server action.
  for (const b of banners) {
    const { error } = await supabase
      .from("banners")
      .update({ order: b.order })
      .eq("id", b.id)
    
    if (error) return { success: false, error: error.message }
  }

  revalidatePath("/marketing/banners")
  return { success: true }
}

export async function toggleBannerActiveAction(id: string, active: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("banners")
    .update({ active })
    .eq("id", id)

  if (error) return { success: false, error: error.message }
  
  revalidatePath("/marketing/banners")
  return { success: true }
}
