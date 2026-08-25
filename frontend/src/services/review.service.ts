import { apiFetch, unwrapList } from '@/lib/api/client';
import { BackendNote } from '@/types/backend';

export interface RatingSummary {
    average: number;
    count: number;
}

const NOTES_PATH = 'Info_utilisateurs/notes/';

function summarize(notes: BackendNote[]): RatingSummary {
    if (notes.length === 0) return { average: 0, count: 0 };
    const total = notes.reduce((sum, n) => sum + n.etoile, 0);
    return { average: total / notes.length, count: notes.length };
}

export const reviewService = {
    /** Toutes les notes (1-5 + commentaire) laissées par les clients — utilisé pour la
     * modération admin et pour calculer la note moyenne de chaque prestataire côté frontend
     * (le backend n'expose pas de filtre par prestataire, donc on filtre ici). */
    async getAll(): Promise<BackendNote[]> {
        const raw = await apiFetch<BackendNote[] | { results: BackendNote[] }>(NOTES_PATH);
        return unwrapList(raw);
    },

    async getByProvider(prestataireId: number): Promise<BackendNote[]> {
        const all = await reviewService.getAll();
        return all.filter(n => n.prestataire === prestataireId);
    },

    /** Tous les avis laissés par un client donné — sert à afficher "Mes avis" et à savoir
     * quelles commandes terminées restent à noter (via note.order). */
    async getMine(authorId: number): Promise<BackendNote[]> {
        const all = await reviewService.getAll();
        return all.filter(n => n.author === authorId);
    },

    async getSummaryForProvider(prestataireId: number): Promise<RatingSummary> {
        return summarize(await reviewService.getByProvider(prestataireId));
    },

    /** Note moyenne + nombre d'avis pour chaque prestataire en une seule requête liste —
     * à utiliser dès qu'on affiche plusieurs prestataires côte à côte (matching / comparaison). */
    async getSummaryByProvider(): Promise<Map<number, RatingSummary>> {
        const all = await reviewService.getAll();
        const byProvider = new Map<number, BackendNote[]>();
        for (const note of all) {
            const list = byProvider.get(note.prestataire);
            if (list) list.push(note);
            else byProvider.set(note.prestataire, [note]);
        }
        const result = new Map<number, RatingSummary>();
        for (const [providerId, notes] of byProvider) result.set(providerId, summarize(notes));
        return result;
    },

    /** Le client note le prestataire qui a réalisé son service (1-5 étoiles + commentaire),
     * rattaché à la commande évaluée pour empêcher une double notation côté serveur. */
    async create(prestataireId: number, etoile: number, orderUuid: string, commentaire?: string): Promise<BackendNote> {
        return apiFetch<BackendNote>(NOTES_PATH, {
            method: 'POST',
            body: JSON.stringify({ etoile, commentaire: commentaire ?? '', prestataire: prestataireId, order: orderUuid }),
        });
    },

    /** Modération admin — supprime un avis (ex. contenu abusif/hors-sujet). */
    async remove(id: number): Promise<void> {
        await apiFetch(`${NOTES_PATH}${id}/`, { method: 'DELETE' });
    },
};
