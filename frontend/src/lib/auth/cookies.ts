import { cookies } from 'next/headers';
import { ACCESS_COOKIE, REFRESH_COOKIE, ACCESS_MAX_AGE, REFRESH_MAX_AGE } from '@/lib/config';

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
};

export async function setAuthCookies(access: string, refresh: string) {
    const jar = await cookies();
    jar.set(ACCESS_COOKIE, access, { ...cookieOptions, maxAge: ACCESS_MAX_AGE });
    jar.set(REFRESH_COOKIE, refresh, { ...cookieOptions, maxAge: REFRESH_MAX_AGE });
}

export async function clearAuthCookies() {
    const jar = await cookies();
    jar.delete(ACCESS_COOKIE);
    jar.delete(REFRESH_COOKIE);
}

export async function getAccessToken(): Promise<string | undefined> {
    const jar = await cookies();
    return jar.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
    const jar = await cookies();
    return jar.get(REFRESH_COOKIE)?.value;
}
