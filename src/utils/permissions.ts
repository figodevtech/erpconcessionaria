import { createClient } from "@/utils/supabase/server"

/**
 * Server-side utility to check if the current user has a specific permission.
 * 
 * @param permission The permission slug to check (e.g., 'vehicles:create')
 * @returns boolean indicating if the user has the permission
 */
export async function checkPermission(permission: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // Fetch user permissions through the profiles/role_permissions relationship
  // Note: profiles table records the role name, which links to role_permissions table
  const { data: profile } = await supabase
    .from('users')
    .select('profile:profiles(name)')
    .eq('id', user.id)
    .single()

  const roleName = (profile as any)?.profile?.name
  if (!roleName) return false

  const { data: rolePermissions } = await supabase
    .from('role_permissions')
    .select('permission_slug')
    .eq('role_name', roleName)

  const permissions = rolePermissions?.map((p: any) => p.permission_slug) || []
  
  return permissions.includes(permission) || permissions.includes("admin") || roleName === "Administrador"
}

/**
 * Server-side utility to get all permissions for the current user.
 */
export async function getMyPermissions(): Promise<string[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('users')
    .select('profile:profiles(name)')
    .eq('id', user.id)
    .single()

  const roleName = (profile as any)?.profile?.name
  if (!roleName) return []

  const { data: rolePermissions } = await supabase
    .from('role_permissions')
    .select('permission_slug')
    .eq('role_name', roleName)

  // If administrator, you might want to return all or at least include common ones
  // But strictly, we return what's in the DB. 
  // We can also inject 'admin' if role is Administrador to trigger the global bypass
  const permissions = rolePermissions?.map((p: any) => p.permission_slug) || []
  
  if (roleName === "Administrador" && !permissions.includes("admin")) {
    permissions.push("admin")
  }

  return permissions
}
