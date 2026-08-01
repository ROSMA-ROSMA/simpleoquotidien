import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/config';
import { backendJson, BackendError, extractErrorMessage } from '@/lib/api/server';
import { BackendUser } from '@/types/backend';
import { mapRoleToBackend, mapUserFromBackend } from '@/lib/mappers/backend';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            email,
            password,
            re_password,
            first_name,
            last_name,
            role = 'client',
            pays = 'Burkina Faso',
        } = body;

        if (!email || !password || !first_name || !last_name) {
            return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 });
        }

        const payload = {
            email,
            password,
            re_password: re_password ?? password,
            first_name,
            last_name,
            role: mapRoleToBackend(role),
            pays,
            username: email.split('@')[0],
        };

        const res = await fetch(`${BACKEND_URL}/api/auth/users/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
            return NextResponse.json(
                { error: extractErrorMessage(data, 'Inscription impossible.') },
                { status: res.status },
            );
        }

        return NextResponse.json({ success: true, user: mapUserFromBackend(data as BackendUser) });
    } catch (err) {
        if (err instanceof BackendError) {
            return NextResponse.json({ error: err.message }, { status: err.status });
        }
        return NextResponse.json({ error: 'Erreur serveur.' }, { status: 502 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const patch = await request.json();
        const data = await backendJson<BackendUser>('/api/auth/users/me/', {
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
