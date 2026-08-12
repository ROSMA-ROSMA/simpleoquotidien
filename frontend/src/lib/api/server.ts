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

    const res = await fetch(`${BACKEND_URL}/api/auth/jwt/refresh/`, {
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
    const res = await fetch(`${BACKEND_URL}/api/auth/jwt/create/`, {
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

/** Active le compte (uid/token issus du lien reçu par e-mail) et renvoie
 * directement des tokens JWT + l'utilisateur, sans étape de login séparée. */
export async function backendActivate(
    uid: string,
    token: string,
): Promise<JwtPair & { user: import('@/types/backend').BackendUser; detail: string }> {
    const res = await fetch(`${BACKEND_URL}/api/auth/users/activation/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, token }),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
        throw new BackendError(
            extractErrorMessage(body, "Lien d'activation invalide ou expiré."),
            res.status,
            body,
        );
    }
    return body;
}

/** Demande l'envoi de l'e-mail de réinitialisation de mot de passe (Djoser renvoie
 * toujours 204, même si l'adresse n'existe pas — anti-énumération de comptes). */
export async function backendForgotPassword(email: string): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/api/auth/users/reset_password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    if (!res.ok && res.status !== 400) {
        throw new BackendError("Impossible d'envoyer l'e-mail pour le moment.", res.status);
    }
}

/** Confirme la réinitialisation (uid/token issus du lien reçu par e-mail) avec le nouveau mot de passe. */
export async function backendResetPasswordConfirm(
    uid: string,
    token: string,
    newPassword: string,
): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/api/auth/users/reset_password_confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, token, new_password: newPassword }),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new BackendError(
            extractErrorMessage(body, 'Lien de réinitialisation invalide ou expiré.'),
            res.status,
            body,
        );
    }
}

/** Redemande un e-mail d'activation (utile si le lien a expiré — validité 24h). */
export async function backendResendActivation(email: string): Promise<void> {
    const res = await fetch(`${BACKEND_URL}/api/auth/users/resend_activation/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    // Djoser renvoie 204 même si l'email n'existe pas (anti-énumération) — on ne lève
    // une erreur que sur une vraie panne serveur/réseau.
    if (!res.ok && res.status !== 400) {
        throw new BackendError("Impossible de renvoyer l'e-mail pour le moment.", res.status);
    }
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
