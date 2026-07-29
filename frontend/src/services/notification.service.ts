import { apiFetch, unwrapList, ApiResponse } from '@/lib/api/client';
import { mapNotificationFromBackend } from '@/lib/mappers/backend';
import { BackendNotification } from '@/types/backend';
import { AppNotification } from '@/types';

export const notificationService = {
    async getAll(): Promise<ApiResponse<AppNotification[]>> {
        const raw = await apiFetch<BackendNotification[] | { results: BackendNotification[] }>(
            'api/utilisateurs/notifications/',
        );
        const list = unwrapList(raw).map(mapNotificationFromBackend);
        list.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
        return { data: list, meta: { total: list.length } };
    },

    async markRead(id: number): Promise<void> {
        await apiFetch(`api/utilisateurs/notifications/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify({ is_read: true }),
        });
    },

    async markAllRead(): Promise<void> {
        await apiFetch('api/utilisateurs/notifications/mark-all-read/', { method: 'POST' });
    },
};
