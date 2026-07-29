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
}

export interface BackendCategory {
    id: number;
    nom: string;
    description: string;
}

export type BackendOrderStatus =
    | 'CREEE'
    | 'EN_TRAITEMENT'
    | 'ASSIGNEE'
    | 'ACCEPTEE'
    | 'REFUSEE'
    | 'REPORTEE'
    | 'EN_COURS'
    | 'TERMINEE'
    | 'ANNULEE';

export type BackendQuoteStatus = 'ENVOYE' | 'ACCEPTE' | 'REFUSE';

export interface BackendQuote {
    id: number;
    status: BackendQuoteStatus;
    price: string;
    order: number;
}

export interface BackendOrder {
    id: number;
    status: BackendOrderStatus;
    description: string;
    localisation: string;
    date: string;
    budget: number;
    images?: string | null;
    category: number;
    category_nom?: string;
    client: number;
    client_detail?: BackendUser;
    quote?: BackendQuote | null;
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

export type BackendAssignmentStatus = 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE';

export interface BackendAssignment {
    id: number;
    methode: string;
    status: BackendAssignmentStatus;
    reason?: string;
    order: number;
    prestataire: number;
    qualifier: number;
}

export interface BackendNote {
    id: number;
    etoile: number;
    commentaire: string;
    prestataire: number;
    author: number;
    author_username?: string;
}

export type BackendNotificationType = 'PROVIDER_ASSIGNED' | 'PROVIDER_RESPONSE' | 'REASSIGNMENT_NEEDED';

export interface BackendNotification {
    id: number;
    user: number;
    type: BackendNotificationType;
    title: string;
    message: string;
    order?: number | null;
    is_read: boolean;
    date_creation: string;
}

export interface BackendService {
    id: number;
    prestataire: number;
    category: number;
    category_nom?: string;
    price: string;
    city: string;
    description: string;
    date_creation?: string;
}

export interface JwtPair {
    access: string;
    refresh: string;
}
