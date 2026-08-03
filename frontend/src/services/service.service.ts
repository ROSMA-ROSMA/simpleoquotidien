import { apiFetch, unwrapList, ApiResponse } from '@/lib/api/client';
import { mapServiceFromBackend } from '@/lib/mappers/backend';
import { BackendService } from '@/types/backend';
import { ProviderService } from '@/types';

export interface CreateProviderServiceInput {
    category_id: number;
    price: number;
    city: string;
    description?: string;
    image?: File;
}

export const serviceService = {
    async getAll(filters?: { prestataire_id?: number; category_id?: number; city?: string }): Promise<ApiResponse<ProviderService[]>> {
        const params = new URLSearchParams();
        if (filters?.prestataire_id) params.set('prestataire', String(filters.prestataire_id));
        if (filters?.category_id) params.set('category', String(filters.category_id));
        if (filters?.city) params.set('city', filters.city);
        const qs = params.toString();
        const raw = await apiFetch<BackendService[] | { results: BackendService[] }>(
            `Commandes/services/${qs ? `?${qs}` : ''}`,
        );
        const list = unwrapList(raw).map(mapServiceFromBackend);
        return { data: list, meta: { total: list.length } };
    },

    async create(payload: CreateProviderServiceInput): Promise<ApiResponse<ProviderService>> {
        const form = new FormData();
        form.set('category', String(payload.category_id));
        form.set('price', String(payload.price));
        form.set('city', payload.city);
        form.set('description', payload.description ?? '');
        if (payload.image) form.set('image', payload.image);
        const raw = await apiFetch<BackendService>('Commandes/services/', {
            method: 'POST',
            body: form,
        });
        return { data: mapServiceFromBackend(raw) };
    },

    async delete(id: number): Promise<void> {
        await apiFetch(`Commandes/services/${id}/`, { method: 'DELETE' });
    },
};
