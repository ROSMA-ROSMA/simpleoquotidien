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
    BackendPayment,
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
    Payment,
    PaymentStatus,
    PaymentMethod,
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
        is_active: u.is_active ?? true,
        // Le statut de validation réel des prestataires vit sur PrestataireProfile.verification_status,
        // pas sur Utilisateur — voir providerService pour la valeur exacte.
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
        image: c.image ?? undefined,
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
    A_REASSIGNER: BookingStatus.REASSIGNMENT_NEEDED,
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
    [BookingStatus.REASSIGNMENT_NEEDED]: 'A_REASSIGNER',
    [BookingStatus.POSTPONED]: 'REPORTEE',
    [BookingStatus.IN_PROGRESS]: 'EN_COURS',
    [BookingStatus.COMPLETED]: 'TERMINEE',
    [BookingStatus.CANCELLED]: 'ANNULEE',
};

function resolveBookingStatus(order: BackendOrder): BookingStatus {
    // 'ENVOYE' n'a pas d'équivalent dans Order.status (le devis est en attente
    // de décision côté client) — dans tous les autres cas, order.status est déjà
    // tenu à jour par le backend au fil du cycle de vie (devis accepté → en
    // cours → terminée) et doit rester la seule source de vérité : le figer sur
    // CONFIRMED dès l'acceptation du devis masquait tout ce qui se passait après
    // (démarrage et fin d'intervention invisibles pour prestataire/agent/admin).
    if (order.quote?.status === 'ENVOYE') return BookingStatus.QUOTE_SENT;
    return ORDER_STATUS_TO_BOOKING[order.status] ?? BookingStatus.PENDING;
}

/** Le paiement n'a que 2 statuts utiles côté client : pas encore payé (absent),
 * ou 'PAYEE' — pas de granularité EN_ATTENTE/ECHOUE exposée côté back pour l'instant. */
export function mapPaymentFromBackend(p: BackendPayment, orderId: number): Payment {
    return {
        id: p.id,
        booking_id: orderId,
        amount: parseFloat(p.montant),
        payment_method: PaymentMethod.MOBILE_MONEY,
        status: p.statut === 'PAYEE' ? PaymentStatus.SUCCESS : PaymentStatus.PENDING,
        transaction_ref: p.transaction_id,
        created_at: p.date_creation,
    };
}

export function mapOrderFromBackend(
    order: BackendOrder,
    extras?: {
        assigned_provider_id?: number;
        assigned_provider?: Provider;
        assignment_id?: number;
        assignment_status?: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE' | 'EXPIREE';
    },
): Booking {
    const quotePrice = order.quote?.price ? parseFloat(order.quote.price) : undefined;
    return {
        id: order.id,
        uuid: order.uuid,
        client_id: order.client,
        client: order.client_detail ? mapUserFromBackend(order.client_detail) : undefined,
        category_id: order.category,
        category_name: order.category_nom,
        scheduled_datetime: order.date,
        address: order.localisation,
        message: order.description,
        audio_note: order.voice_note ?? undefined,
        total_amount: quotePrice ?? order.budget,
        status: resolveBookingStatus(order),
        quote_amount: quotePrice,
        quote_id: order.quote?.id,
        quote_status: order.quote?.status,
        quote_description: order.quote?.description ?? undefined,
        quote_pdf_url: order.quote?.pdf_file ?? undefined,
        assigned_provider_id: extras?.assigned_provider_id,
        assigned_provider: extras?.assigned_provider,
        assignment_id: extras?.assignment_id,
        assignment_status: extras?.assignment_status,
        payment: order.payment ? mapPaymentFromBackend(order.payment, order.id) : undefined,
        created_at: order.date,
    };
}

export function mapReviewFromBackend(note: BackendNote, booking?: Booking): Review {
    return {
        id: note.id,
        booking_id: booking?.id ?? 0,
        booking_uuid: note.order,
        booking,
        provider_id: note.prestataire,
        provider: booking?.assigned_provider,
        rating: note.etoile,
        comment: note.commentaire,
        author_username: note.author_email,
        created_at: note.date_creation,
    };
}

export function mapQuoteStatusToBackend(status: 'accept' | 'reject'): BackendQuoteStatus {
    return status === 'accept' ? 'ACCEPTE' : 'REFUSE';
}

export function mapServiceFromBackend(s: BackendService): ProviderService {
    return {
        id: s.id,
        prestataire_id: s.prestataire,
        prestataire_name: s.prestataire_nom,
        category_id: s.category,
        category_name: s.category_nom,
        price: parseFloat(s.price),
        city: s.city,
        description: s.description,
        image: s.image ?? undefined,
        created_at: s.date_creation,
    };
}

const NOTIFICATION_TYPE_MAP: Record<BackendNotification['type_notification'], NotificationType> = {
    QUOTE_REFUSED: 'reassignment_needed',
    NEW_ORDER_CREATED: 'order_created',
    REASSIGNMENT_NEEDED: 'reassignment_needed',
    NEW_ASSIGNMENT: 'provider_assigned',
    QUOTE_ACCEPTED: 'quote_validated',
    PRESTATAIRE_ASSIGNED: 'provider_assigned',
    NEW_QUOTE_RECEIVED: 'quote_received',
};

/** Le backend ne connaît pas le rôle du destinataire : on construit le lien
 * en fonction du rôle de l'utilisateur connecté qui consulte la liste. */
export function mapNotificationFromBackend(n: BackendNotification, viewerRole: UserRole): AppNotification {
    const base = viewerRole === UserRole.AGENT || viewerRole === UserRole.ADMIN ? '/agent/commandes' : '/booking';
    return {
        id: n.id,
        user_id: 0,
        type: NOTIFICATION_TYPE_MAP[n.type_notification] ?? 'order_created',
        title: n.titre,
        message: n.message,
        link: n.order ? `${base}/${n.order}` : undefined,
        is_read: n.est_lu,
        created_at: n.date_creation,
    };
}
