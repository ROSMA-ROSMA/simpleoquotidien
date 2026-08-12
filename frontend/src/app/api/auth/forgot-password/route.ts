import { NextRequest, NextResponse } from 'next/server';
import { backendForgotPassword, BackendError } from '@/lib/api/server';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();
        if (!email) {
            return NextResponse.json({ error: 'Adresse e-mail requise.' }, { status: 400 });
        }

        await backendForgotPassword(email);
        // Toujours 200, que l'adresse existe ou non (anti-énumération de comptes).
        return NextResponse.json({ success: true });
    } catch (err) {
        if (err instanceof BackendError) {
            return NextResponse.json({ error: err.message }, { status: err.status });
        }
        return NextResponse.json({ error: 'Impossible de se connecter au serveur.' }, { status: 502 });
    }
}
