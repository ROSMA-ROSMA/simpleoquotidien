import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/config';
import { getRefreshToken, setAuthCookies, clearAuthCookies } from '@/lib/auth/cookies';
import { JwtPair } from '@/types/backend';

export async function POST() {
    const refresh = await getRefreshToken();
    if (!refresh) {
        return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
    }

    const res = await fetch(`${BACKEND_URL}/api/auth/jwt/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
        await clearAuthCookies();
        return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
    }

    const data = (await res.json()) as JwtPair;
    await setAuthCookies(data.access, data.refresh ?? refresh);
    return NextResponse.json({ success: true });
}
