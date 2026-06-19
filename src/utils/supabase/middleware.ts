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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/api/instagram/oauth/callback')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // RBAC Check
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('profile:profiles(name)')
      .eq('id', user.id)
      .single()

    const roleName = (profile as UserProfileResult | null)?.profile?.name
    const pathname = request.nextUrl.pathname

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
    
    // We already have granular checks on the pages. 
    // Middleware should only handle basic top-level redirects if needed.
    const routePermissions: { [key: string]: string } = {
      // You can keep some top-level ones if they exist in DB
      '/configuracoes': 'settings:view',
      '/financeiro': 'finance:view'
    }

    for (const [route, slug] of Object.entries(routePermissions)) {
      const hasRoutePermission =
        permissions.includes(slug) ||
        permissions.includes("admin") ||
        (route === "/configuracoes" && permissions.some((permission) => permission.startsWith("settings:")))

      if (pathname.startsWith(route) && !hasRoutePermission) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
