import { BACKEND_URL } from '@/lib/config';
import {
    getAccessToken,
    getRefreshToken,
    setAuthCookies,
    clearAuthCookies,
} from '@/lib/auth/cookies';
import { JwtPair } from '@/types/backend';

export class BackendError extends Error {
    status: number;
    body: unknown;

    constructor(message: string, status: number, body: unknown = null) {
        super(message);
        this.name = 'BackendError';
        this.status = status;
        this.body = body;
    }
}

async function refreshAccessToken(): Promise<string | null> {
    const refresh = await getRefreshToken();
    if (!refresh) return null;

    const res = await fetch(`${BACKEND_URL}/auth/jwt/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
        await clearAuthCookies();
        return null;
    }

    const data = (await res.json()) as JwtPair;
    await setAuthCookies(data.access, data.refresh ?? refresh);
    return data.access;
}

export async function backendFetch(
    path: string,
    init: RequestInit = {},
    retry = true,
): Promise<Response> {
    const access = await getAccessToken();
    const headers = new Headers(init.headers);

    if (access) {
        headers.set('Authorization', `Bearer ${access}`);
    }

    const url = path.startsWith('http') ? path : `${BACKEND_URL}/${path.replace(/^\//, '')}`;
    const res = await fetch(url, { ...init, headers, cache: 'no-store' });

    if (res.status === 401 && retry) {
        const newAccess = await refreshAccessToken();
        if (newAccess) {
            headers.set('Authorization', `Bearer ${newAccess}`);
            return fetch(url, { ...init, headers, cache: 'no-store' });
        }
    }

    return res;
}

export async function backendJson<T>(
    path: string,
    init: RequestInit = {},
): Promise<T> {
    const res = await backendFetch(path, init);
    const text = await res.text();
    let body: unknown = null;
    if (text) {
        try {
            body = JSON.parse(text);
        } catch {
            body = text;
        }
    }

    if (!res.ok) {
        const message =
            typeof body === 'object' && body !== null && 'detail' in body
                ? String((body as { detail: unknown }).detail)
                : `Erreur API (${res.status})`;
        throw new BackendError(message, res.status, body);
    }

    return body as T;
}

/** Login direct backend (sans cookie existant). */
export async function backendLogin(email: string, password: string): Promise<JwtPair> {
    const res = await fetch(`${BACKEND_URL}/auth/jwt/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
        throw new BackendError(
            typeof body?.detail === 'string' ? body.detail : 'Email ou mot de passe incorrect.',
            res.status,
            body,
        );
    }
    return body as JwtPair;
}

export function getRedirectPathForRole(role: string): string {
    switch (role) {
        case 'ADMIN':
            return '/dashboard/admin';
        case 'PRESTATAIRE':
            return '/dashboard/provider';
        case 'AGENT':
            return '/agent/dashboard';
        default:
            return '/dashboard/client';
    }
}

export function extractErrorMessage(body: unknown, fallback: string): string {
    if (!body || typeof body !== 'object') return fallback;
    const obj = body as Record<string, unknown>;
    if (typeof obj.detail === 'string') return obj.detail;
    const firstKey = Object.keys(obj)[0];
    if (firstKey) {
        const val = obj[firstKey];
        if (Array.isArray(val) && val.length) return String(val[0]);
        if (typeof val === 'string') return val;
    }
    return fallback;
}
