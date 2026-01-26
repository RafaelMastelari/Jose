import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
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
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Log for debugging
    console.log('🔐 Middleware:', {
        path: request.nextUrl.pathname,
        hasUser: !!user,
        userEmail: user?.email,
    })

    // Protected routes - require authentication
    const isProtected = request.nextUrl.pathname.startsWith('/dashboard')

    // Auth routes - redirect if already logged in
    const isAuthRoute =
        request.nextUrl.pathname === '/login' ||
        request.nextUrl.pathname === '/signup'

    if (isProtected && !user) {
        console.log('❌ Blocking access to protected route - redirecting to login')
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (isAuthRoute && user) {
        console.log('✅ Already logged in - redirecting to dashboard')
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    console.log('✅ Access granted')
    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
