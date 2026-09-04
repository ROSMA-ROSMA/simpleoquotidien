// ─── Enums ───────────────────────────────────────────────────

export enum UserRole {
    CLIENT = 'client',
    PROVIDER = 'provider',
    AGENT = 'agent',
    ADMIN = 'admin',
}

export enum BookingStatus {
    PENDING = 'pending',                       // Commande créée, en attente de traitement agent
    PROCESSING = 'processing',                 // Traitement par l'agent / recherche prestataire
    ASSIGNED = 'assigned',                     // Prestataire assigné, en attente de réponse
    REASSIGNMENT_NEEDED = 'reassignment_needed', // Refus/report -> agent doit réassigner
    QUOTE_SENT = 'quote_sent',                 // Devis envoyé au client
    CONFIRMED = 'confirmed',                   // Devis validé par le client / prestataire accepté
    IN_PROGRESS = 'in_progress',                // Exécution en cours
    COMPLETED = 'completed',                    // Commande terminée
    CLOSED = 'closed',                          // Clôturée (après avis/paiement)
    CANCELLED = 'cancelled',
    REJECTED = 'rejected',                      // Refusée par le prestataire
    POSTPONED = 'postponed',                    // Reportée par le prestataire
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
    [BookingStatus.PENDING]: 'Créée',
    [BookingStatus.PROCESSING]: "Traitement agent",
    [BookingStatus.ASSIGNED]: 'Assignée',
    [BookingStatus.REASSIGNMENT_NEEDED]: 'À réassigner',
    [BookingStatus.QUOTE_SENT]: 'Devis envoyé',
    [BookingStatus.CONFIRMED]: 'Validée',
    [BookingStatus.IN_PROGRESS]: 'En cours',
    [BookingStatus.COMPLETED]: 'Terminée',
    [BookingStatus.CLOSED]: 'Clôturée',
    [BookingStatus.CANCELLED]: 'Annulée',
    [BookingStatus.REJECTED]: 'Refusée',
    [BookingStatus.POSTPONED]: 'Reportée',
};

export enum PaymentStatus {
    PENDING = 'pending',
    SUCCESS = 'success',
    FAILED = 'failed',
    REFUNDED = 'refunded',
}

export enum PaymentMethod {
    CASH = 'cash',
    MOBILE_MONEY = 'mobile_money',
    BANK_TRANSFER = 'bank_transfer',
    CARD = 'card',
}

export enum MessageStatus {
    SENT = 'sent',
    DELIVERED = 'delivered',
    READ = 'read',
}

export enum DocumentType {
    IDENTITY_CARD = 'identity_card',
    RECENT_PHOTO = 'recent_photo',
    OTHER = 'other',
}

// ─── Models ──────────────────────────────────────────────────

export interface UserDocument {
    id: number;
    user_id: number;
    file_path: string;
    filename: string;
    document_type: DocumentType;
}

export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    role: UserRole;
    is_active: boolean;
    is_verified: boolean;
    pays?: string;
    insurance_status?: boolean;
    identity_card_expiry_date?: string;
    preferred_language?: string;
    avatar_url?: string;
    documents?: UserDocument[];
    /** @deprecated Utiliser zones_couvertes sur Provider */
    intervention_city?: string;
    created_at?: string;
}

export interface Provider {
    id: number;
    /** Id de l'Utilisateur lié (à ne pas confondre avec `id`, celui du profil PrestataireProfile). */
    user_id: number;
    email: string;
    first_name: string;
    last_name: string;
    pays: string;
    company_name: string;
    services: string;
    zones_couvertes: string;
    langue: string;
    tarif: string;
    verification_status: string;
    role?: UserRole;
    cni_passeport?: string;
    justificatif?: string;
    photo?: string;
}

export interface Subscription {
    id: number;
    prestataire_id: number;
    plan: number;
    statut: string;
    mode_payment: string;
    date_creation?: string;
}

export interface Category {
    id: number;
    name: string;
    description: string;
    icon: string;
    image?: string;
}

export interface Service {
    id: number;
    name: string;
    description: string;
    price: number;
    category_id: number;
    category?: Category;
    provider_id: number;
    provider?: User;
    image?: string;
    location?: string;
    languages?: string;
    rating: number;
    review_count?: number;
    is_active?: boolean;
    created_at?: string;
}

/** Service réel créé par un prestataire, connecté au backend (catégories admin). */
export interface ProviderService {
    id: number;
    prestataire_id: number;
    prestataire_name?: string;
    category_id: number;
    category_name?: string;
    price: number;
    city: string;
    description?: string;
    image?: string;
    created_at?: string;
}

export interface Booking {
    id: number;
    /** uuid Order backend — présent pour toute commande réelle (absent seulement sur les données mock legacy). */
    uuid?: string;
    client_id: number;
    client?: User;
    /** Catégorie de la commande (modèle backend). */
    category_id: number;
    category?: Category;
    category_name?: string;
    /** @deprecated Ancien modèle mock — préférer category_id */
    service_id?: number;
    service?: Service;
    scheduled_datetime: string;
    address: string;
    message?: string;
    audio_note?: string;
    total_amount: number;
    status: BookingStatus;
    payment?: Payment;
    review?: Review;
    agent_id?: number;
    assigned_provider_id?: number;
    assigned_provider?: Provider;
    assignment_id?: number;
    assignment_status?: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE' | 'EXPIREE';
    intervention_city?: string;
    quote_id?: number;
    quote_status?: string;
    quote_amount?: number;
    quote_description?: string;
    quote_pdf_url?: string;
    history?: BookingHistoryEntry[];
    created_at?: string;
}

export interface BookingHistoryEntry {
    id: number;
    booking_id: number;
    status: BookingStatus;
    note?: string;
    actor_role?: UserRole;
    created_at: string;
}

export type NotificationType =
    | 'order_created'
    | 'provider_assigned'
    | 'provider_contacted'
    | 'quote_received'
    | 'quote_validated'
    | 'order_completed'
    | 'payment_simulated'
    | 'profile_updated'
    | 'reassignment_needed'
    | 'provider_response';

export interface AppNotification {
    id: number;
    user_id: number;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

export interface Payment {
    id: number;
    booking_id: number;
    booking?: Booking;
    amount: number;
    payment_method: PaymentMethod;
    status: PaymentStatus;
    transaction_ref?: string;
    created_at?: string;
}

export interface Review {
    id: number;
    booking_id: number;
    /** uuid Order backend — identifiant réel de la commande évaluée. */
    booking_uuid?: string | null;
    booking?: Booking;
    provider_id?: number;
    provider?: Provider;
    rating: number;
    comment?: string;
    author_username?: string;
    created_at?: string;
}

export interface Message {
    id: number;
    sender_id: number;
    sender?: User;
    receiver_id: number;
    receiver?: User;
    content: string;
    status: MessageStatus;
    created_at: string;
}

export interface Conversation {
    id: number;
    participant: User;
    lastMessage: Message;
    unreadCount: number;
}

// ─── Form Types ──────────────────────────────────────────────

export interface LoginFormData {
    username: string;
    password: string;
}

export interface RegisterFormData {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    role: 'client' | 'provider';
    pays?: string;
    /** @deprecated Utiliser zones_couvertes lors de l'inscription prestataire */
    intervention_city?: string;
}

export interface BookingFormData {
    scheduled_date: string;
    scheduled_time: string;
    address: string;
    message?: string;
}

export interface ProfileFormData {
    first_name: string;
    last_name: string;
    phone_number: string;
    preferred_language?: string;
    intervention_city?: string;
    new_password?: string;
    confirm_password?: string;
}
