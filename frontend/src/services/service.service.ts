import { apiFetch, unwrapList, ApiResponse } from '@/lib/api/client';
import { mapServiceFromBackend } from '@/lib/mappers/backend';
import { BackendService } from '@/types/backend';
import { ProviderService } from '@/types';

export interface CreateProviderServiceInput {
    category_id: number;
    price: number;
    city: string;
    description?: string;
}

export const serviceService = {
    async getAll(filters?: { prestataire_id?: number; category_id?: number; city?: string }): Promise<ApiResponse<ProviderService[]>> {
        const params = new URLSearchParams();
        if (filters?.prestataire_id) params.set('prestataire', String(filters.prestataire_id));
        if (filters?.category_id) params.set('category', String(filters.category_id));
        if (filters?.city) params.set('city', filters.city);
        const qs = params.toString();
        const raw = await apiFetch<BackendService[] | { results: BackendService[] }>(
            `api/commandes/services/${qs ? `?${qs}` : ''}`,
        );
        const list = unwrapList(raw).map(mapServiceFromBackend);
        return { data: list, meta: { total: list.length } };
    },

    async create(payload: CreateProviderServiceInput): Promise<ApiResponse<ProviderService>> {
        const raw = await apiFetch<BackendService>('api/commandes/services/', {
            method: 'POST',
            body: JSON.stringify({
                category: payload.category_id,
                price: payload.price,
                city: payload.city,
                description: payload.description ?? '',
            }),
        });
        return { data: mapServiceFromBackend(raw) };
    },

    async delete(id: number): Promise<void> {
        await apiFetch(`api/commandes/services/${id}/`, { method: 'DELETE' });
    },
};
