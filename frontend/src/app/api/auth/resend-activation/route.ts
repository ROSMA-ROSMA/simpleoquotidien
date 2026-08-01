import { NextRequest, NextResponse } from 'next/server';
import { backendResendActivation, BackendError } from '@/lib/api/server';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();
        if (!email) {
            return NextResponse.json({ error: 'Email requis.' }, { status: 400 });
        }
        await backendResendActivation(email);
        // On répond toujours succès (même comportement anti-énumération que Djoser) :
        // on ne révèle pas si l'email existe ou est déjà activé.
        return NextResponse.json({ success: true });
    } catch (err) {
        if (err instanceof BackendError) {
            return NextResponse.json({ error: err.message }, { status: err.status });
        }
        return NextResponse.json({ error: 'Impossible de se connecter au serveur.' }, { status: 502 });
    }
}
