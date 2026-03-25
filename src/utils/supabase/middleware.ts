import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // RBAC Check using public.users and public.profiles
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('*, profile:profiles(name, role_permissions(permission:permissions(slug)))')
      .eq('id', user.id)
      .single()

    const permissions = (profile as any)?.profile?.role_permissions?.map((p: any) => p.permission.slug) || []
    const pathname = request.nextUrl.pathname

    const routePermissions: { [key: string]: string } = {
      '/configuracoes': 'settings:manage',
      '/financeiro': 'finance:view'
    }

    for (const [route, slug] of Object.entries(routePermissions)) {
      if (pathname.startsWith(route) && !permissions.includes(slug)) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
