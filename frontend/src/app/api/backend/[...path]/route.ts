import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, BackendError, extractErrorMessage } from '@/lib/api/server';

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: RouteContext) {
    const { path } = await context.params;
    const targetPath = path.join('/');
    const url = new URL(request.url);
    const suffix = url.search ? `${targetPath}/${url.search.replace(/^\?/, '?')}` : `${targetPath}/`;

    const headers = new Headers();
    const contentType = request.headers.get('content-type');
    if (contentType) headers.set('Content-Type', contentType);

    const init: RequestInit = {
        method: request.method,
        headers,
        cache: 'no-store',
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        const body = await request.arrayBuffer();
        if (body.byteLength) init.body = body;
    }

    try {
        const res = await backendFetch(suffix, init, true);
        const text = await res.text();
        const responseHeaders = new Headers();
        const resContentType = res.headers.get('content-type');
        if (resContentType) responseHeaders.set('Content-Type', resContentType);

        if (!res.ok) {
            let parsed: unknown = null;
            try {
                parsed = text ? JSON.parse(text) : null;
            } catch {
                parsed = text;
            }
            return NextResponse.json(
                { error: extractErrorMessage(parsed, `Erreur API (${res.status})`), details: parsed },
                { status: res.status, headers: responseHeaders },
            );
        }

        if (res.status === 204) {
            return new NextResponse(null, { status: 204 });
        }

        return new NextResponse(text, { status: res.status, headers: responseHeaders });
    } catch (err) {
        const message = err instanceof BackendError ? err.message : 'Backend inaccessible.';
        return NextResponse.json({ error: message }, { status: 502 });
    }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
