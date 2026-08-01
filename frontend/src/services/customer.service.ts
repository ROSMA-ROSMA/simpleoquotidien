import { apiFetch, unwrapList } from '@/lib/api/client';
import { mapUserFromBackend } from '@/lib/mappers/backend';
import { BackendUser } from '@/types/backend';
import { User, UserRole, ProfileFormData } from '@/types';
import { ApiResponse } from './apiClient';

export const customerService = {
    async getAll(): Promise<ApiResponse<User[]>> {
        const raw = await apiFetch<BackendUser[] | { results: BackendUser[] }>(
            'api/utilisateurs/utilisateurs/',
        );
        const all = unwrapList(raw).map(mapUserFromBackend);
        const clients = all.filter(u => u.role === UserRole.CLIENT);
        return { data: clients, meta: { total: clients.length } };
    },

    async getById(id: number): Promise<ApiResponse<User>> {
        const raw = await apiFetch<BackendUser>(`api/utilisateurs/utilisateurs/${id}/`);
        return { data: mapUserFromBackend(raw) };
    },

    async search(query: string): Promise<ApiResponse<User[]>> {
        const res = await customerService.getAll();
        const q = query.toLowerCase();
        const filtered = res.data.filter(u =>
            `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(q),
        );
        return { data: filtered, meta: { total: filtered.length } };
    },

    async filter(predicate: (u: User) => boolean): Promise<ApiResponse<User[]>> {
        const res = await customerService.getAll();
        const filtered = res.data.filter(predicate);
        return { data: filtered, meta: { total: filtered.length } };
    },

    async paginate(page: number, pageSize: number): Promise<ApiResponse<User[]>> {
        const res = await customerService.getAll();
        const start = (page - 1) * pageSize;
        const pageItems = res.data.slice(start, start + pageSize);
        return { data: pageItems, meta: { total: res.data.length, page, page_size: pageSize } };
    },
};
