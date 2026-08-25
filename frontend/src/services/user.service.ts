/**
 * Service centralisé pour les opérations utilisateurs (tous rôles).
 * Utilise le proxy BFF /api/backend/... vers le backend Django.
 */
import { apiFetch, unwrapList } from '@/lib/api/client';
import { mapUserFromBackend } from '@/lib/mappers/backend';
import { BackendUser } from '@/types/backend';
import { User, UserRole } from '@/types';
import { ApiResponse } from './apiClient';

export const userService = {
    async getAll(filters?: { role?: UserRole }): Promise<ApiResponse<User[]>> {
        const raw = await apiFetch<BackendUser[] | { results: BackendUser[] }>(
            'Info_utilisateurs/utilisateurs/',
        );
        let list = unwrapList(raw).map(mapUserFromBackend);
        if (filters?.role) {
            list = list.filter(u => u.role === filters.role);
        }
        return { data: list, meta: { total: list.length } };
    },

    async getById(id: number): Promise<ApiResponse<User>> {
        const raw = await apiFetch<BackendUser>(`Info_utilisateurs/utilisateurs/${id}/`);
        return { data: mapUserFromBackend(raw) };
    },

    async search(query: string, role?: UserRole): Promise<ApiResponse<User[]>> {
        const res = await userService.getAll(role ? { role } : undefined);
        const q = query.toLowerCase();
        const filtered = res.data.filter(u =>
            `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(q),
        );
        return { data: filtered, meta: { total: filtered.length } };
    },

    async remove(id: number): Promise<void> {
        await apiFetch(`Info_utilisateurs/utilisateurs/${id}/`, { method: 'DELETE' });
    },
};
