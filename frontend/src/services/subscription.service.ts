import { apiFetch, unwrapList } from '@/lib/api/client';
import { mapSubscriptionFromBackend } from '@/lib/mappers/backend';
import { BackendSubscription } from '@/types/backend';
import { Subscription } from '@/types';

const SUBSCRIPTIONS_PATH = 'Info_utilisateurs/subscriptions/';

export interface CreateSubscriptionInput {
    prestataire_id: number;
    plan: number;
    statut: string;
    mode_payment: string;
}

export const subscriptionService = {
    /** Tous les abonnements — le backend n'expose pas de filtre par prestataire pour
     * ce endpoint, donc on filtre côté client (même approche que reviewService avant
     * l'ajout du filtre côté NotesViewSet). */
    async getAll(): Promise<Subscription[]> {
        const raw = await apiFetch<BackendSubscription[] | { results: BackendSubscription[] }>(SUBSCRIPTIONS_PATH);
        return unwrapList(raw).map(mapSubscriptionFromBackend);
    },

    async getByProvider(prestataireId: number): Promise<Subscription[]> {
        const all = await subscriptionService.getAll();
        return all.filter(s => s.prestataire_id === prestataireId);
    },

    /** Abonnement le plus récent d'un prestataire — utilisé pour afficher le plan actuel. */
    async getCurrentForProvider(prestataireId: number): Promise<Subscription | null> {
        const mine = await subscriptionService.getByProvider(prestataireId);
        if (mine.length === 0) return null;
        return [...mine].sort((a, b) => (b.date_creation ?? '').localeCompare(a.date_creation ?? ''))[0];
    },

    /** Souscrit ou change de plan — crée un nouvel enregistrement Subscription
     * (le plan actuel est déduit du plus récent, il n'y a pas d'update en place). */
    async create(payload: CreateSubscriptionInput): Promise<Subscription> {
        const raw = await apiFetch<BackendSubscription>(SUBSCRIPTIONS_PATH, {
            method: 'POST',
            body: JSON.stringify({
                prestataire: payload.prestataire_id,
                plan: payload.plan,
                statut: payload.statut,
                mode_payment: payload.mode_payment,
            }),
        });
        return mapSubscriptionFromBackend(raw);
    },
};
