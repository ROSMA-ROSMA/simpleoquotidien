import { NextRequest, NextResponse } from 'next/server';
import {
    backendLogin,
    getRedirectPathForRole,
    extractErrorMessage,
    BackendError,
} from '@/lib/api/server';
import { BACKEND_URL } from '@/lib/config';
import { setAuthCookies, clearAuthCookies } from '@/lib/auth/cookies';
import { BackendUser } from '@/types/backend';
import { mapUserFromBackend } from '@/lib/mappers/backend';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();
        if (!email || !password) {
            return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 });
        }

        const tokens = await backendLogin(email, password);
        await setAuthCookies(tokens.access, tokens.refresh);

        const meRes = await fetch(`${BACKEND_URL}/api/auth/users/me/`, {
            headers: { Authorization: `Bearer ${tokens.access}` },
            cache: 'no-store',
        });
        const meBody = await meRes.json();
        if (!meRes.ok) {
            throw new BackendError('Profil utilisateur inaccessible.', meRes.status, meBody);
        }
        const me = meBody as BackendUser;
        const user = mapUserFromBackend(me);

        return NextResponse.json({
            success: true,
            user,
            redirectPath: getRedirectPathForRole(me.role),
        });
    } catch (err) {
        if (err instanceof BackendError) {
            // SimpleJWT returns "No active account found with the given credentials" for is_active=False
            const detail = typeof (err.body as Record<string, unknown>)?.detail === 'string'
                ? (err.body as Record<string, string>).detail
                : '';
            const isInactive = detail.toLowerCase().includes('no active account')
                || detail.toLowerCase().includes('aucun compte actif');
            // is_active=False ne signifie qu'une seule chose côté backend : l'email
            // n'a pas encore été confirmé (la validation admin d'un prestataire ne
            // touche jamais is_active, voir PrestataireProfile.verification_status).
            const message = isInactive
                ? "Confirmez votre adresse e-mail pour activer votre compte. Vérifiez votre boîte de réception (et vos spams)."
                : extractErrorMessage(err.body, err.message);
            return NextResponse.json(
                { error: message, code: isInactive ? 'EMAIL_NOT_CONFIRMED' : undefined },
                { status: err.status },
            );
        }
        return NextResponse.json({ error: 'Impossible de se connecter au serveur.' }, { status: 502 });
    }
}

export async function DELETE() {
    await clearAuthCookies();
    return NextResponse.json({ success: true });
}
