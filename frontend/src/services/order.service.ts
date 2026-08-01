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
    status: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE';
}

async function fetchAssignmentsByOrder(): Promise<Map<number, OrderAssignmentInfo>> {
    try {
        const raw = await apiFetch<BackendAssignment[] | { results: BackendAssignment[] }>(
            'api/utilisateurs/assignments/',
        );
        const list = unwrapList(raw);
        const map = new Map<number, OrderAssignmentInfo>();
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
    return orders.map(o => mapOrderFromBackend(o, toMapperExtras(assignments.get(o.id))));
}

export interface CreateOrderInput {
    category_id: number;
    scheduled_datetime: string;
    address: string;
    message?: string;
    budget: number;
}

export const orderService = {
    async getAll(filters?: {
        status?: BookingStatus;
        client_id?: number;
        provider_id?: number;
    }): Promise<LegacyApiResponse<Booking[]>> {
        const raw = await apiFetch<BackendOrder[] | { results: BackendOrder[] }>('api/commandes/orders/');
        let items = await mapOrdersList(unwrapList(raw));
        if (filters?.status) items = items.filter(b => b.status === filters.status);
        if (filters?.client_id) items = items.filter(b => b.client_id === filters.client_id);
        if (filters?.provider_id) {
            items = items.filter(b => b.assigned_provider_id === filters.provider_id);
        }
        items.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
        return { data: items, meta: { total: items.length } };
    },

    async getById(id: number): Promise<LegacyApiResponse<Booking>> {
        const raw = await apiFetch<BackendOrder>(`api/commandes/orders/${id}/`);
        const assignments = await fetchAssignmentsByOrder();
        const booking = mapOrderFromBackend(raw, toMapperExtras(assignments.get(raw.id)));
        return { data: booking };
    },

    async create(payload: CreateOrderInput): Promise<LegacyApiResponse<Booking>> {
        const body = {
            category: payload.category_id,
            date: payload.scheduled_datetime,
            localisation: payload.address,
            description: payload.message?.trim() || 'Demande de service',
            budget: payload.budget,
        };
        const raw = await apiFetch<BackendOrder>('api/commandes/orders/', {
            method: 'POST',
            body: JSON.stringify(body),
        });
        return { data: mapOrderFromBackend(raw) };
    },

    async update(id: number, patch: Partial<{ address: string; message: string; scheduled_datetime: string; budget: number; status: BookingStatus }>): Promise<LegacyApiResponse<Booking>> {
        const body: Record<string, unknown> = {};
        if (patch.address !== undefined) body.localisation = patch.address;
        if (patch.message !== undefined) body.description = patch.message;
        if (patch.scheduled_datetime !== undefined) body.date = patch.scheduled_datetime;
        if (patch.budget !== undefined) body.budget = patch.budget;
        if (patch.status !== undefined) {
            const backendStatus = BOOKING_STATUS_TO_ORDER[patch.status];
            if (backendStatus) body.status = backendStatus;
        }
        const raw = await apiFetch<BackendOrder>(`api/commandes/orders/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
        const assignments = await fetchAssignmentsByOrder();
        return {
            data: mapOrderFromBackend(raw, toMapperExtras(assignments.get(raw.id))),
        };
    },

    async assignProvider(bookingId: number, providerId: number, agentId: number) {
        await apiFetch('api/utilisateurs/assignments/', {
            method: 'POST',
            body: JSON.stringify({
                methode: 'MANUEL',
                order: bookingId,
                prestataire: providerId,
                qualifier: agentId,
            }),
        });
        await orderService.update(bookingId, { status: BookingStatus.ASSIGNED });
        return orderService.getById(bookingId);
    },

    async accept(assignmentId: number) {
        await apiFetch(`api/utilisateurs/assignments/${assignmentId}/accept/`, { method: 'POST' });
    },

    async refuse(assignmentId: number, reason?: string) {
        await apiFetch(`api/utilisateurs/assignments/${assignmentId}/refuse/`, {
            method: 'POST',
            body: JSON.stringify({ reason: reason ?? '' }),
        });
    },

    async postpone(bookingId: number, _reason?: string) {
        return orderService.update(bookingId, { status: BookingStatus.POSTPONED });
    },

    async contactClient(bookingId: number, message: string, subject?: string) {
        return apiFetch<{ sent: boolean }>(`api/commandes/orders/${bookingId}/contact-client/`, {
            method: 'POST',
            body: JSON.stringify({ message, subject }),
        });
    },

    async sendQuote(bookingId: number, amount: number, _note?: string) {
        const existing = await apiFetch<BackendOrder>(`api/commandes/orders/${bookingId}/`);
        if (existing.quote?.id) {
            await apiFetch<BackendQuote>(`api/commandes/quotes/${existing.quote.id}/`, {
                method: 'PATCH',
                body: JSON.stringify({ price: String(amount), status: 'ENVOYE' }),
            });
        } else {
            await apiFetch<BackendQuote>('api/commandes/quotes/', {
                method: 'POST',
                body: JSON.stringify({ order: bookingId, price: String(amount), status: 'ENVOYE' }),
            });
        }
        return orderService.getById(bookingId);
    },

    async validateQuote(bookingId: number) {
        const existing = await apiFetch<BackendOrder>(`api/commandes/orders/${bookingId}/`);
        if (!existing.quote?.id) {
            throw new ApiError('Aucun devis à valider', 400);
        }
        await apiFetch(`api/commandes/quotes/${existing.quote.id}/`, {
            method: 'PATCH',
            body: JSON.stringify({ status: mapQuoteStatusToBackend('accept') }),
        });
        return orderService.getById(bookingId);
    },

    async contactProvider(_bookingId: number) {
        return { data: { ok: true } };
    },

    async startExecution(bookingId: number) {
        return orderService.update(bookingId, { status: BookingStatus.IN_PROGRESS });
    },

    async complete(bookingId: number) {
        return orderService.update(bookingId, { status: BookingStatus.COMPLETED });
    },

    async close(bookingId: number) {
        return orderService.update(bookingId, { status: BookingStatus.COMPLETED });
    },

    async cancel(bookingId: number, _reason?: string) {
        return orderService.update(bookingId, { status: BookingStatus.CANCELLED });
    },

    async pay(_bookingId: number, _method: PaymentMethod) {
        throw new ApiError('Paiement en ligne non connecté au backend.', 501);
    },

    async review(_bookingId: number, rating: number, comment?: string, providerId?: number) {
        if (!providerId) throw new ApiError('Prestataire inconnu pour cette commande.', 400);
        await apiFetch('api/utilisateurs/notes/', {
            method: 'POST',
            body: JSON.stringify({
                etoile: rating,
                commentaire: comment ?? '',
                prestataire: providerId,
            }),
        });
        return { data: { ok: true } };
    },

    async findAvailableProviders(_bookingId: number) {
        const { providerService } = await import('./provider.service');
        return providerService.getAll();
    },
};
