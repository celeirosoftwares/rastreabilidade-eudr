import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname

  const isAuthRoute   = pathname.startsWith('/auth')
  const isApiRoute    = pathname.startsWith('/api')
  const isVerifyRoute = pathname.startsWith('/verificar')
  const isPlanosRoute = pathname.startsWith('/planos')
  const isPublicRoute = pathname === '/'

  // Rotas públicas — sem verificação
  if (isAuthRoute || isApiRoute || isVerifyRoute || isPublicRoute) {
    return supabaseResponse
  }

  // Não autenticado → login
  if (!session) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Buscar dados da organização
  const { data: user } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', session.user.id)
    .single()

  let hasAccess = false

  if (user?.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('subscription_status, subscription_ends_at')
      .eq('id', user.organization_id)
      .single()

    const status = org?.subscription_status
    const endsAt = org?.subscription_ends_at

    hasAccess =
      status === 'active' ||
      (status === 'canceling' && endsAt && new Date(endsAt) > new Date())
  }

  // Sem assinatura → redireciona para /planos (exceto se já estiver lá)
  if (!hasAccess && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/planos'
    return NextResponse.redirect(url)
  }

  // Já tem assinatura e está em /planos → dashboard
  if (hasAccess && isPlanosRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
