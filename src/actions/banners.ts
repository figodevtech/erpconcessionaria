"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { publishSiteChanges } from "@/lib/site-revalidation"
import { getVerifiedUser, checkPermission } from "@/utils/permissions"

async function canChangeBanners(permission: string) {
  return Boolean(await getVerifiedUser()) && await checkPermission(permission)
}

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
  if (!await canChangeBanners(banner.id ? "banners:update" : "banners:create")) {
    return { success: false, error: "Sem permissão para salvar banners." }
  }
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
    const siteSync = await publishSiteChanges({ topics: ["banners"] })
    return { success: true, data: data as Banner, siteSync }
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
    const siteSync = await publishSiteChanges({ topics: ["banners"] })
    return { success: true, data: data as Banner, siteSync }
  }
}

export async function deleteBannerAction(id: string, imageUrl: string) {
  if (!await canChangeBanners("banners:delete")) return { success: false, error: "Sem permissão para excluir banners." }
  const supabase = await createClient()

  // 1. Delete from DB
  const { data: deletedBanners, error: dbError } = await supabase
    .from("banners")
    .delete()
    .eq("id", id)
    .select("id")

  if (dbError) return { success: false, error: dbError.message }
  if (!deletedBanners?.length) return { success: false, error: "Banner não encontrado ou sem permissão para excluir." }
  const siteSync = await publishSiteChanges({ topics: ["banners"] })

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
  return { success: true, siteSync }
}

export async function updateBannersOrderAction(banners: { id: string, order: number }[]) {
  if (!await canChangeBanners("banners:update")) return { success: false, error: "Sem permissão para ordenar banners." }
  const supabase = await createClient()
  let changed = false

  // Use a transaction-like approach by updating each banner
  // Since we can't do bulk updates with partial data in a single call easily without upsert,
  // we loop through them. Given it's usually 5-10 banners, it's fine for a server action.
  for (const b of banners) {
    const { data, error } = await supabase
      .from("banners")
      .update({ order: b.order })
      .eq("id", b.id)
      .select("id")
    
    if (error || !data?.length) {
      const siteSync = changed ? await publishSiteChanges({ topics: ["banners"] }) : undefined
      return { success: false, error: error?.message || "Banner não encontrado ou sem permissão para alterar.", siteSync }
    }
    changed = true
  }

  revalidatePath("/marketing/banners")
  const siteSync = changed ? await publishSiteChanges({ topics: ["banners"] }) : undefined
  return { success: true, siteSync }
}

export async function toggleBannerActiveAction(id: string, active: boolean) {
  if (!await canChangeBanners("banners:update")) return { success: false, error: "Sem permissão para alterar banners." }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("banners")
    .update({ active })
    .eq("id", id)
    .select("id")

  if (error) return { success: false, error: error.message }
  if (!data?.length) return { success: false, error: "Banner não encontrado ou sem permissão para alterar." }
  
  revalidatePath("/marketing/banners")
  const siteSync = await publishSiteChanges({ topics: ["banners"] })
  return { success: true, siteSync }
}
