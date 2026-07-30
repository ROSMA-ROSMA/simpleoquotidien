import { NextRequest, NextResponse } from 'next/server';
import { backendActivate, getRedirectPathForRole, BackendError } from '@/lib/api/server';
import { setAuthCookies } from '@/lib/auth/cookies';
import { mapUserFromBackend } from '@/lib/mappers/backend';

export async function POST(request: NextRequest) {
    try {
        const { uid, token } = await request.json();
        if (!uid || !token) {
            return NextResponse.json({ error: "Lien d'activation incomplet." }, { status: 400 });
        }

        const result = await backendActivate(uid, token);
        // Le compte est activé ET on récupère directement des tokens JWT :
        // l'utilisateur est connecté sans avoir à retaper ses identifiants,
        // que le lien soit ouvert sur le même appareil que l'inscription ou non.
        await setAuthCookies(result.access, result.refresh);

        const user = mapUserFromBackend(result.user);
        return NextResponse.json({
            success: true,
            user,
            redirectPath: getRedirectPathForRole(result.user.role),
        });
    } catch (err) {
        if (err instanceof BackendError) {
            return NextResponse.json({ error: err.message }, { status: err.status });
        }
        return NextResponse.json({ error: 'Impossible de se connecter au serveur.' }, { status: 502 });
    }
}
