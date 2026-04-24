import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login']

function isTokenExpired(token: string): boolean {
    try {
        // Decode payload without verifying signature (real verification is on the API)
        const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(b64)) as { exp?: number }
        return typeof payload.exp === 'number' && Date.now() / 1000 > payload.exp
    } catch {
        return true
    }
}

export function proxy(request: NextRequest) {
    const tokenCookie = request.cookies.get('auth-token')
    const { pathname } = request.nextUrl

    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
    const isAuthenticated = !!tokenCookie && !isTokenExpired(tokenCookie.value)

    if (!isAuthenticated && !isPublic) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('next', pathname)
        const response = NextResponse.redirect(loginUrl)
        if (tokenCookie) response.cookies.delete('auth-token')
        return response
    }

    if (isAuthenticated && pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
