import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type UserProfileResult = {
  profile?: {
    name?: string | null
  } | null
}

type RolePermissionResult = {
  permission_slug: string | null
}

/**
 * Top-level routes the proxy still guards. Granular checks already run on the
 * pages and server actions, so every other path skips the RBAC queries
 * entirely — that keeps navigations and prefetches free of database work.
 */
const routePermissions: { [key: string]: string } = {
  '/configuracoes': 'settings:view',
  '/financeiro': 'finance:view',
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // `getClaims` verifies the access token locally against the project's JWKS
  // (cached per process for 10 minutes) instead of calling the Auth server on
  // every request the way `getUser` does. It still refreshes an expired session
  // and writes the rotated cookies back through `setAll`.
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  const pathname = request.nextUrl.pathname

  if (
    !userId &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/auth') &&
    !pathname.startsWith('/api/instagram/oauth/callback')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (!userId) return supabaseResponse

  // RBAC check: only pay for the profile/permission queries when the request
  // actually targets one of the guarded routes.
  const guardedRoutes = Object.entries(routePermissions).filter(([route]) =>
    pathname.startsWith(route),
  )

  if (guardedRoutes.length === 0) return supabaseResponse

  const { data: profile } = await supabase
    .from('users')
    .select('profile:profiles(name)')
    .eq('id', userId)
    .single()

  const roleName = (profile as UserProfileResult | null)?.profile?.name

  // Skip redirect for Administrador
  if (roleName === "Administrador") {
    return supabaseResponse
  }

  const { data: rolePermissions } = await supabase
    .from('role_permissions')
    .select('permission_slug')
    .eq('role_name', roleName || '')

  const permissions = (rolePermissions as RolePermissionResult[] | null)?.flatMap((permission) =>
    permission.permission_slug ? [permission.permission_slug] : [],
  ) || []

  for (const [route, slug] of guardedRoutes) {
    const hasRoutePermission =
      permissions.includes(slug) ||
      permissions.includes("admin") ||
      (route === "/configuracoes" && permissions.some((permission) => permission.startsWith("settings:")))

    if (!hasRoutePermission) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
