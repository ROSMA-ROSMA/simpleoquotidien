import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
    '/dashboard',
    '/agent',
    '/admin',
    '/profile',
    '/messages',
    '/payment',
];

const AUTH_PAGES = ['/login', '/register'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const hasAccess = request.cookies.has('soq_access') || request.cookies.has('soq_refresh');

    const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
        || /^\/booking\/\d+\/(edit|rate|postpone)/.test(pathname)
        || /^\/services\/category\/\d+\/book/.test(pathname);

    if (isProtected && !hasAccess) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (AUTH_PAGES.some(p => pathname.startsWith(p)) && hasAccess) {
        return NextResponse.redirect(new URL('/dashboard/client', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
