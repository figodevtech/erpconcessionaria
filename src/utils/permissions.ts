import { cache } from "react"

import { createClient } from "@/utils/supabase/server"

type AuthContext = {
  userId: string | null
  email: string | null
  name: string | null
  roleName: string | null
  permissions: string[]
}

const emptyContext: AuthContext = {
  userId: null,
  email: null,
  name: null,
  roleName: null,
  permissions: [],
}

type UserRow = {
  name?: string | null
  profile?: { name?: string | null } | null
}

export type VerifiedUser = {
  id: string
  email: string | null
  name: string | null
}

/**
 * Returns the authenticated user, verifying the access token locally.
 *
 * `getClaims` checks the JWT signature against the project's JWKS (cached per
 * process for 10 minutes) instead of calling the Auth server on every request
 * the way `getUser` does. It still refreshes an expired session, and falls back
 * to a server round trip if the project ever moves back to a symmetric signing
 * secret. Wrapped in React `cache` so callers in the same request share it.
 */
export const getVerifiedUser = cache(async (): Promise<VerifiedUser | null> => {
  const supabase = await createClient()

  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) return null

  return {
    id: claims.sub,
    email: (claims.email as string | undefined) ?? null,
    name: (claims.user_metadata?.name as string | undefined) ?? null,
  }
})

/**
 * Loads user + role + permissions in a single pass.
 *
 * Wrapped in React `cache` so every consumer inside the same server request
 * (layout, page, server action, route handler) shares one round trip instead of
 * repeating the token check plus the two RBAC queries.
 */
export const getAuthContext = cache(async (): Promise<AuthContext> => {
  const user = await getVerifiedUser()
  if (!user) return emptyContext

  const supabase = await createClient()

  const base = {
    userId: user.id,
    email: user.email,
    name: user.name,
  }

  const { data } = await supabase
    .from('users')
    .select('name, profile:profiles(name)')
    .eq('id', user.id)
    .single()

  const row = data as UserRow | null
  const roleName = row?.profile?.name ?? null
  const name = row?.name ?? base.name

  if (!roleName) return { ...base, name, roleName: null, permissions: [] }

  const { data: rolePermissions } = await supabase
    .from('role_permissions')
    .select('permission_slug')
    .eq('role_name', roleName)

  const permissions = (rolePermissions ?? []).flatMap((row: { permission_slug: string | null }) =>
    row.permission_slug ? [row.permission_slug] : [],
  )

  if (roleName === "Administrador" && !permissions.includes("admin")) {
    permissions.push("admin")
  }

  return { ...base, name, roleName, permissions }
})

/**
 * Server-side utility to check if the current user has a specific permission.
 *
 * @param permission The permission slug to check (e.g., 'vehicles:create')
 * @returns boolean indicating if the user has the permission
 */
export async function checkPermission(permission: string): Promise<boolean> {
  const { roleName, permissions } = await getAuthContext()
  if (!roleName) return false

  return permissions.includes(permission) || permissions.includes("admin") || roleName === "Administrador"
}

/**
 * Server-side utility to check if the current user has at least one of the permissions.
 */
export async function checkAnyPermission(required: string[]): Promise<boolean> {
  const { roleName, permissions } = await getAuthContext()
  if (!roleName) return false
  if (permissions.includes("admin") || roleName === "Administrador") return true

  return required.some((permission) => permissions.includes(permission))
}

/**
 * Server-side utility to get all permissions for the current user.
 */
export async function getMyPermissions(): Promise<string[]> {
  const { permissions } = await getAuthContext()
  return permissions
}
