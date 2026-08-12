import { NextRequest, NextResponse } from 'next/server';
import { backendResetPasswordConfirm, BackendError } from '@/lib/api/server';

export async function POST(request: NextRequest) {
    try {
        const { uid, token, new_password } = await request.json();
        if (!uid || !token || !new_password) {
            return NextResponse.json({ error: 'Requête de réinitialisation incomplète.' }, { status: 400 });
        }

        await backendResetPasswordConfirm(uid, token, new_password);
        return NextResponse.json({ success: true });
    } catch (err) {
        if (err instanceof BackendError) {
            return NextResponse.json({ error: err.message }, { status: err.status });
        }
        return NextResponse.json({ error: 'Impossible de se connecter au serveur.' }, { status: 502 });
    }
}
