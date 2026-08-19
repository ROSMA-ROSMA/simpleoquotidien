/** Types bruts renvoyés par l'API Django — ne pas utiliser directement dans l'UI. */

export type BackendRole = 'CLIENT' | 'PRESTATAIRE' | 'AGENT' | 'ADMIN';

export interface BackendUser {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    role: BackendRole;
    pays: string;
    is_active?: boolean;
}

export interface BackendCategory {
    id: number;
    nom: string;
    description: string;
    image?: string | null;
}

export type BackendOrderStatus =
    | 'CREEE'
    | 'EN_TRAITEMENT'
    | 'ASSIGNEE'
    | 'ACCEPTEE'
    | 'REFUSEE'
    | 'REPORTEE'
    | 'A_REASSIGNER'
    | 'EN_COURS'
    | 'TERMINEE'
    | 'ANNULEE';

export type BackendQuoteStatus = 'ENVOYE' | 'ACCEPTE' | 'REFUSE';

export interface BackendPayment {
    id: number;
    montant: string;
    statut: string;
    transaction_id: string;
    date_creation?: string;
}

export interface BackendQuote {
    id: number;
    status: BackendQuoteStatus;
    price: string;
    description?: string | null;
    pdf_file?: string | null;
    order: string;
}

export interface BackendOrder {
    id: number;
    uuid: string;
    status: BackendOrderStatus;
    description: string;
    localisation: string;
    date: string;
    budget: number;
    images?: string | null;
    voice_note?: string | null;
    category: number;
    category_nom?: string;
    client: number;
    client_detail?: BackendUser;
    quote?: BackendQuote | null;
    payment?: BackendPayment | null;
}

export interface BackendPrestataire {
    id: number;
    user: BackendUser;
    company_name: string;
    services: string;
    zones_couvertes: string;
    langue: string;
    tarif: string;
    verification_status: string;
    cni_passeport?: string;
    justificatif?: string;
    photo?: string;
    date_creation?: string;
    date_modification?: string;
}

export type BackendAssignmentStatus = 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE' | 'EXPIREE';

export interface BackendAssignment {
    id: number;
    methode: string;
    status: BackendAssignmentStatus;
    motif_refus?: string | null;
    date_reponse?: string | null;
    date_creation?: string;
    order: string;
    prestataire: number;
    qualifier: number;
}

export interface BackendNote {
    id: number;
    etoile: number;
    commentaire: string;
    prestataire: number;
    author: number;
    author_email?: string;
    date_creation?: string;
}

export type BackendNotificationType =
    | 'QUOTE_REFUSED'
    | 'NEW_ORDER_CREATED'
    | 'REASSIGNMENT_NEEDED'
    | 'NEW_ASSIGNMENT'
    | 'QUOTE_ACCEPTED'
    | 'PRESTATAIRE_ASSIGNED'
    | 'NEW_QUOTE_RECEIVED';

export interface BackendNotification {
    id: number;
    titre: string;
    message: string;
    type_notification: BackendNotificationType;
    type_notification_display?: string;
    order?: string | null;
    est_lu: boolean;
    date_creation: string;
}

export interface BackendService {
    id: number;
    prestataire: number;
    prestataire_nom?: string;
    category: number;
    category_nom?: string;
    price: string;
    city: string;
    description: string;
    image?: string | null;
    date_creation?: string;
}

export interface JwtPair {
    access: string;
    refresh: string;
}
