import { NextRequest, NextResponse } from 'next/server';
import { backendJson, BackendError, extractErrorMessage } from '@/lib/api/server';
import { BackendUser } from '@/types/backend';
import { mapUserFromBackend } from '@/lib/mappers/backend';

export async function GET() {
    try {
        const data = await backendJson<BackendUser>('api/auth/users/me/');
        return NextResponse.json({ user: mapUserFromBackend(data) });
    } catch (err) {
        if (err instanceof BackendError && err.status === 401) {
            return NextResponse.json({ user: null }, { status: 401 });
        }
        if (err instanceof BackendError) {
            return NextResponse.json({ error: extractErrorMessage(err.body, err.message) }, { status: err.status });
        }
        return NextResponse.json({ error: 'Erreur serveur.' }, { status: 502 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const patch = await request.json();
        const data = await backendJson<BackendUser>('api/auth/users/me/', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
        });
        return NextResponse.json({ user: mapUserFromBackend(data) });
    } catch (err) {
        if (err instanceof BackendError) {
            return NextResponse.json({ error: extractErrorMessage(err.body, err.message) }, { status: err.status });
        }
        return NextResponse.json({ error: 'Erreur serveur.' }, { status: 502 });
    }
}
