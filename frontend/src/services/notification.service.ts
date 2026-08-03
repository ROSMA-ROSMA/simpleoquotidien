import { apiFetch, unwrapList, ApiResponse } from '@/lib/api/client';
import { mapNotificationFromBackend } from '@/lib/mappers/backend';
import { BackendNotification } from '@/types/backend';
import { AppNotification, UserRole } from '@/types';

export const notificationService = {
    async getAll(viewerRole: UserRole): Promise<ApiResponse<AppNotification[]>> {
        const raw = await apiFetch<BackendNotification[] | { results: BackendNotification[] }>(
            'Notifications/notifications/',
        );
        const list = unwrapList(raw).map(n => mapNotificationFromBackend(n, viewerRole));
        list.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
        return { data: list, meta: { total: list.length } };
    },

    async markRead(id: number): Promise<void> {
        await apiFetch(`Notifications/notifications/${id}/marquer-lu/`, {
            method: 'PATCH',
        });
    },

    async markAllRead(): Promise<void> {
        await apiFetch('Notifications/notifications/marquer-tout-lu/', { method: 'PATCH' });
    },
};
