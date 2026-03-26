"use server"

import { revalidatePath } from "next/cache"

export async function createUserAction(formData: FormData) {
  const idValue = formData.get("id") as string | null
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string
  const profile_id_raw = formData.get("profile_id") as string
  const profile_id = parseInt(profile_id_raw)

  if (isNaN(profile_id)) {
    return { error: "O cargo (perfil) é obrigatório." }
  }

  const { createAdminClient } = await import("@/utils/supabase/server")
  const { supabase, error: adminError } = await createAdminClient()

  if (adminError || !supabase) {
    return { error: "Erro de configuração: Chave Service Role não encontrada no servidor." }
  }

  let userId = idValue

  if (userId) {
    // --- UPDATE FLOW ---
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { name }
    })
    if (authError) return { error: "Auth Update: " + authError.message }

    const { error: profileError } = await supabase
      .from("users")
      .update({ name, profile_id })
      .eq("id", userId)

    if (profileError) return { error: "Database Update: " + profileError.message }

  } else {
    // --- CREATE FLOW ---
    
    // 1. Try to create the user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    })

    if (authError) {
      // If user already exists, let's try to get their ID to repair the public.users entry
      if (authError.message.toLowerCase().includes("already registered") || authError.status === 422) {
        const { data: existingData, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) return { error: "Auth List: " + listError.message }
        
        const existingUser = existingData.users.find(u => u.email === email)
        if (!existingUser) return { error: "Auth: Usuário consta como registrado mas não foi localizado." }
        
        userId = existingUser.id
      } else {
        return { error: "Auth Create: " + authError.message }
      }
    } else {
      userId = authData.user.id
    }

    // 2. Upsert into public.users (using upsert ensures we fix incomplete registrations)
    const { error: profileError } = await supabase
      .from("users")
      .upsert({
        id: userId,
        email,
        name,
        profile_id,
        active: true
      })

    if (profileError) return { error: "Database Sync: " + profileError.message }
  }

  revalidatePath("/configuracoes/usuarios")
  return { success: true }
}

export async function deleteUserAction(userId: string) {
  const { createAdminClient } = await import("@/utils/supabase/server")
  const { supabase, error: adminError } = await createAdminClient()

  if (adminError || !supabase) {
    return { error: "Erro de configuração: Chave Service Role não encontrada no servidor." }
  }

  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) return { error: error.message }

  revalidatePath("/configuracoes/usuarios")
  return { success: true }
}

export async function listUsersAction(params?: { 
  page?: number, 
  pageSize?: number, 
  search?: string 
}) {
  const { createClient } = await import("@/utils/supabase/server")
  const supabase = await createClient()

  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const search = params?.search || ""

  let query = supabase
    .from("users")
    .select("*, profile:profiles(name)", { count: "exact" })
    .eq('active', true)

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data: users, error, count } = await query
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order('name', { ascending: true })

  if (error) return { success: false, error: error.message }
  return { success: true, data: users, count: count || 0 }
}

export async function getUserKPIsAction() {
  const { createClient } = await import("@/utils/supabase/server")
  const supabase = await createClient()

  const { data: usersData, error } = await supabase
    .from("users")
    .select("active, profile_id")

  if (error) return { success: false, error: error.message }

  const users = usersData || []
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.active).length
  const inactiveUsers = totalUsers - activeUsers
  const uniqueProfiles = new Set(users.map(u => u.profile_id)).size

  return {
    success: true,
    data: {
      totalUsers,
      activeUsers,
      inactiveUsers,
      uniqueProfiles
    }
  }
}
