/**
 * Client HTTP côté navigateur — passe par les Route Handlers Next.js (BFF).
 * Les tokens JWT ne transitent jamais par le JavaScript client : ils sont
 * stockés en cookies httpOnly par `/api/auth/*`.
 */

export class ApiError extends Error {
    status: number;
    body: unknown;

    constructor(message: string, status = 400, body: unknown = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.body = body;
    }
}

export interface ApiResponse<T> {
    data: T;
    meta?: { total?: number; page?: number; page_size?: number };
}

async function parseJson(res: Response): Promise<unknown> {
    const text = await res.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

export async function apiFetch<T = unknown>(
    path: string,
    init: RequestInit = {},
): Promise<T> {
    const normalized = path.replace(/^\//, '');
    const res = await fetch(`/api/backend/${normalized}`, {
        ...init,
        credentials: 'same-origin',
        headers: {
            ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            ...Object.fromEntries(new Headers(init.headers)),
        },
    });

    const body = await parseJson(res);

    if (res.status === 401 && typeof window !== 'undefined') {
        const isAuthRoute = window.location.pathname.startsWith('/login');
        if (!isAuthRoute && !normalized.startsWith('auth/')) {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
    }

    if (!res.ok) {
        const message =
            typeof body === 'object' && body !== null && 'error' in body
                ? String((body as { error: string }).error)
                : `Erreur (${res.status})`;
        throw new ApiError(message, res.status, body);
    }

    return body as T;
}

export async function authFetch<T = unknown>(
    path: string,
    init: RequestInit = {},
): Promise<T> {
    const res = await fetch(`/api/auth/${path}`, {
        ...init,
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(new Headers(init.headers)),
        },
    });
    const body = await parseJson(res);
    if (!res.ok) {
        const message =
            typeof body === 'object' && body !== null && 'error' in body
                ? String((body as { error: string }).error)
                : `Erreur (${res.status})`;
        throw new ApiError(message, res.status, body);
    }
    return body as T;
}

/** Liste paginée DRF (results + count) ou tableau brut. */
export function unwrapList<T>(data: T[] | { results: T[]; count?: number }): T[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && 'results' in data) {
        return (data as { results: T[] }).results;
    }
    return [];
}
