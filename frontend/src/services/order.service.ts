import { apiFetch, unwrapList } from '@/lib/api/client';
import { ApiError, ApiResponse as LegacyApiResponse } from './apiClient';
import {
    mapOrderFromBackend,
    mapQuoteStatusToBackend,
    BOOKING_STATUS_TO_ORDER,
} from '@/lib/mappers/backend';
import { BackendAssignment, BackendOrder, BackendQuote } from '@/types/backend';
import { Booking, BookingStatus, PaymentMethod } from '@/types';

export type { ApiResponse } from './apiClient';

interface OrderAssignmentInfo {
    assignmentId: number;
    providerId: number;
    status: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE' | 'EXPIREE';
}

async function fetchAssignmentsByOrder(): Promise<Map<string, OrderAssignmentInfo>> {
    try {
        const raw = await apiFetch<BackendAssignment[] | { results: BackendAssignment[] }>(
            'Info_utilisateurs/assignments/',
        );
        const list = unwrapList(raw);
        const map = new Map<string, OrderAssignmentInfo>();
        for (const a of list) {
            // Le backend trie par date décroissante : la première assignation
            // rencontrée pour une commande donnée est donc la plus récente.
            if (!map.has(a.order)) {
                map.set(a.order, { assignmentId: a.id, providerId: a.prestataire, status: a.status });
            }
        }
        return map;
    } catch {
        return new Map();
    }
}

function toMapperExtras(info?: OrderAssignmentInfo) {
    return {
        assigned_provider_id: info?.providerId,
        assignment_id: info?.assignmentId,
        assignment_status: info?.status,
    };
}

async function mapOrdersList(orders: BackendOrder[]): Promise<Booking[]> {
    const assignments = await fetchAssignmentsByOrder();
    return orders.map(o => mapOrderFromBackend(o, toMapperExtras(assignments.get(o.uuid))));
}

export interface CreateOrderInput {
    category_id: number;
    scheduled_datetime: string;
    address: string;
    message?: string;
    budget: number;
    /** Message vocal décrivant le besoin, joint à la description pour le prestataire/agent. */
    voiceNote?: Blob;
}

export const orderService = {
    async getAll(filters?: {
        status?: BookingStatus;
        client_id?: number;
        provider_id?: number;
    }): Promise<LegacyApiResponse<Booking[]>> {
        const raw = await apiFetch<BackendOrder[] | { results: BackendOrder[] }>('Commandes/orders/');
        let items = await mapOrdersList(unwrapList(raw));
        if (filters?.status) items = items.filter(b => b.status === filters.status);
        if (filters?.client_id) items = items.filter(b => b.client_id === filters.client_id);
        if (filters?.provider_id) {
            items = items.filter(b => b.assigned_provider_id === filters.provider_id);
        }
        items.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
        return { data: items, meta: { total: items.length } };
    },

    async getById(uuid: string): Promise<LegacyApiResponse<Booking>> {
        const raw = await apiFetch<BackendOrder>(`Commandes/orders/${uuid}/`);
        const assignments = await fetchAssignmentsByOrder();
        const booking = mapOrderFromBackend(raw, toMapperExtras(assignments.get(raw.uuid)));
        return { data: booking };
    },

    async create(payload: CreateOrderInput): Promise<LegacyApiResponse<Booking>> {
        const description = payload.message?.trim() || 'Demande de service';

        if (payload.voiceNote) {
            const fd = new FormData();
            fd.append('category', String(payload.category_id));
            fd.append('date', payload.scheduled_datetime);
            fd.append('localisation', payload.address);
            fd.append('description', description);
            fd.append('budget', String(payload.budget));
            const ext = payload.voiceNote.type.includes('mp4') ? 'm4a' : 'webm';
            fd.append('voice_note', payload.voiceNote, `note-vocale.${ext}`);
            const raw = await apiFetch<BackendOrder>('Commandes/orders/', {
                method: 'POST',
                body: fd,
            });
            return { data: mapOrderFromBackend(raw) };
        }

        const body = {
            category: payload.category_id,
            date: payload.scheduled_datetime,
            localisation: payload.address,
            description,
            budget: payload.budget,
        };
        const raw = await apiFetch<BackendOrder>('Commandes/orders/', {
            method: 'POST',
            body: JSON.stringify(body),
        });
        return { data: mapOrderFromBackend(raw) };
    },

    async update(uuid: string, patch: Partial<{ address: string; message: string; scheduled_datetime: string; budget: number; status: BookingStatus }>): Promise<LegacyApiResponse<Booking>> {
        const body: Record<string, unknown> = {};
        if (patch.address !== undefined) body.localisation = patch.address;
        if (patch.message !== undefined) body.description = patch.message;
        if (patch.scheduled_datetime !== undefined) body.date = patch.scheduled_datetime;
        if (patch.budget !== undefined) body.budget = patch.budget;
        if (patch.status !== undefined) {
            const backendStatus = BOOKING_STATUS_TO_ORDER[patch.status];
            if (backendStatus) body.status = backendStatus;
        }
        const raw = await apiFetch<BackendOrder>(`Commandes/orders/${uuid}/`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
        const assignments = await fetchAssignmentsByOrder();
        return {
            data: mapOrderFromBackend(raw, toMapperExtras(assignments.get(raw.uuid))),
        };
    },

    async assignProvider(order: { id: number; uuid: string }, providerId: number, agentId: number) {
        await apiFetch('Info_utilisateurs/assignments/', {
            method: 'POST',
            body: JSON.stringify({
                methode: 'MANUEL',
                order: order.uuid,
                prestataire: providerId,
                qualifier: agentId,
            }),
        });
        await orderService.update(order.uuid, { status: BookingStatus.ASSIGNED });
        return orderService.getById(order.uuid);
    },

    async accept(assignmentId: number) {
        await apiFetch(`Info_utilisateurs/assignments/${assignmentId}/accept/`, { method: 'POST' });
    },

    async refuse(assignmentId: number, reason?: string) {
        await apiFetch(`Info_utilisateurs/assignments/${assignmentId}/refuse/`, {
            method: 'POST',
            body: JSON.stringify({ reason: reason ?? '' }),
        });
    },

    async postpone(uuid: string, _reason?: string) {
        return orderService.update(uuid, { status: BookingStatus.POSTPONED });
    },

    async contactClient(uuid: string, message: string, subject?: string) {
        return apiFetch<{ sent: boolean }>(`Commandes/orders/${uuid}/contact-client/`, {
            method: 'POST',
            body: JSON.stringify({ message, subject }),
        });
    },

    async submitQuote(uuid: string, amount: number, description?: string, file?: File) {
        if (file) {
            const fd = new FormData();
            fd.append('order', uuid);
            fd.append('price', String(amount));
            fd.append('description', description ?? '');
            fd.append('pdf_file', file);
            await apiFetch<BackendQuote>('Commandes/quotes/', { method: 'POST', body: fd });
        } else {
            await apiFetch<BackendQuote>('Commandes/quotes/', {
                method: 'POST',
                body: JSON.stringify({ order: uuid, price: String(amount), description: description ?? '' }),
            });
        }
        return orderService.getById(uuid);
    },

    async validateQuote(uuid: string) {
        const existing = await apiFetch<BackendOrder>(`Commandes/orders/${uuid}/`);
        if (!existing.quote?.id) {
            throw new ApiError('Aucun devis à valider', 400);
        }
        await apiFetch(`Commandes/quotes/${existing.quote.id}/`, {
            method: 'PATCH',
            body: JSON.stringify({ status: mapQuoteStatusToBackend('accept') }),
        });
        return orderService.getById(uuid);
    },

    async refuseQuote(uuid: string) {
        const existing = await apiFetch<BackendOrder>(`Commandes/orders/${uuid}/`);
        if (!existing.quote?.id) {
            throw new ApiError('Aucun devis à refuser', 400);
        }
        await apiFetch(`Commandes/quotes/${existing.quote.id}/`, {
            method: 'PATCH',
            body: JSON.stringify({ status: mapQuoteStatusToBackend('reject') }),
        });
        return orderService.getById(uuid);
    },

    async contactProvider(_uuid: string) {
        return { data: { ok: true } };
    },

    async startExecution(uuid: string) {
        return orderService.update(uuid, { status: BookingStatus.IN_PROGRESS });
    },

    async complete(uuid: string) {
        return orderService.update(uuid, { status: BookingStatus.COMPLETED });
    },

    async close(uuid: string) {
        return orderService.update(uuid, { status: BookingStatus.COMPLETED });
    },

    async cancel(uuid: string, _reason?: string) {
        return orderService.update(uuid, { status: BookingStatus.CANCELLED });
    },

    async remove(uuid: string): Promise<void> {
        await apiFetch(`Commandes/orders/${uuid}/`, { method: 'DELETE' });
    },

    async pay(uuid: string, _method: PaymentMethod) {
        const raw = await apiFetch<BackendOrder>(`Commandes/orders/${uuid}/pay/`, { method: 'POST' });
        const assignments = await fetchAssignmentsByOrder();
        return { data: mapOrderFromBackend(raw, toMapperExtras(assignments.get(raw.uuid))) };
    },

    async review(uuid: string, rating: number, comment?: string, providerId?: number) {
        if (!providerId) throw new ApiError('Prestataire inconnu pour cette commande.', 400);
        const { reviewService } = await import('./review.service');
        await reviewService.create(providerId, rating, uuid, comment);
        return { data: { ok: true } };
    },

    async findAvailableProviders(_uuid: string) {
        const { providerService } = await import('./provider.service');
        return providerService.getAll();
    },
};
