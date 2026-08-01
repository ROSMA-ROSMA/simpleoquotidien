import {
    BackendUser,
    BackendCategory,
    BackendOrder,
    BackendPrestataire,
    BackendNote,
    BackendOrderStatus,
    BackendQuoteStatus,
    BackendService,
    BackendNotification,
} from '@/types/backend';
import {
    User,
    UserRole,
    Category,
    Booking,
    BookingStatus,
    Provider,
    Review,
    ProviderService,
    AppNotification,
    NotificationType,
} from '@/types';

const CATEGORY_ICONS = ['home-heart', 'tool', 'wash', 'heart', 'truck-delivery', 'shield', 'pen-tool', 'key'];

export function mapRoleFromBackend(role: string): UserRole {
    const map: Record<string, UserRole> = {
        CLIENT: UserRole.CLIENT,
        PRESTATAIRE: UserRole.PROVIDER,
        AGENT: UserRole.AGENT,
        ADMIN: UserRole.ADMIN,
    };
    return map[role] ?? UserRole.CLIENT;
}

export function mapRoleToBackend(role: UserRole | 'client' | 'provider'): BackendUser['role'] {
    const r = role as string;
    if (r === UserRole.CLIENT || r === 'client') return 'CLIENT';
    if (r === UserRole.PROVIDER || r === 'provider') return 'PRESTATAIRE';
    if (r === UserRole.AGENT) return 'AGENT';
    return 'ADMIN';
}

export function mapUserFromBackend(u: BackendUser): User {
    return {
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        role: mapRoleFromBackend(u.role),
        is_active: true,
        is_verified: true,
        pays: u.pays,
    };
}

export function mapCategoryFromBackend(c: BackendCategory, index = 0): Category {
    return {
        id: c.id,
        name: c.nom,
        description: c.description,
        icon: CATEGORY_ICONS[index % CATEGORY_ICONS.length],
    };
}

export function mapProviderFromBackend(p: BackendPrestataire): Provider {
    return {
        id: p.id,
        user_id: p.user.id,
        email: p.user.email,
        first_name: p.user.first_name,
        last_name: p.user.last_name,
        pays: p.user.pays,
        company_name: p.company_name,
        services: p.services,
        zones_couvertes: p.zones_couvertes,
        langue: p.langue,
        tarif: p.tarif,
        verification_status: p.verification_status,
        role: UserRole.PROVIDER,
        cni_passeport: p.cni_passeport,
        justificatif: p.justificatif,
        photo: p.photo,
    };
}

const ORDER_STATUS_TO_BOOKING: Record<BackendOrderStatus, BookingStatus> = {
    CREEE: BookingStatus.PENDING,
    EN_TRAITEMENT: BookingStatus.PROCESSING,
    ASSIGNEE: BookingStatus.ASSIGNED,
    ACCEPTEE: BookingStatus.CONFIRMED,
    REFUSEE: BookingStatus.REASSIGNMENT_NEEDED,
    REPORTEE: BookingStatus.POSTPONED,
    EN_COURS: BookingStatus.IN_PROGRESS,
    TERMINEE: BookingStatus.COMPLETED,
    ANNULEE: BookingStatus.CANCELLED,
};

export const BOOKING_STATUS_TO_ORDER: Partial<Record<BookingStatus, BackendOrderStatus>> = {
    [BookingStatus.PENDING]: 'CREEE',
    [BookingStatus.PROCESSING]: 'EN_TRAITEMENT',
    [BookingStatus.ASSIGNED]: 'ASSIGNEE',
    [BookingStatus.CONFIRMED]: 'ACCEPTEE',
    [BookingStatus.REJECTED]: 'REFUSEE',
    [BookingStatus.REASSIGNMENT_NEEDED]: 'REFUSEE',
    [BookingStatus.POSTPONED]: 'REPORTEE',
    [BookingStatus.IN_PROGRESS]: 'EN_COURS',
    [BookingStatus.COMPLETED]: 'TERMINEE',
    [BookingStatus.CANCELLED]: 'ANNULEE',
};

function resolveBookingStatus(order: BackendOrder): BookingStatus {
    if (order.quote?.status === 'ENVOYE') return BookingStatus.QUOTE_SENT;
    if (order.quote?.status === 'ACCEPTE') return BookingStatus.CONFIRMED;
    return ORDER_STATUS_TO_BOOKING[order.status] ?? BookingStatus.PENDING;
}

export function mapOrderFromBackend(
    order: BackendOrder,
    extras?: {
        assigned_provider_id?: number;
        assigned_provider?: Provider;
        assignment_id?: number;
        assignment_status?: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE';
    },
): Booking {
    const quotePrice = order.quote?.price ? parseFloat(order.quote.price) : undefined;
    return {
        id: order.id,
        client_id: order.client,
        client: order.client_detail ? mapUserFromBackend(order.client_detail) : undefined,
        category_id: order.category,
        category_name: order.category_nom,
        scheduled_datetime: order.date,
        address: order.localisation,
        message: order.description,
        total_amount: quotePrice ?? order.budget,
        status: resolveBookingStatus(order),
        quote_amount: quotePrice,
        quote_id: order.quote?.id,
        quote_status: order.quote?.status,
        assigned_provider_id: extras?.assigned_provider_id,
        assigned_provider: extras?.assigned_provider,
        assignment_id: extras?.assignment_id,
        assignment_status: extras?.assignment_status,
        created_at: order.date,
    };
}

export function mapReviewFromBackend(note: BackendNote, provider?: Provider): Review {
    return {
        id: note.id,
        booking_id: 0,
        provider_id: note.prestataire,
        provider,
        rating: note.etoile,
        comment: note.commentaire,
        author_username: note.author_username,
    };
}

export function mapQuoteStatusToBackend(status: 'accept' | 'reject'): BackendQuoteStatus {
    return status === 'accept' ? 'ACCEPTE' : 'REFUSE';
}

export function mapServiceFromBackend(s: BackendService): ProviderService {
    return {
        id: s.id,
        prestataire_id: s.prestataire,
        category_id: s.category,
        category_name: s.category_nom,
        price: parseFloat(s.price),
        city: s.city,
        description: s.description,
        created_at: s.date_creation,
    };
}

const NOTIFICATION_TYPE_MAP: Record<BackendNotification['type'], NotificationType> = {
    PROVIDER_ASSIGNED: 'provider_assigned',
    PROVIDER_RESPONSE: 'provider_response',
    REASSIGNMENT_NEEDED: 'reassignment_needed',
};

export function mapNotificationFromBackend(n: BackendNotification): AppNotification {
    return {
        id: n.id,
        user_id: n.user,
        type: NOTIFICATION_TYPE_MAP[n.type] ?? 'order_created',
        title: n.title,
        message: n.message,
        link: n.order ? `/agent/commandes/${n.order}` : undefined,
        is_read: n.is_read,
        created_at: n.date_creation,
    };
}
