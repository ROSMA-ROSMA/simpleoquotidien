import { apiFetch, unwrapList, ApiResponse } from '@/lib/api/client';
import { mapCategoryFromBackend } from '@/lib/mappers/backend';
import { BackendCategory } from '@/types/backend';
import { Category } from '@/types';

export const categoryService = {
    async getAll(): Promise<ApiResponse<Category[]>> {
        const raw = await apiFetch<BackendCategory[] | { results: BackendCategory[] }>('api/commandes/categories/');
        const list = unwrapList(raw).map((c, i) => mapCategoryFromBackend(c, i));
        return { data: list, meta: { total: list.length } };
    },

    async getById(id: number): Promise<ApiResponse<Category>> {
        const raw = await apiFetch<BackendCategory>(`api/commandes/categories/${id}/`);
        return { data: mapCategoryFromBackend(raw) };
    },

    async create(payload: { name: string; description: string }): Promise<ApiResponse<Category>> {
        const raw = await apiFetch<BackendCategory>('api/commandes/categories/', {
            method: 'POST',
            body: JSON.stringify({ nom: payload.name, description: payload.description }),
        });
        return { data: mapCategoryFromBackend(raw) };
    },

    async update(id: number, payload: Partial<{ name: string; description: string }>): Promise<ApiResponse<Category>> {
        const body: Record<string, string> = {};
        if (payload.name) body.nom = payload.name;
        if (payload.description) body.description = payload.description;
        const raw = await apiFetch<BackendCategory>(`api/commandes/categories/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
        return { data: mapCategoryFromBackend(raw) };
    },

    async delete(id: number): Promise<void> {
        await apiFetch(`api/commandes/categories/${id}/`, { method: 'DELETE' });
    },
};
