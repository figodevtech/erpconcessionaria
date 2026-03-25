"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function getRolesAction(params?: {
  page?: number,
  pageSize?: number,
  search?: string
}) {
  const supabase = await createClient()
  
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const search = params?.search || ""

  let query = supabase
    .from("profiles")
    .select("*, role_permissions(permission_id)", { count: "exact" })

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data, error, count } = await query
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order('id', { ascending: true })

  if (error) return { success: false, error: error.message }
  return { success: true, data, count: count || 0 }
}

export async function getPermissionsAction() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("permissions")
    .select("*")
    .order("module, action")

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function updateRolePermissionsAction(roleId: number, permissionIds: string[]) {
  const supabase = await createClient()

  // 1. Delete existing permissions
  const { error: deleteError } = await supabase
    .from("role_permissions")
    .delete()
    .eq("role_id", roleId)

  if (deleteError) return { success: false, error: deleteError.message }

  // 2. Insert new permissions
  if (permissionIds.length > 0) {
    const { error: insertError } = await supabase
      .from("role_permissions")
      .insert(permissionIds.map(id => ({ role_id: roleId, permission_id: id })))

    if (insertError) return { success: false, error: insertError.message }
  }

  revalidatePath("/configuracoes/perfis")
  return { success: true }
}

export async function createRoleAction(name: string, description: string, permissionIds: string[]) {
  const supabase = await createClient()

  // 1. Create Profile
  const { data: role, error: roleError } = await supabase
    .from("profiles")
    .insert({ name, description })
    .select()
    .single()

  if (roleError) return { success: false, error: roleError.message }

  // 2. Assign initial permissions if any
  if (permissionIds.length > 0) {
    const { error: permError } = await supabase
      .from("role_permissions")
      .insert(permissionIds.map(id => ({ role_id: role.id, permission_id: id })))

    if (permError) return { success: false, error: "Role created, but permissions failed: " + permError.message }
  }

  revalidatePath("/configuracoes/perfis")
  return { success: true }
}

export async function deleteRoleAction(roleId: number) {
  const supabase = await createClient()

  // Note: Check if users are using this role first? 
  // In a real app we might want to prevent deletion if users are assigned.
  // For now we'll attempt it. Foreign key constraints in DB might block it.
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", roleId)

  if (error) {
    if (error.code === '23503') {
      return { success: false, error: "Não é possível excluir: existem usuários vinculados a este cargo." }
    }
    return { success: false, error: error.message }
  }

  revalidatePath("/configuracoes/perfis")
  return { success: true }
}
