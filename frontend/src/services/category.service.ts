import { apiFetch, unwrapList, ApiResponse } from '@/lib/api/client';
import { mapCategoryFromBackend } from '@/lib/mappers/backend';
import { BackendCategory } from '@/types/backend';
import { Category } from '@/types';

export const categoryService = {
    async getAll(): Promise<ApiResponse<Category[]>> {
        const raw = await apiFetch<BackendCategory[] | { results: BackendCategory[] }>('Commandes/categories/');
        const list = unwrapList(raw).map((c, i) => mapCategoryFromBackend(c, i));
        return { data: list, meta: { total: list.length } };
    },

    async getById(id: number): Promise<ApiResponse<Category>> {
        const raw = await apiFetch<BackendCategory>(`Commandes/categories/${id}/`);
        return { data: mapCategoryFromBackend(raw) };
    },

    async create(payload: { name: string; description: string; image?: File }): Promise<ApiResponse<Category>> {
        const form = new FormData();
        form.set('nom', payload.name);
        form.set('description', payload.description);
        if (payload.image) form.set('image', payload.image);
        const raw = await apiFetch<BackendCategory>('Commandes/categories/', {
            method: 'POST',
            body: form,
        });
        return { data: mapCategoryFromBackend(raw) };
    },

    async update(id: number, payload: Partial<{ name: string; description: string; image: File }>): Promise<ApiResponse<Category>> {
        const form = new FormData();
        if (payload.name) form.set('nom', payload.name);
        if (payload.description) form.set('description', payload.description);
        if (payload.image) form.set('image', payload.image);
        const raw = await apiFetch<BackendCategory>(`Commandes/categories/${id}/`, {
            method: 'PATCH',
            body: form,
        });
        return { data: mapCategoryFromBackend(raw) };
    },

    async delete(id: number): Promise<void> {
        await apiFetch(`Commandes/categories/${id}/`, { method: 'DELETE' });
    },
};
